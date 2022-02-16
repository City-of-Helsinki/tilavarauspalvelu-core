import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { matomoEnabled, isBrowser } from "./const";

const initMatomo = () => {
  if (!isBrowser || !matomoEnabled) {
    return;
  }

  // eslint-disable-next-line
  const _paq = (window._paq = window._paq || []);
  _paq.push(["requireCookieConsent"]);
  _paq.push(["trackPageView"]);
  _paq.push(["enableLinkTracking"]);
  // eslint-disable-next-line func-names
  (function () {
    const u = "//webanalytics.digiaiiris.com/js/";
    _paq.push(["setTrackerUrl", `${u}tracker.php`]);
    _paq.push(["setSiteId", "195"]);
    const d = document;
    const g = d.createElement("script");
    const s = d.getElementsByTagName("script")[0];
    g.type = "text/javascript";
    g.async = true;
    g.src = `${u}piwik.js`;
    s.parentNode.insertBefore(g, s);
  })();
};

const trackPageView = () => {
  try {
    // eslint-disable-next-line
    const _paq = (window._paq = window._paq || []);
    _paq.push(["trackPageView"]);
  } catch (e) {
    // ignore
  }
};

type TrackingWrapperProps = {
  children: React.ReactNode;
};

export const TrackingWrapper = ({
  children,
}: TrackingWrapperProps): JSX.Element => {
  const router = useRouter();

  useEffect(initMatomo, []);

  useEffect(() => {
    if (matomoEnabled) {
      router.events.on("routeChangeComplete", trackPageView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};
