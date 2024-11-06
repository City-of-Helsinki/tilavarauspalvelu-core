import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { getCommonServerSideProps } from "@/modules/serverUtils";

// TODO this is a copy of 404.tsx, but with 500 instead of 404

/// next doesn't allow getServersideProps in 500.tsx (you have to use app router for that)
export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

const Wrapper = styled.div`
  padding: var(--spacing-layout-xl) 0;
`;

function Page500(): JSX.Element {
  const { t } = useTranslation("errors");

  return (
    <Wrapper>
      <h1>500</h1>
      <p>{t("500.body")}</p>
    </Wrapper>
  );
}

export default Page500;
