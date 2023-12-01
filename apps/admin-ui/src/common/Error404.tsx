/// TODO this is a copy of 5xx page, refactor to use same component
/// TODO use translations
import { Link } from "hds-react";
import React from "react";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { publicUrl } from "./const";

const Wrapper = styled.div`
  margin: 0 var(--spacing-s);
  word-break: break-word;
  gap: var(--spacing-layout-m);
  display: flex;
  flex-direction: column;
  h1 {
    margin-bottom: 0;
    font-size: 2.5em;
  }

  @media (min-width: ${breakpoints.l}) {
    margin: var(--spacing-layout-2-xl);
    grid-template-columns: 3fr 1fr;
    display: grid;
    h1 {
      font-size: 4em;
    }
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  gap: 1.5rem;
`;

// TODO should there be an image here?
function Error404({ message }: { message?: string }): JSX.Element {
  return (
    <Wrapper>
      <Content>
        <H1 $legacy>404: Sivua ei löytynyt</H1>
        {message && <p>{message}</p>}
        <Link href={publicUrl ?? "/"}>Siirry etusivulle</Link>
      </Content>
    </Wrapper>
  );
}

export default Error404;
