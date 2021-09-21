import React from "react";
import styled from "styled-components";
import { GetStaticProps } from "next";
import router from "next/router";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Button, IconArrowLeft } from "hds-react";
import Container from "../components/common/Container";
import { breakpoint, StyledKoros } from "../modules/style";

const Heading = styled.div`
  display: none;

  @media (min-width: ${breakpoint.m}) {
    display: block;
  }
`;

const Hero = styled.div`
  width: 100%;
  height: 500px;
  background-image: url("images/oodi-ylakerta@1x.jpg");
  background-size: cover;

  @media (min-width: ${breakpoint.l}) and (-webkit-min-device-pixel-ratio: 2) {
    background-image: url("images/oodi-ylakerta@2x.jpg");
  }
`;

const Wrapper = styled(Container)`
  display: flex;
  justify-content: center;
`;

const InnerContainer = styled.div`
  max-width: 880px;
  background-color: var(--color-white);
  padding: var(--spacing-s) var(--spacing-l) var(--spacing-xl);
  margin: var(--spacing-m) 0 var(--spacing-layout-m) 0;
`;

const Body = styled.p`
  white-space: pre-line;
  font-family: var(--font-regular);
  padding-bottom: var(--spacing-xl);
`;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const About = (): JSX.Element => {
  const { t } = useTranslation(["about", "common"]);

  return (
    <>
      <Heading>
        <Hero />
        <StyledKoros
          $from="transparent"
          $to="var(--tilavaraus-gray)"
          type="wave"
          style={{ marginTop: "-54px" }}
        />
      </Heading>
      <Wrapper>
        <InnerContainer>
          <h1>{t("heading")}</h1>
          <Body>{t("body")}</Body>
          <Button
            variant="secondary"
            iconLeft={<IconArrowLeft />}
            onClick={() => router.push("/")}
          >
            {t("common:prev")}
          </Button>
        </InnerContainer>
      </Wrapper>
    </>
  );
};

export default About;
