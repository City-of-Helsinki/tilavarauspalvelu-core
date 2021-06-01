import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";
import React from "react";
import Container from "../components/common/Container";
import Title from "../components/common/Title";
import { isBrowser } from "../modules/const";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
    revalidate: 100, // In seconds
  };
}

const Applications = (): JSX.Element => {
  if (!isBrowser) {
    return null;
  }

  const OidcSecure = dynamic(() =>
    import("@axa-fr/react-oidc-context").then((mod) => mod.OidcSecure)
  );

  return (
    <OidcSecure>
      <Title>Tilavarauspalvelu secret site</Title>
      <Container>This page requires authentication..</Container>
    </OidcSecure>
  );
};

export default Applications;
