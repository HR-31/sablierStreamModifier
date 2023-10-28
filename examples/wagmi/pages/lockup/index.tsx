import Link from "next/link";
import Forms from "../../src/components/Forms";
import LockupLinear from "../../src/components/Forms/LockupLinear";
import { useRouter } from "next/router";

import styled from "styled-components";

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

function Lockup() {
  const router = useRouter();
  const { stream } = router.query;

  if (!stream) return;
  if (typeof stream !== "string") return;

  const decodedObject = decodeURIComponent(stream);
  const parsedObject = JSON.parse(decodedObject);

  return (
    <div>
      <Link href="/" passHref>
        <StyledButton>Home</StyledButton>
      </Link>
      <Forms stream={parsedObject} />;
    </div>
  );
}

export default Lockup;
