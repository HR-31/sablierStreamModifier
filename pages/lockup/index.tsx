import Link from "next/link";
import { useRouter } from "next/router";

import styled from "styled-components";
import LockupLinear from "../../src/components/Forms/LockupLinear";
import { useAccount } from "wagmi";

const NavBar = styled.div`
  background-color: #f2f2f2;
  padding: 15px;
`;

const StyledButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f4f4f4;
`;

function Lockup() {
  const router = useRouter();
  const { stream } = router.query;
  const { isConnected } = useAccount();

  if (!stream || typeof stream !== "string" || !isConnected) return;

  const decodedObject = decodeURIComponent(stream);
  const parsedObject = JSON.parse(decodedObject);

  return (
    <PageWrapper>
      <NavBar>
        <Link href="/" passHref>
          <StyledButton>Home</StyledButton>
        </Link>
      </NavBar>
      <LockupLinear stream={parsedObject} />
    </PageWrapper>
  );
}

export default Lockup;
