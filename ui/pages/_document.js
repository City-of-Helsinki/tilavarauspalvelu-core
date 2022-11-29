import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";
import { getCriticalHdsRules, hdsStyles } from "hds-react";

export default class MyDocument extends Document {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          enhanceApp: (App) => (props) =>
            // eslint-disable-next-line react/jsx-filename-extension
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
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    const { locale, hdsCriticalRules } = this.props;

    return (
      <Html lang={locale}>
        <Head>
          <style
            data-used-styles
            // eslint-disable-next-line react/no-danger, @typescript-eslint/naming-convention
            dangerouslySetInnerHTML={{ __html: hdsCriticalRules }}
          />
          <meta name="color-scheme" content="light only" />
          <meta name="theme-color" content="#0000bf" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
