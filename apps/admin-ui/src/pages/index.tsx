import React from "react";
import { App } from "@/App";
import Layout from "./layout";
import { getVersion } from "@/helpers/serverUtils";

export type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export default function Index(props: PageProps) {
  return (
    <Layout version={props.version}>
      <App {...props} />
    </Layout>
  );
}

export async function getServerSideProps() {
  const { env } = await import("@/env.mjs");
  return {
    props: {
      reservationUnitPreviewUrl: env.RESERVATION_UNIT_PREVIEW_URL_PREFIX ?? "",
      apiBaseUrl: env.TILAVARAUS_API_URL ?? "",
      feedbackUrl: env.EMAIL_VARAAMO_EXT_LINK ?? "",
      sentryDsn: env.SENTRY_DSN ?? "",
      sentryEnvironment: env.SENTRY_ENVIRONMENT ?? "",
      version: getVersion(),
      // TODO can't use SSR translations because our translations aren't in public folder
      // ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
