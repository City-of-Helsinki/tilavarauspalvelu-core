import React from "react";
import { App } from "@/App";
import Layout from "./layout";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export default function Index(props: Props) {
  return (
    <Layout>
      <App {...props} />
    </Layout>
  );
}

export const getServerSideProps = async () => {
  const { env } = await import("@/env.mjs");
  return {
    props: {
      reservationUnitPreviewUrl: env.RESERVATION_UNIT_PREVIEW_URL_PREFIX ?? "",
      apiBaseUrl: env.TILAVARAUS_API_URL ?? "",
      // TODO can't use SSR translations because our translations aren't in public folder
      // ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};
