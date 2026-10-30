import { i18n } from "next-i18next/pages";
import type { SSRConfig, UserConfig } from "next-i18next/pages";

/// Translation props for a page that renders in the browser without getStaticProps or getServerSideProps.
/// For example _error after a client side render error.
/// appWithTranslation drops the i18n provider if pageProps has no _nextI18Next,
/// so reuse the translations the browser already loaded for the previous page.
/// Pass the router locale if the caller has it. Else the current i18n language is used.
export function getClientTranslations(userConfig: UserConfig, locale?: string): SSRConfig {
  if (typeof window === "undefined" || i18n == null) {
    return {};
  }
  const lang = locale ?? i18n.language;
  return {
    _nextI18Next: {
      initialI18nStore: i18n.store.data,
      initialLocale: lang,
      ns: Object.keys(i18n.store.data[lang] ?? {}),
      userConfig,
    },
  };
}
