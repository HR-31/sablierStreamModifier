"use-client";

import styled from "styled-components";
import Account from "../src/components/Account";
import Forms from "../src/components/Forms";
import { useCallback, useEffect, useState } from "react";
import LockupLinear from "../src/components/Forms/LockupLinear";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";

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

export interface Asset {
  address: string;
  chainId: string;
  decimals: string;
  name: string;
  symbol: string;
}

interface Contract {
  address: string;
}

export interface Stream {
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
  cliff: boolean;
  cancelable: boolean;
  segments: any[]; // You may want to specify a more specific type for 'segments'
}

const Card = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 10px;
`;

const CardTitle = styled.h3`
  margin: 0;
  padding: 0;
  font-size: 1.2rem;
`;

const CardSubtitle = styled.p`
  margin: 10px 0;
  font-size: 1rem;
  color: #777;
`;

const CardTime = styled.time`
  font-size: 0.9rem;
  color: #555;
`;

// Grid Styling
const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Button = styled.button`
  background: #007bff;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
`;

const StreamCards = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const navigateToLockupLinearPage = (stream: Stream) => {
    router.push({
      pathname: "/lockup",
      query: { stream: encodeURIComponent(JSON.stringify(stream)) },
    });
  };

  const [streams, setStreams] = useState<Stream[]>([]);

  const fetchStreams = useCallback(async (proxender: string) => {
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
                  proxender: "${proxender}"
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
                cancelable
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
    if (isConnected && address) {
      fetchStreams(address);
    }
  }, [isConnected, address, fetchStreams]);

  if (!streams) {
    return <h1>no streams</h1>;
  }

  return (
    <CardGrid>
      {streams.map((stream, i) => {
        console.log("stream: ", stream);
        return (
          <Card key={i}>
            <CardTitle>ID: {stream.tokenId}</CardTitle>
            <CardSubtitle>{stream.asset.symbol}</CardSubtitle>
            <CardTime>hi</CardTime>
          </Card>

          // <Card key={i}>
          //   <CardTitle>{stream.alias}</CardTitle>
          //   <CardSubtitle>{stream.asset.symbol}</CardSubtitle>

          //   <p style={{ margin: 2 }}>category: {stream.category}</p>
          //   <p style={{ margin: 2 }}>streamId: {stream.tokenId}</p>
          //   <p style={{ margin: 2 }}>chainId: {stream.chainId}</p>
          //   <p style={{ margin: 2 }}>sender: {stream.sender}</p>
          //   <p style={{ margin: 2 }}>recipient: {stream.recipient}</p>
          //   <p style={{ margin: 2 }}>proxender: {stream.proxender}</p>
          //   <p style={{ margin: 2 }}>proxied: {stream.proxied}</p>
          //   <p style={{ margin: 2 }}>startTime: {stream.startTime}</p>
          //   <p style={{ margin: 2 }}>endTime: {stream.endTime}</p>
          //   <p style={{ margin: 2 }}>depositAmount: {stream.depositAmount}</p>
          //   <p style={{ margin: 2 }}>
          //     contract address: {stream.contract.address}
          //   </p>
          //   <p style={{ margin: 2 }}>symbol: {stream.asset.symbol}</p>
          //   <p style={{ margin: 2 }}>canceled: {stream.canceled.toString()}</p>
          //   <p style={{ margin: 2 }}>cliff: {stream.cliff.toString()}</p>

          //   {!stream.canceled && (
          //     <Button onClick={() => navigateToLockupLinearPage(stream)}>
          //       Edit
          //     </Button>
          //   )}
          // </Card>
        );
      })}
    </CardGrid>
  );
};

function Home() {
  return (
    <Wrapper>
      <Container>
        <Account />
        <StreamCards />
      </Container>
    </Wrapper>
  );
}

export default Home;
