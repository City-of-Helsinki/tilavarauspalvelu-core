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

const Image = styled.img`
  width: 100%;
  max-width: 400px;
  @media (min-width: ${breakpoints.l}) {
    width: auto;
  }
`;

const Error5xx = (): JSX.Element => {
  return (
    <Wrapper>
      <Content>
        <H1 $legacy>Jokin meni vikaan</H1>
        <p>
          Pahoittelut, emme valitettavasti pysty näyttämään sivua juuri nyt.
          Yritä myöhemmin uudelleen!
        </p>
        <Link external href="/">
          Siirry Varaamon etusivulle
        </Link>
        <Link
          external
          href="https://app.helmet-kirjasto.fi/forms/?site=varaamopalaute&ref=https://tilavaraus.hel.fi/"
        >
          Anna palautetta
        </Link>
      </Content>
      <Image src={`${publicUrl}/5xx.png`} />
    </Wrapper>
  );
};

export default Error5xx;
