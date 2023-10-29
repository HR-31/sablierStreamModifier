"use-client";

import styled from "styled-components";
import Account from "../src/components/Account";
import CardGrid from "../src/components/CardGrid";

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

function Home() {
  return (
    <Wrapper>
      <Container>
        <Account />
        <CardGrid />
      </Container>
    </Wrapper>
  );
}

export default Home;
