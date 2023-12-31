import _ from "lodash";
import type {
  IAmountWithDecimals,
  IAmountWithDecimals18,
  ISeconds,
  ICreateWithDurations,
  ICreateWithDeltas,
  ICreateWithMilestones,
  ISegmentD,
  ICreateWithRange,
  IAddress,
  IPermit2,
  ICreateSignature,
} from "../types";
import {
  CHAIN_GOERLI_ID,
  contracts,
  ERC20,
  PERMIT2_DOMAIN_NAME,
  PERMIT_EXPIRATION,
  PERMIT_SIG_EXPIRATION,
} from "../constants";
import SablierV2LockupLinear from "@sablier/v2-core/artifacts/SablierV2LockupLinear.json";
import SablierV2LockupDynamic from "@sablier/v2-core/artifacts/SablierV2LockupDynamic.json";
import ProxyAbi from "./Proxy";
import ProxyTargetAbi from "./ProxyTarget";
import { Permit2Abi } from "./Permit2";
import { UserRejectedRequestError, zeroAddress } from "viem";
import {
  getAccount,
  readContract,
  writeContract,
  waitForTransaction,
  signTypedData,
} from "wagmi/actions";
import BigNumber from "bignumber.js";
import { encodeFunctionData } from "viem";

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
BigNumber.config({ EXPONENTIAL_AT: 1e9 });

function expect(
  value: unknown,
  label: string
): value is NonNullable<typeof value> {
  if (_.isNil(value) || _.toString(value).length === 0) {
    throw new Error(`Missing parameter: ${label}`);
  }
  return true;
}

export function erroneous(error: unknown): Error | unknown {
  const name = _.get(error, "name") || "";
  const message = _.get(error, "message") || "";

  if (
    name === UserRejectedRequestError.name ||
    message.includes("User denied message signature") ||
    message.includes("User denied transaction signature")
  ) {
    return;
  } else {
    throw error;
  }
}

export default class Transaction {
  static async doApprove(
    spender: keyof (typeof contracts)[typeof CHAIN_GOERLI_ID],
    amount: bigint,
    state: {
      token: string | undefined;
    },
    log: (value: string) => void
  ) {
    console.log({ token: state.token });
    try {
      if (!expect(amount, "amount") || !expect(state.token, "token")) {
        return;
      }

      const decimals = await readContract({
        address: state.token as IAddress,
        abi: ERC20.abi,
        functionName: "decimals",
      });
      // const amount = BigInt(maxAmount) * 10n ** BigInt(decimals);

      const tx = await writeContract({
        address: state.token as IAddress,
        abi: ERC20.abi,
        functionName: "approve",
        args: [contracts[CHAIN_GOERLI_ID][spender], amount],
      });

      if (tx.hash) {
        log(`Token approval sent to the blockchain with hash: ${tx.hash}.`);
      }

      const receipt = await waitForTransaction({ hash: tx.hash });

      if (receipt?.status === "success") {
        log(`Token approval successfully registered.`);
      } else {
        log(`Token approval failed.`);
      }
    } catch (error) {
      erroneous(error);
    }
  }

  static async doMint(token: IAddress) {
    try {
      if (!expect(token, "token")) {
        return;
      }

      const decimals = await readContract({
        address: token,
        abi: ERC20.abi,
        functionName: "decimals",
      });

      /** We use BigNumber to convert float values to decimal padded BigInts */
      const padding = new BigNumber(10).pow(new BigNumber(decimals.toString()));
      const amount = BigInt(new BigNumber("100000").times(padding).toFixed());

      const sender = await getAccount().address;
      if (!expect(sender, "sender")) {
        return;
      }

      const _tx = await writeContract({
        address: token,
        abi: ERC20.abi,
        functionName: "mint",
        args: [sender, amount],
      });
    } catch (error) {
      erroneous(error);
    }
  }

  static async getNFT(streamId: string) {
    const res = (await readContract({
      address: contracts[CHAIN_GOERLI_ID].SablierV2LockupLinear as IAddress,
      abi: SablierV2LockupLinear.abi,
      functionName: "tokenURI",
      args: [streamId],
    })) as unknown as string;
    return res;
  }

  static async getNonce(
    ownerAddress: IAddress,
    tokenAddress: IAddress,
    spenderAddress: IAddress
  ) {
    const res = await readContract({
      address: contracts[CHAIN_GOERLI_ID].Permit2 as IAddress,
      abi: Permit2Abi,
      functionName: "allowance",
      args: [ownerAddress, tokenAddress, spenderAddress],
    });

    console.log("res: ", res);
    const amount: BigInt = res[0];
    const expiration: number = res[1];
    const nonce: number = res[2];

    return { amount, expiration, nonce };
  }

