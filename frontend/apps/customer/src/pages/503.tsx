import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { ErrorContainer } from "ui/src/components";

/// Unlike 404 and 500 this is not a standard next error page
/// so using getServerSideProps is possible but 503 means we can't do backend calls
export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

type Props = {
  feedbackUrl: string;
  title?: string;
  body?: string;
};
function Page503({ title, body, feedbackUrl }: Readonly<Props>): JSX.Element {
  return <ErrorContainer statusCode={503} title={title} body={body} feedbackUrl={feedbackUrl} />;
}

export default Page503;
