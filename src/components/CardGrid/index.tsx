import styled from "styled-components";
import { useEffect } from "react";
import Transaction from "../../models/Transaction";
import Card from "../Card";

const SCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export default function CardGrid() {
  useEffect(() => {
    const get = async () => {
      await Transaction.getNFT("344");
    };
    get();
  }, []);

  return (
    <SCardGrid>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <Card />
        </div>
      ))}
    </SCardGrid>
  );
}
