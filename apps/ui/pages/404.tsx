import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { CenteredContainer } from "common/src/layout/Container";
import { getCommonServerSideProps } from "@/modules/serverUtils";

/// next doesn't allow getServersideProps in 404.tsx (you have to use app router for that)
/// so all props are build time not runtime (e.g. no dynamic environment variables)
/// migrating only the not-found to app router is an option, but requires redoing all the layouts and navigation
/// using next/navigation instead of next/router and layouts instead of _app and _document.
export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

type Props = {
  title?: string;
  body?: string;
};

const Wrapper = styled.div`
  padding: var(--spacing-layout-xl) 0;
`;

function Page404({ title, body }: Props): JSX.Element {
  const { t } = useTranslation("errors");

  return (
    <Wrapper>
      <CenteredContainer>
        <h1 data-testid="error__404--title">{title || "404"}</h1>
        <p data-testid="error__404--body">{body || t("404.body")}</p>
      </CenteredContainer>
    </Wrapper>
  );
}

export default Page404;
