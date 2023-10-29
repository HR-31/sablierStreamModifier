import styled from "styled-components";
import { Amount, Cancelability, Token, Recipient, Duration } from "./fields";
import { useCallback, useEffect, useState } from "react";
import Transaction from "../../../models/Transaction";
import useStoreForm from "./store";
import _ from "lodash";
import { useAccount, useWalletClient } from "wagmi";

import { IAddress, Stream } from "../../../types";
import BigNumber from "bignumber.js";
import { CHAIN_GOERLI_ID, contracts } from "../../../constants";
import { maxUint256 } from "viem";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 800px;
  padding: 30px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${(props) => props.theme.colors.gray};
  margin: 8px 0;
`;

const Button = styled.button`
  background: #ff9c00;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  margin-top: 10px;
  cursor: pointer;
`;

const Error = styled.p`
  color: ${(props) => props.theme.colors.red};
  margin-top: 16px;
`;

const Logs = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;

  label {
    font-weight: 700;
  }

  ul {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 12px;
    margin: 0 !important;
  }
`;

const Actions = styled.div`
  gap: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  & > div {
    height: 20px;
    width: 1px;
    background-color: ${(props) => props.theme.colors.gray};
    margin: 0px;
  }
`;

function LockupLinear({ stream }: { stream: Stream }) {
  const [permitAllowance, setPermitAllowance] = useState<{
    amount: BigInt;
    expiration: number;
    nonce: number;
  }>({
    amount: 0n,
    expiration: 0,
    nonce: 0,
  });

  console.log({ permitAllowance });

  const { address, isConnected } = useAccount();
  const { error, logs, update } = useStoreForm((state) => ({
    error: state.error,
    logs: state.logs,
    update: state.api.update,
  }));

  useEffect(() => {
    const reverseConversion = (amount: BigInt, decimals: number): string => {
      const padding = new BigNumber(10).pow(new BigNumber(decimals.toString()));
      const bigNumberAmount = new BigNumber(amount.toString());
      const originalAmount = bigNumberAmount.dividedBy(padding);

      return originalAmount.toString(); // or originalAmount.toNumber(), based on your needs
    };

    update({
      streamId: stream.tokenId,
      amount: reverseConversion(
        BigInt(stream.depositAmount),
        Number(stream.asset.decimals)
      ),
      cancelability: stream.cancelable,
      cliff: "0",
      duration: stream.duration,
      recipient: stream.recipient,
      token: stream.asset.address,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      const fetchPermitAllowance = async () => {
        const token = stream.asset.address as IAddress;
        const spender = stream.sender as IAddress;
        const res = await Transaction.getNonce(address, token, spender);
        setPermitAllowance(res);
      };

      fetchPermitAllowance();
    }
  }, [isConnected, address, stream.sender, stream.asset.address]);

  const onApprove = useCallback(async () => {
    if (isConnected) {
      const state = useStoreForm.getState();
      try {
        state.api.update({ error: undefined });
        await Transaction.doApprove(
          "Permit2",
          maxUint256,
          state,
          state.api.log
        );
      } catch (error) {
        state.api.update({ error: _.toString(error) });
      }
    }
  }, [isConnected]);

  const onCreate = useCallback(async () => {
    if (isConnected) {
      const state = useStoreForm.getState();
      try {
        state.api.update({ error: undefined });
        await Transaction.doCreateLinear(state, state.api.log);
      } catch (error) {
        state.api.update({ error: _.toString(error) });
      }
    }
  }, [isConnected]);

  const onCancel = useCallback(async () => {
    if (isConnected) {
      const state = useStoreForm.getState();
      try {
        state.api.update({ error: undefined });
        await Transaction.doCancelLinear(
          "0x033995651Bb930d9C98254b058a7d4d442a5c4ba",
          "335"
        );
      } catch (error) {
        state.api.update({ error: _.toString(error) });
      }
    }
  }, [isConnected]);

  const { data: walletClient } = useWalletClient();

  const onCancelAndCreate = useCallback(async () => {
    if (isConnected && address && walletClient) {
      console.log("address", address);
      const state = useStoreForm.getState();
      const proxy = stream.sender as IAddress;
      try {
        state.api.update({ error: undefined });
        const token = stream.asset.address as IAddress;
        const spender = stream.sender as IAddress;
        const { nonce } = await Transaction.getNonce(address, token, spender);
        console.log({ state, nonce });
        if (!state.amount) return;

        const amount =
          BigInt(state.amount) * 10n ** BigInt(stream.asset.decimals);

        const permit2Params = await Transaction.createSignature({
          amount: amount.toString(),
          token: stream.asset,
          spender,
          chainId: CHAIN_GOERLI_ID,
          nonce,
          signer: walletClient,
          permit2A: contracts[CHAIN_GOERLI_ID].Permit2,
        });

        console.log({ permit2Params });

        await Transaction.doCancelAndCreateLinear(
          stream.tokenId,
          proxy,
          permit2Params,
          state,
          state.api.log
        );
      } catch (error) {
        state.api.update({ error: _.toString(error) });
      }
    }
  }, [
    isConnected,
    stream.sender,
    address,
    walletClient,
    stream.asset,
    stream.tokenId,
  ]);

  return (
    <Wrapper>
      <Cancelability />
      <Token />
      <Amount />
      <Recipient />
      <Duration />

      <Divider />
      <Actions>
        {permitAllowance.amount === 0n && (
          <Button onClick={onApprove}>Approve token spending</Button>
        )}
        <Button onClick={onCancelAndCreate}>Renew stream</Button>
      </Actions>
      {error ? (
        <div style={{ width: 200 }}>
          <Error>{error}</Error>
        </div>
      ) : (
        false
      )}
      {logs.length ? (
        <>
          <Divider />
          <Logs>
            <label>Logs</label>
            <ul>
              {logs.map((log) => (
                <li key={log}>{log}</li>
              ))}
            </ul>
          </Logs>
        </>
      ) : (
        false
      )}
    </Wrapper>
  );
}

export default LockupLinear;
