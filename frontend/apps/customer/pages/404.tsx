import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { ErrorContainer } from "common/src/components";

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
  feedbackUrl: string;
  title?: string;
  body?: string;
};

function Page404({ title, body, feedbackUrl }: Readonly<Props>): JSX.Element {
  return <ErrorContainer statusCode={404} title={title} body={body} feedbackUrl={feedbackUrl} />;
}

export default Page404;
