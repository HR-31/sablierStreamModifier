import styled from "styled-components";
import { FaClock } from "react-icons/fa";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Transaction from "../../models/Transaction";
import { useAccount } from "wagmi";

import { useRouter } from "next/router";
import { Stream } from "../../types";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Popup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  width: 400px;
  text-align: center;
`;

const SCard = styled.div`
  background: #363a4c;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h3`
  color: #ffffff;
  font-size: 1.2rem;
  margin-top: 10px;
`;

const CardSubtitle = styled.p`
  color: #ffffff;
  margin-top: 10px;
`;

const CardTime = styled.div`
  display: flex;
  align-items: center;
  color: #ffffff;
  margin-top: 10px;

  & svg {
    margin-right: 5px;
  }
`;

const SecondaryButton = styled.button`
  background: #363a4c;
  color: #ffffff;
  border: 1px white 1px;
  padding: 10px 20px;
  border-radius: 10px;
  margin-top: 10px;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  background: #ff9c00;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  margin-top: 10px;
  cursor: pointer;
`;

function getTimeAfterSubtractingFutureTime(
  futureTimeInSeconds: number
): string {
  // Convert to a Date object
  const newDate = new Date(futureTimeInSeconds * 1000);

  // Convert to local time string
  const localTimeStr = newDate.toLocaleString();

  return localTimeStr;
}

export default function Card({ stream }: { stream: Stream }) {
  const { isConnected, address } = useAccount();
  const [uri, setUri] = useState("");
  const [isPopupOpen, setPopupOpen] = useState(false);

  const togglePopup = () => {
    setPopupOpen(!isPopupOpen);
  };
  const router = useRouter();

  const navigateToLockupLinearPage = (stream: Stream) => {
    router.push({
      pathname: "/lockup",
      query: { stream: encodeURIComponent(JSON.stringify(stream)) },
    });
  };

  const fetchNFTUri = useCallback(async () => {
    const uri = await Transaction.getNFT("344");
    let decoded = uri.replace("data:application/json;base64,", "");
    decoded = atob(decoded);
    setUri(JSON.parse(decoded)?.image);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchNFTUri();
    }
  }, [fetchNFTUri, isConnected, address]);

  if (!uri) {
    return;
  }

  return (
    <SCard>
      <Image src={uri} alt="NFT" width={200} height={200} />
      <CardTitle>ID: {stream.tokenId}</CardTitle>
      <CardSubtitle>{stream.asset.symbol}</CardSubtitle>
      <CardSubtitle>{stream.canceled && "Cancelled"}</CardSubtitle>
      {!stream.canceled && (
        <CardTime>
          <FaClock />
          {getTimeAfterSubtractingFutureTime(Number(stream.endTime))}
        </CardTime>
      )}
      <SecondaryButton onClick={togglePopup}>Details</SecondaryButton>

      {!stream.canceled && (
        <PrimaryButton onClick={() => navigateToLockupLinearPage(stream)}>
          Edit
        </PrimaryButton>
      )}

      {isPopupOpen && (
        <Overlay onClick={togglePopup}>
          <Popup onClick={(e) => e.stopPropagation()}>
            <h1>ID: {stream.tokenId}</h1>
            <h2>{stream.asset.symbol}</h2>
            {Object.entries(stream).map(([k, v], i) => (
              <p key={i}>
                {k}: {v?.toString()}
              </p>
            ))}
          </Popup>
        </Overlay>
      )}
    </SCard>
  );
}
