import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { CenteredContainer } from "common/src/layout/Container";
import { getCommonServerSideProps } from "@/modules/serverUtils";

export const getStaticProps = async ({ locale }: GetServerSidePropsContext) => {
  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

type Props = {
  title?: string;
  body?: string;
};

const Wrapper = styled.div`
  padding: var(--spacing-layout-xl) 0;
`;

const Custom404 = ({ title, body }: Props): JSX.Element => {
  const { t } = useTranslation("errors");

  return (
    <Wrapper>
      <CenteredContainer>
        <h1 data-testid="error__404--title">{title || "404"}</h1>
        <p data-testid="error__404--body">{body || t("404.body")}</p>
      </CenteredContainer>
    </Wrapper>
  );
};

export default Custom404;
