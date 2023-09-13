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
        locale: "fi",
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
            // eslint-disable-next-line react/no-danger, @typescript-eslint/naming-convention
            dangerouslySetInnerHTML={{ __html: hdsCriticalRules }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
