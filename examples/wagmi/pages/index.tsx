"use-client";

import styled from "styled-components";
import Account from "../src/components/Account";
import Forms from "../src/components/Forms";
import { useCallback, useEffect, useState } from "react";

const Wrapper = styled.div`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 48px;
  gap: 48px;
`;

const Disclaimer = styled.div`
  width: 100%;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.theme.colors.orange};

  & > p {
    color: ${(props) => props.theme.colors.dark};
  }
`;

interface Asset {
  address: string;
  chainId: string;
  decimals: string;
  name: string;
  symbol: string;
}

interface Contract {
  address: string;
}

interface Stream {
  id: string;
  alias: string;
  category: string;
  tokenId: string;
  chainId: string;
  sender: string; // proxy
  recipient: string;
  proxender: string;
  proxied: boolean;
  startTime: string;
  endTime: string;
  duration: string;
  depositAmount: string;
  asset: Asset;
  canceled: boolean;
  contract: Contract;
  segments: any[]; // You may want to specify a more specific type for 'segments'
}

const CardGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 20px;
`;

const Card = styled.div`
  background: #f0f0f0;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0;
`;

const CardSubtitle = styled.p`
  font-size: 1rem;
  margin: 10px 0;
  color: #777;
`;

const Button = styled.button`
  background: #007bff;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
`;

const StreamCards = ({ streams }: { streams: Stream[] }) => (
  <CardGrid>
    {streams &&
      streams.map((stream, i) => {
        console.log("stream: ", stream);
        return (
          <Card key={i}>
            <CardTitle>{stream.alias}</CardTitle>
            <CardSubtitle>{stream.asset.symbol}</CardSubtitle>

            <p style={{ margin: 2 }}>category: {stream.category}</p>
            <p style={{ margin: 2 }}>streamId: {stream.tokenId}</p>
            <p style={{ margin: 2 }}>chainId: {stream.chainId}</p>
            <p style={{ margin: 2 }}>sender: {stream.sender}</p>
            <p style={{ margin: 2 }}>recipient: {stream.recipient}</p>
            <p style={{ margin: 2 }}>proxender: {stream.proxender}</p>
            <p style={{ margin: 2 }}>proxied: {stream.proxied}</p>
            <p style={{ margin: 2 }}>startTime: {stream.startTime}</p>
            <p style={{ margin: 2 }}>endTime: {stream.endTime}</p>
            <p style={{ margin: 2 }}>depositAmount: {stream.depositAmount}</p>
            <p style={{ margin: 2 }}>
              contract address: {stream.contract.address}
            </p>
            <p style={{ margin: 2 }}>symbol: {stream.asset.symbol}</p>
            <p style={{ margin: 2 }}>canceled: {stream.canceled.toString()}</p>

            {!stream.canceled && <Button>Edit</Button>}
          </Card>
        );
      })}
  </CardGrid>
);

function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);

  const fetchStreams = useCallback(async () => {
    const { data } = await fetch(
      `https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-goerli`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query getStreams {
              streams(
                orderBy: timestamp,
                orderDirection: desc,
                where:{
                  proxied:true,
                  proxender:"0xde43f899587aaa2Ea6aD243F3d68a5027F2C6a94"
                }
              ) {
                id
                alias
                category
                tokenId
                chainId
                sender
                recipient
                proxender
                proxied
                startTime
                endTime
                duration
                depositAmount
                canceled
                cliff
                asset {
                  address
                  chainId
                  decimals
                  name
                  symbol
                }
                segments {
                  id
                  startAmount
                  endAmount
                }
                contract {
                  address
                }
              }
            }
          `,
        }),
        next: { revalidate: 10 },
      }
    ).then((res) => res.json());
    console.log(data);
    console.log("data: ", data?.streams);
    setStreams(data?.streams);
  }, []);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return (
    <Wrapper>
      <Disclaimer>
        <p>This Sablier V2 Sandbox is only available on Goerli.</p>
      </Disclaimer>
      <Container>
        {streams && <StreamCards streams={streams} />}

        <Account />
        <Forms />
      </Container>
    </Wrapper>
  );
}

export default Home;

/*
cancel
lockupLinear: 0x6e3678c005815ab34986d8d66a353cd3699103de
streamId: 
 */
