import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import ErrorContainer from "common/src/components/ErrorContainer";

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

type Props = {
  feedbackUrl: string;
  title?: string;
  body?: string;
};

function Page500({ title, body, feedbackUrl }: Readonly<Props>): JSX.Element {
  return <ErrorContainer statusCode={500} title={title} body={body} feedbackUrl={feedbackUrl} />;
}

export default Page500;
