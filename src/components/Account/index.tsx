import styled from "styled-components";
import { useCallback } from "react";
import Transaction from "../../models/Transaction";
import { useAccount, useConnect, useWalletClient } from "wagmi";
import { DAI, CHAIN_GOERLI_ID } from "../../constants";
import { InjectedConnector } from "wagmi/connectors/injected";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid ${(props) => props.theme.colors.gray};
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${(props) => props.theme.colors.gray};
  margin: 8px 0;
`;

const Error = styled.p`
  color: ${(props) => props.theme.colors.red};
`;

function Account() {
  const { address, status } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { data: walletClient, error } = useWalletClient();

  const onMint = useCallback(async () => {
    if (walletClient) {
      try {
        await Transaction.doMint(DAI[CHAIN_GOERLI_ID]);
      } catch (error) {
        console.error(error);
      }
    }
  }, [walletClient]);

  return (
    <Wrapper>
      <b>Account</b>
      <Divider />
      {error ? (
        <Error>
          <b color={"red"}>Error:</b> {error?.name || error?.message}
        </Error>
      ) : (
        false
      )}
      {status === "connecting" || status === "reconnecting" ? (
        <p>
          <b>Status:</b> Connecting
        </p>
      ) : (
        false
      )}
      {status === "disconnected" ? (
        <p>
          <b>Status:</b> Not connected
          <span> . . . </span>
          <button
            onClick={() => {
              connect();
            }}
          >
            Connect
          </button>
        </p>
      ) : (
        false
      )}
      {status === "connected" ? (
        <>
          <p>
            <b>Status:</b> Connected
          </p>
          <p>
            <b>Address:</b> {address}
          </p>
          <Divider />
          <p>
            <b>Mint Goerli DAI for Tests</b>
            <span> . . . </span>
            <button onClick={onMint}>Mint</button>
          </p>
        </>
      ) : (
        false
      )}
    </Wrapper>
  );
}

export default Account;
