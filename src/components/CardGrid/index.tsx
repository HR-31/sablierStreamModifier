import styled from "styled-components";
import { useCallback, useEffect, useState } from "react";
import Card from "../Card";
import { useAccount } from "wagmi";
import { Stream } from "../../types";

const SCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SNoStreamsHeader = styled.h1`
  font-size: 2rem;
  color: red; // or any other color you'd like
  text-align: center;
  margin-top: 2rem;
`;

export default function CardGrid() {
  const { address, isConnected } = useAccount();
  const [streams, setStreams] = useState<Stream[]>([]);

  useEffect(() => {
    const fetchStreams = async (proxender: string) => {
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
                    or: [
                      { proxender: "${proxender}" },
                      { sender: "${proxender}" }
                    ]
                    
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
      setStreams(data?.streams);
    };

    if (isConnected && address) {
      fetchStreams(address);
    }
  }, [isConnected, address]);

  if (!streams) {
    return <SNoStreamsHeader>No Streams</SNoStreamsHeader>;
  }

  return (
    <SCardGrid>
      {streams.map((stream, i) => (
        <div key={i}>
          <Card stream={stream} />
        </div>
      ))}
    </SCardGrid>
  );
}
