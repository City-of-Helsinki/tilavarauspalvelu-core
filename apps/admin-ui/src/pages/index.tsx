import React from "react";
import { App } from "@/App";
import Layout from "./layout";
import { type GetServerSideProps } from "next";

type Props = {
  cookieHubEnabled: boolean;
  reservationUnitPreviewUrl: string;
  hotjarEnabled: boolean;
  apiBaseUrl: string;
};

export default function Index(props: Props) {
  return (
    <Layout>
      <App {...props} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { env } = await import("@/env.mjs");
  return {
    props: {
      cookiehubEnabled: env.COOKIEHUB_ENABLED,
      reservationUnitPreviewUrl: env.RESERVATION_UNIT_PREVIEW_URL_PREFIX ?? "",
      hotjarEnabled: env.HOTJAR_ENABLED,
      apiBaseUrl: env.TILAVARAUS_API_URL,
      // TODO can't use SSR translations because our translations aren't in public folder
      // ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};
