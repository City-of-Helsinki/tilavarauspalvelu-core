import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { ErrorContainer } from "ui/src/components";
import { useEnvContext } from "@/context/EnvContext";
import { PUBLIC_URL } from "@/modules/const";

/// Unlike 404 and 500 this is not a standard next error page, so it can use getServerSideProps.
/// The env is then loaded at runtime. Do not make backend calls here, 503 means the backend is down.
export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default function Page503(): React.ReactElement {
  const { env } = useEnvContext();
  return (
    <ErrorContainer statusCode={503} feedbackUrl={env.feedbackUrl} imgSrc={`${PUBLIC_URL}/images/503-error.png`} />
  );
}
