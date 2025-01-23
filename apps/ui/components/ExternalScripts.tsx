import React from "react";
import Script from "next/script";
import { isBrowser } from "@/modules/const";

type Props = {
  enableMatomo: boolean;
  enableHotjar: boolean;
};

export function ExternalScripts({
  enableMatomo,
  enableHotjar,
}: Props): JSX.Element | null {
  if (!isBrowser) {
    return null;
  }
  if (!enableMatomo && !enableHotjar) {
    return null;
  }

  return (
    <>
      {enableMatomo && <MatomoScript />}
      {enableHotjar && <HotjarScript />}
    </>
  );
}

function MatomoScript(): JSX.Element {
  return (
    <Script
      id="matomo"
      type="text/plain"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function () {
  var _paq = (window._paq = window._paq || []);
  _paq.push(["requireCookieConsent"]);
  _paq.push(["trackPageView"]);
  _paq.push(["enableLinkTracking"]);

  var u = "//webanalytics.digiaiiris.com/js/";
  _paq.push(["setTrackerUrl", u + "tracker.php"]);
  _paq.push(["setSiteId", "195"]);
  var d = document;
  var g = d.createElement("script");
  var s = d.getElementsByTagName("script")[0];
  g.type = "text/javascript";
  g.src = u + "piwik.js";
  s.parentNode.insertBefore(g, s);
})();
  `,
      }}
    />
  );
}

function HotjarScript(): JSX.Element {
  return (
    <Script
      id="hotjar"
      strategy="afterInteractive"
      type="text/plain"
      dangerouslySetInnerHTML={{
        __html: `
(function(h,o,t,j,a,r){
  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
  h._hjSettings={hjid:2913591,hjsv:6};
  a=o.getElementsByTagName('head')[0];
  r=o.createElement('script');r.async=1;
  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
  a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `,
      }}
    />
  );
}
