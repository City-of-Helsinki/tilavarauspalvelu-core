import React from "react";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { CenteredContainer } from "common/src/layout/Container";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Wrapper = styled.div`
  padding: var(--spacing-layout-xl) 0;
`;

const Custom500 = (): JSX.Element => {
  const { t } = useTranslation("errors");

  return (
    <Wrapper>
      <CenteredContainer>
        <h1>500</h1>
        <p>{t("500.body")}</p>
      </CenteredContainer>
    </Wrapper>
  );
};

export default Custom500;
