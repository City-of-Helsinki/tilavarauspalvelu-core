import React from "react";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import DeactivatedAccount from "common/src/components/DeactivatedAccount";

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

const DeactivatedAccountPage = ({ feedbackUrl }: { feedbackUrl: string }) => {
  return (
    <DeactivatedAccount
      feedbackUrl={feedbackUrl}
      imgSrc="/images/deactivated-account.png"
    />
  );
};

export default DeactivatedAccountPage;
