import React from "react";
// @ts-expect-error: this works in ui/pages/_document.js for some reason
import { getCriticalHdsRules, hdsStyles } from "hds-react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";
import type { DocumentContext } from "next/document";
import { getRuntimeConfigScript } from "@ui/modules/runtimeEnv";
import { env, RUNTIME_ENV_KEYS } from "@/env.mjs";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      const hdsCriticalRules = await getCriticalHdsRules(initialProps.html, hdsStyles);

      return {
        ...initialProps,
        hdsCriticalRules,
        styles: [initialProps.styles, sheet.getStyleElement()],
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    const basePath = env.NEXT_PUBLIC_BASE_URL ?? "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: this works in ui/pages/_document.js for some reason
    const { locale, hdsCriticalRules } = this.props;
    return (
      <Html lang={locale}>
        <Head>
          <script
            // eslint-disable-next-line react/no-danger -- values are allowlisted and escaped
            dangerouslySetInnerHTML={{ __html: getRuntimeConfigScript(RUNTIME_ENV_KEYS) }}
          />
          <style
            data-used-styles
            // eslint-disable-next-line react/no-danger -- this is safe
            dangerouslySetInnerHTML={{ __html: hdsCriticalRules }}
          />
          <meta name="color-scheme" content="light only" />
          <meta name="theme-color" content="#0000bf" />
          <link rel="icon" href={`${basePath}/favicon-32x32.ico`} sizes="any" />
          <link rel="icon" href={`${basePath}/favicon.svg`} type="image/svg+xml" />
          <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} />
          <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
