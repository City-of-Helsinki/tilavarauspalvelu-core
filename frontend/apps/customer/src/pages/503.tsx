import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ErrorContainer } from "ui/src/components";
import { useEnvContext } from "@/context/EnvContext";

/// Unlike 404 and 500 this is not a standard next error page
/// so using getServerSideProps is possible but 503 means we can't do backend calls
export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

function Page503(): React.ReactElement {
  const { env } = useEnvContext();
  return <ErrorContainer statusCode={503} feedbackUrl={env.feedbackUrl} />;
}

export default Page503;
