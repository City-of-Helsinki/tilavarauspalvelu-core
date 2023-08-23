import React from "react";
import Head from "next/head";

// NOTE for now this is just the header for now
// should include html layout but it's all client routed so can't include in next page
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>Tilavarauskäsittely</title>
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Tilavarauskäsittely" />
        <meta name="keywords" content="" />
        <meta
          property="og:image"
          content="https://www.hel.fi/static/public/helsinki_tunnus_musta.png"
        />
      </Head>
      {children}
    </>
  );
}
