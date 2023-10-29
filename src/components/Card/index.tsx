import styled from "styled-components";
import { FaClock } from "react-icons/fa";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Transaction from "../../models/Transaction";
import { useAccount } from "wagmi";

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
  color: #4d5366;
  margin-top: 10px;
`;

const CardTime = styled.div`
  display: flex;
  align-items: center;
  color: #4d5366;
  margin-top: 10px;

  & svg {
    margin-right: 5px;
  }
`;

const SecondaryButton = styled.button`
  background: #363a4c;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  margin-top: 10px;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  background: #ff9c00;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  margin-top: 10px;
  cursor: pointer;
`;

export default function Card() {
  const { isConnected, address } = useAccount();
  const [uri, setUri] = useState("");

  const fetchNFTUri = useCallback(async () => {
    const uri = await Transaction.getNFT("344");
    setUri(uri);
  }, []);

  useEffect(() => {
    // if (isConnected && address) {
    // }
    fetchNFTUri();
    // isConnected, address
  }, [fetchNFTUri]);

  console.log({ uri });

  if (!uri) {
    return;
  }

  return (
    <SCard>
      <Image src={uri} alt="NFT" width={10} height={10} />
      <CardTitle>Title</CardTitle>
      <CardSubtitle>Subtitle</CardSubtitle>
      <CardTime>
        <FaClock />
        12:34 PM
      </CardTime>
      <SecondaryButton>Details</SecondaryButton>
      <PrimaryButton>Edit</PrimaryButton>
    </SCard>
  );
}
