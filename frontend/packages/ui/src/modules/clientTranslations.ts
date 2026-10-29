import { i18n } from "next-i18next/pages";
import type { SSRConfig, UserConfig } from "next-i18next/pages";

/// Translation props for a page that renders in the browser without getStaticProps or getServerSideProps.
/// For example _error after a client side render error.
/// appWithTranslation drops the i18n provider if pageProps has no _nextI18Next,
/// so reuse the translations the browser already loaded for the previous page.
export function getClientTranslations(userConfig: UserConfig): SSRConfig {
  if (typeof window === "undefined" || i18n == null) {
    return {};
  }
  const lang = i18n.language;
  return {
    _nextI18Next: {
      initialI18nStore: i18n.store.data,
      initialLocale: lang,
      ns: Object.keys(i18n.store.data[lang] ?? {}),
      userConfig,
    },
  };
}
