import React from "react";
import { appWithTranslation } from "next-i18next";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { AppProps } from "next/app";
import SessionLost from "../components/common/SessionLost";
import PageWrapper from "../components/common/PageWrapper";
import { authEnabled, isBrowser } from "../modules/const";
import LoggingIn from "../components/common/LoggingIn";
import { CenterSpinner } from "../components/common/common";
import oidcConfiguration from "../modules/auth/configuration";
import nextI18NextConfig from "../next-i18next.config";
import "../styles/global.scss";
import { TrackingWrapper } from "../modules/tracking";

// eslint-disable-next-line @typescript-eslint/naming-convention
function MyApp({ Component, pageProps }: AppProps) {
  if (!isBrowser) {
    return (
      <PageWrapper>
        <Component {...pageProps} />
      </PageWrapper>
    );
  }

  const AuthenticationProvider = dynamic(() =>
    // eslint-disable-next-line import/no-unresolved
    import("@axa-fr/react-oidc-context").then(
      (mod) => mod.AuthenticationProvider
    )
  );

  return (
    <TrackingWrapper>
      <AuthenticationProvider
        authenticating={CenterSpinner}
        notAuthenticated={SessionLost}
        sessionLostComponent={SessionLost}
        configuration={oidcConfiguration}
        isEnabled={authEnabled}
        callbackComponentOverride={LoggingIn}
      >
        <PageWrapper>
          <Component {...pageProps} />
        </PageWrapper>
      </AuthenticationProvider>
    </TrackingWrapper>
  );
}

export default appWithTranslation(MyApp, {
  ...nextI18NextConfig,
  interpolation: {
    format: (value, fmt) => {
      if (value instanceof Date) return format(value, fmt || "dd.MM.YY");
      return value;
    },
    escapeValue: false,
  },
});
