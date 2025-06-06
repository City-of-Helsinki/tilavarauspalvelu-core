import Head from "next/head";
import Layout from "./layout";
import { getVersion } from "@/modules/baseUtils.mjs";

/* Separate healthcheck page that does no GraphQL queries to avoid csrf token issues */
export default function Index({ version }: Props) {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Layout version={version}>
        <div>Healthcheck</div>
      </Layout>
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export function getServerSideProps() {
  return {
    props: {
      version: getVersion(),
    },
  };
}
