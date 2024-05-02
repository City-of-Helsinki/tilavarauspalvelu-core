import { Link } from "hds-react";
import React from "react";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { PUBLIC_URL } from "./const";
import { useTranslation } from "react-i18next";

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

const Error5xx = ({ feedbackUrl }: { feedbackUrl: string }): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <Content>
        <H1 $legacy>{t("errorPages.generalError.title")}</H1>
        <p>{t("errorPages.generalError.title")}</p>
        <Link external href="/">
          {t("errorPages.linkToVaraamo")}
        </Link>
        <Link external href={feedbackUrl}>
          {t("errorPages.giveFeedback")}
        </Link>
      </Content>
      <Image src={`${PUBLIC_URL}/5xx.png`} />
    </Wrapper>
  );
};

export default Error5xx;
