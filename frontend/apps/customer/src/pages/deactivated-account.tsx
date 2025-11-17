import React from "react";
import { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import DeactivatedAccount from "ui/src/components/DeactivatedAccount";
import { useEnvContext } from "@/context/EnvContext";

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function DeactivatedAccountPage(_props: PageProps) {
  const { env } = useEnvContext();
  return <DeactivatedAccount feedbackUrl={env.feedbackUrl} imgSrc="/images/deactivated-account.png" />;
}
