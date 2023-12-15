import React from "react";
import Document, {
  DocumentContext,
  Html,
  Head,
  Main,
  NextScript,
} from "next/document";
import { ServerStyleSheet } from "styled-components";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: this works in ui/pages/_document.js for some reason
import { getCriticalHdsRules, hdsStyles } from "hds-react";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      const hdsCriticalRules = await getCriticalHdsRules(
        initialProps.html,
        hdsStyles
      );

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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: this works in ui/pages/_document.js for some reason
    const { locale, hdsCriticalRules } = this.props;

    return (
      <Html lang={locale}>
        <Head>
          <style
            data-used-styles
            dangerouslySetInnerHTML={{ __html: hdsCriticalRules }}
          />
          <meta name="color-scheme" content="light only" />
          <meta name="theme-color" content="#0000bf" />
          <link rel="icon" href="/favicon-32x32.ico" sizes="any" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.webmanifest" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
