import { appWithTranslation } from "next-i18next";
import dynamic from 'next/dynamic'
import SessionLost from "../components/common/SessionLost";
import PageWrapper from "../components/common/PageWrapper";
import { authEnabled, isBrowser } from "../modules/const";
import LoggingIn from "../components/common/LoggingIn";
import { CenterSpinner } from '../components/common/common';
import oidcConfiguration from '../modules/auth/configuration'
import "../styles/global.scss";



function MyApp({ Component, pageProps }) {
  if (!isBrowser) {
    return (
      <PageWrapper>
        <Component {...pageProps} />
      </PageWrapper>
    );
  }


  const AuthenticationProvider = dynamic(() =>
    import('@axa-fr/react-oidc-context').then((mod) => mod.AuthenticationProvider)
  )


  console.log('rendering with config', oidcConfiguration)

  return (
    <AuthenticationProvider
      authenticating={CenterSpinner}
      notAuthenticated={SessionLost}
      sessionLostComponent={SessionLost}
      configuration={oidcConfiguration}
      isEnabled={authEnabled}
      callbackComponentOverride={LoggingIn}>
      <PageWrapper>
        <Component {...pageProps} />
      </PageWrapper>

    </AuthenticationProvider>
  );


}

export default appWithTranslation(MyApp);
