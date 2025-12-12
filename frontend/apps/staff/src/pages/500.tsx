import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ErrorContainer } from "ui/src/components";
import { useEnvContext } from "@/context/EnvContext";
import { PUBLIC_URL } from "@/modules/const";

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
  return (
    <ErrorContainer statusCode={500} feedbackUrl={env.feedbackUrl} imgSrc={`${PUBLIC_URL}/images/500-error.png`} />
  );
}

export default Page500;