  static async createSignature(params: ICreateSignature): Promise<IPermit2> {
    const { token, spender, amount, chainId, nonce, signer, permit2A } = params;
    expect(chainId, "amount");
    expect(chainId, "chainId");
    expect(token, "token");
    expect(spender, "spender");
    expect(nonce, "nonce");
    expect(signer, "signer");

    console.log("params: ", params);

    function toEndDate(time: number) {
      return new BigNumber(Date.now())
        .plus(new BigNumber(time))
        .dividedToIntegerBy(new BigNumber(1000))
        .toString();
    }

    const expiration = toEndDate(PERMIT_EXPIRATION);
    const sigDeadline = toEndDate(PERMIT_SIG_EXPIRATION);

    const value = {
      details: {
        token: token!.address as IAddress,
        amount: BigInt(amount),
        expiration: _.toNumber(expiration),
        nonce,
      },
      spender: spender as IAddress,
      sigDeadline: BigInt(sigDeadline),
    } as const;

    const domain = {
      name: PERMIT2_DOMAIN_NAME,
      chainId,
      verifyingContract: permit2A as IAddress,
    } as const;

    const types = {
      PermitSingle: [
        { name: "details", type: "PermitDetails" },
        { name: "spender", type: "address" },
        { name: "sigDeadline", type: "uint256" },
      ],
      PermitDetails: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint160" },
        { name: "expiration", type: "uint48" },
        { name: "nonce", type: "uint48" },
      ],
    } as const;

    const signature = await signTypedData({
      account: signer.account?.address,
      domain,
      types,
      primaryType: "PermitSingle",
      message: value,
    });

    /**
     * While the signature needs to be constructed with primitive types,
     * the transaction build will require strong-typed attributes
     */

