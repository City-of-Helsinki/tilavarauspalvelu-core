import Head from "next/head";
import Layout from "./layout";

/* Separate healthcheck page that does no GraphQL queries to avoid csrf token issues */
export default function Index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Layout>
        <div>Healthcheck</div>
      </Layout>
    </>
  );
}
