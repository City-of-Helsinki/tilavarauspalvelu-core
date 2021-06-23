import React,{useEffect} from 'react';
import * as Sentry from '@sentry/react';
import { useRouter } from 'next/router';
import { sentryDSN, sentryEnvironment, matomoEnabled, isBrowser } from "./const";


const initSentry = ()=>{
  if (sentryDSN) {
    console.debug("Initializing sentry.", sentryDSN);
    try {
      Sentry.init({
        dsn: sentryDSN,
        environment: sentryEnvironment,
        release: `tilavarauspalvelu-ui@${process.env.npm_package_version}`,
        integrations: [
          new Sentry.Integrations.GlobalHandlers({
            onunhandledrejection: true,
            onerror: true,
          }),
        ],
      });
    } catch (e) {
      console.error('Could not initialize sentry:', e);
    }
  }
}

const matomoBaseUrl = 'https://webanalytics.digiaiiris.com/js/';

const initMatomo = () => {
  if (!isBrowser || !matomoEnabled) {
    return;
  }

  var _paq = window._paq = window._paq || [];
  _paq.push(['requireCookieConsent']);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function () {
    var u = "//webanalytics.digiaiiris.com/js/";
    _paq.push(['setTrackerUrl', u + 'tracker.php']);
    _paq.push(['setSiteId', '195']);
    var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
    g.type = 'text/javascript'; g.async = true; g.src = u + 'piwik.js'; s.parentNode.insertBefore(g, s);
  })();
}

const trackPageView = () => {
  try {
    var _paq = window._paq = window._paq || [];
    _paq.push(['trackPageView']);
  } catch (e) {
    //ignore
  }
}

type TrackingWrapperProps = {
  children: React.ReactNode;
}

export const TrackingWrapper = ({children}:TrackingWrapperProps): JSX.Element => {
  const router = useRouter()

  useEffect(initSentry, []);
  useEffect(initMatomo, []);

  useEffect(() => {
    if (matomoEnabled) {
      router.events.on('routeChangeComplete', trackPageView)
    }
  },[]);

  return (
    <>{children}</>
  );
}