    return {
      permitSingle: {
        details: {
          amount: BigInt(value.details.amount),
          expiration: _.toNumber(value.details.expiration),
          nonce: _.toNumber(value.details.nonce),
          token: value.details.token as IAddress,
        },
        spender: value.spender as IAddress,
        sigDeadline: BigInt(value.sigDeadline),
      },
      signature,
    };
  }

  static async doCancelLinear(proxy: IAddress, streamId: string) {
    try {
      try {
        // encode data
        const data = encodeFunctionData({
          abi: ProxyTargetAbi,
          functionName: "cancel",
          args: [contracts[CHAIN_GOERLI_ID].SablierV2LockupLinear, streamId],
        });

        const tx = await writeContract({
          address: proxy,
          abi: ProxyAbi,
          functionName: "execute",
          args: [
            contracts[CHAIN_GOERLI_ID].SablierV2ProxyTarget, // target: address
            data, // data: bytes
          ],
        });

        if (tx.hash) {
          console.log(
            `LL Stream sent to the blockchain with hash: ${tx.hash}.`
          );
        }

        const receipt = await waitForTransaction({ hash: tx.hash });

        if (receipt?.status === "success") {
          console.log(`LL Stream successfully created.`);
        } else {
          console.log(`LL Stream creation failed.`);
        }
      } catch (error) {
        erroneous(error);
      }
    } catch (error) {
      erroneous(error);
    }
  }

  static async doCancelAndCreateLinear(
    streamId: string,
    proxy: IAddress,
    permit2Params: IPermit2,
    state: {
      amount: string | undefined;
      cancelability: boolean;
      cliff: string | undefined;
      recipient: string | undefined;
      token: string | undefined;
      duration: string | undefined;
    },
    log: (value: string) => void
  ) {
    console.log({
      streamId,
      proxy,
      permit2Params,
      state,
    });

    try {
      if (
        !expect(state.amount, "amount") ||
        !expect(state.cancelability, "cancelability") ||
        !expect(state.duration, "duration") ||
        !expect(state.recipient, "recipient") ||
        !expect(state.token, "token")
      ) {
        return;
      }

      const decimals = await readContract({
        address: state.token as IAddress,
        abi: ERC20.abi,
        functionName: "decimals",
      });

      /** We use BigNumber to convert float values to decimal padded BigInts */
      const padding = new BigNumber(10).pow(new BigNumber(decimals.toString()));
      const amount = BigInt(
        new BigNumber(state.amount).times(padding).toFixed()
      );

      const sender = await getAccount().address;
      if (!expect(sender, "sender")) {
        return;
      }

      const createParams: ICreateWithDurations = [
        sender,
        state.recipient as IAddress,
        amount,
        state.token as IAddress,
        state.cancelability,
        [0n, BigInt(state.duration)],
        [zeroAddress, 0n],
      ];

      console.log({ createParams });

      // encode data
      const data = encodeFunctionData({
        abi: ProxyTargetAbi,
        functionName: "cancelAndCreateWithDurations",
        args: [
          contracts[CHAIN_GOERLI_ID].SablierV2LockupLinear,
          streamId,
          contracts[CHAIN_GOERLI_ID].SablierV2LockupLinear,
          createParams,
          permit2Params,
        ],
      });

      console.log({ data });

      const tx = await writeContract({
        address: proxy,
        abi: ProxyAbi,
        functionName: "execute",
        args: [
          contracts[CHAIN_GOERLI_ID].SablierV2ProxyTarget, // target: address
          data, // data: bytes
        ],
      });

      if (tx.hash) {
        log(`LL Renew Stream sent to the blockchain with hash: ${tx.hash}.`);
      }

      const receipt = await waitForTransaction({ hash: tx.hash });

      if (receipt?.status === "success") {
        log(`LL Renew Stream successfully created.`);
      } else {
        log(`LL Renew Stream creation failed.`);
      }
    } catch (error) {
      erroneous(error);
    }
  }

  static async doCreateLinear(
    state: {
      amount: string | undefined;
      cancelability: boolean;
      cliff: string | undefined;
      recipient: string | undefined;
      token: string | undefined;
      duration: string | undefined;
    },
    log: (value: string) => void
  ) {
    try {
      if (
        !expect(state.amount, "amount") ||
        !expect(state.cancelability, "cancelability") ||
        !expect(state.duration, "duration") ||
        !expect(state.recipient, "recipient") ||
        !expect(state.token, "token")
      ) {
        return;
      }

      const decimals = await readContract({
        address: state.token as IAddress,
        abi: ERC20.abi,
        functionName: "decimals",
      });

      /** We use BigNumber to convert float values to decimal padded BigInts */
      const padding = new BigNumber(10).pow(new BigNumber(decimals.toString()));
      const amount = BigInt(
        new BigNumber(state.amount).times(padding).toFixed()
      );

      const sender = await getAccount().address;
      if (!expect(sender, "sender")) {
        return;
      }

      const cliff = (() => {
        try {
          if (
            !_.isNil(state.cliff) &&
            BigInt(state.cliff).toString() === state.cliff
          ) {
            return BigInt(state.cliff);
          }
        } catch (_error) {}
        return 0n;
      })();

      const payload: ICreateWithDurations = [
        sender,
        state.recipient as IAddress,
        amount,
        state.token as IAddress,
        state.cancelability,
        [cliff, BigInt(state.duration)],
        [zeroAddress, 0n],
      ];

      console.info("Payload", payload);

      const tx = await writeContract({
        address: contracts[CHAIN_GOERLI_ID].SablierV2LockupLinear,
        abi: SablierV2LockupLinear.abi,
        functionName: "createWithDurations",
        args: [payload],
      });

      if (tx.hash) {
        log(`LL Stream sent to the blockchain with hash: ${tx.hash}.`);
      }

      const receipt = await waitForTransaction({ hash: tx.hash });

      if (receipt?.status === "success") {
        log(`LL Stream successfully created.`);
      } else {
        log(`LL Stream creation failed.`);
      }
    } catch (error) {
      erroneous(error);
    }
  }

  static async doCreateDynamic(
    state: {
      cancelability: boolean;
      recipient: string | undefined;
      token: string | undefined;
      segments: {
        amount: string | undefined;
        delta: string | undefined;
        exponent: string | undefined;
      }[];
    },
    log: (value: string) => void
  ) {
    try {
      if (
        !expect(state.segments, "segments") ||
        !expect(state.cancelability, "cancelability") ||
        !expect(state.recipient, "recipient") ||
        !expect(state.token, "token")
      ) {
        return;
      }

      const decimals = await readContract({
        address: state.token as IAddress,
        abi: ERC20.abi,
        functionName: "decimals",
      });

      /** We use BigNumber to convert float values to decimal padded BigInts */
      const padding = new BigNumber(10).pow(new BigNumber(decimals.toString()));

      const sender = await getAccount().address;
      if (!expect(sender, "sender")) {
        return;
      }

      const segments: ISegmentD[] = state.segments.map((segment) => {
        if (
          !expect(segment.amount, "segment amount") ||
          !expect(segment.delta, "segment delta") ||
          !expect(segment.exponent, "segment exponent")
        ) {
          throw new Error("Expected valid segments.");
        }

        const amount: IAmountWithDecimals = BigInt(
          new BigNumber(segment.amount).times(padding).toFixed()
        );
        const delta: ISeconds = BigInt(segment.delta);
        const exponent: IAmountWithDecimals18 =
          BigInt(segment.exponent) * 10n ** 18n;

        const result: ISegmentD = [amount, exponent, delta];

        return result;
      });

      const amount = segments.reduce(
        (prev, curr) => prev + (curr?.[0] || 0n),
        0n
      );

      const payload: ICreateWithDeltas = [
        sender,
        state.cancelability,
        state.recipient as IAddress,
        amount,
        state.token as IAddress,
        [zeroAddress, 0n],
        segments,
      ];

      console.info("Payload", payload);

      const tx = await writeContract({
        address: contracts[CHAIN_GOERLI_ID].SablierV2LockupDynamic,
        abi: SablierV2LockupDynamic.abi,
        functionName: "createWithDeltas",
        args: [payload],
      });

      if (tx.hash) {
        log(`LD Stream sent to the blockchain with hash: ${tx.hash}.`);
      }

      const receipt = await waitForTransaction({ hash: tx.hash });

      if (receipt?.status === "success") {
        log(`LD Stream successfully created.`);
      } else {
        log(`LD Stream creation failed.`);
      }
    } catch (error) {
      erroneous(error);
    }
  }

  static async doCreateLinearWithDurationsRaw(payload: ICreateWithDurations) {
    const data = _.clone(payload);
    if (data[0].toString() === "<< YOUR CONNECTED ADDRESS AS THE SENDER >>") {
      const sender = await getAccount().address;
      if (!expect(sender, "sender")) {
        return;
      }
      data[0] = sender;
    }

    console.info("Payload", data);

    const tx = await writeContract({
      address: contracts[CHAIN_GOERLI_ID].SablierV2LockupLinear,
      abi: SablierV2LockupLinear.abi,
      functionName: "createWithDurations",
      args: [data],
    });
    return waitForTransaction({ hash: tx.hash });
  }

  static async doCreateLinearWithRangeRaw(payload: ICreateWithRange) {
    const data = _.clone(payload);
    if (data[0].toString() === "<< YOUR CONNECTED ADDRESS AS THE SENDER >>") {
      const sender = await getAccount().address;
      if (!expect(sender, "sender")) {
        return;
      }
      data[0] = sender;
    }

    console.info("Payload", data);

    const tx = await writeContract({
      address: contracts[CHAIN_GOERLI_ID].SablierV2LockupLinear,
      abi: SablierV2LockupLinear.abi,
      functionName: "createWithRange",
      args: [data],
    });
    return waitForTransaction({ hash: tx.hash });
  }

  static async doCreateDynamicWithDeltasRaw(payload: ICreateWithDeltas) {
    const data = _.clone(payload);
    if (data[0].toString() === "<< YOUR CONNECTED ADDRESS AS THE SENDER >>") {
      const sender = await getAccount().address;
      if (!expect(sender, "sender")) {
        return;
      }
      data[0] = sender;
    }

    console.info("Payload", data);

    const tx = await writeContract({
      address: contracts[CHAIN_GOERLI_ID].SablierV2LockupDynamic,
      abi: SablierV2LockupDynamic.abi,
      functionName: "createWithDeltas",
      args: [data],
    });
    return waitForTransaction({ hash: tx.hash });
  }

  static async doCreateDynamicWithMilestonesRaw(
    payload: ICreateWithMilestones
  ) {
    const data = _.clone(payload);
    if (data[0].toString() === "<< YOUR CONNECTED ADDRESS AS THE SENDER >>") {
      const sender = await getAccount().address;
      if (!expect(sender, "sender")) {
        return;
      }
      data[0] = sender;
    }

    console.info("Payload", data);

    const tx = await writeContract({
      address: contracts[CHAIN_GOERLI_ID].SablierV2LockupDynamic,
      abi: SablierV2LockupDynamic.abi,
      functionName: "createWithMilestones",
      args: [data],
    });
    return waitForTransaction({ hash: tx.hash });
  }
}
