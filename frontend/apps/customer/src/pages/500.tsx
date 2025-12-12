import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ErrorContainer } from "ui/src/components";
import { useEnvContext } from "@/context/EnvContext";

/// next doesn't allow getServersideProps in 500.tsx (you have to use app router for that)
export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

function Page500(): React.ReactElement {
  const { env } = useEnvContext();
  return <ErrorContainer statusCode={500} feedbackUrl={env.feedbackUrl} />;
}

export default Page500;
