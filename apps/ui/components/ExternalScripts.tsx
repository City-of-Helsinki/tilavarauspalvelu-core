import React from "react";
import Script from "next/script";
import {
  matomoEnabled,
  cookiehubEnabled,
  hotjarEnabled,
  isBrowser,
} from "../modules/const";

const ExternalScripts = (): JSX.Element | null => {
  if (!isBrowser) {
    return null;
  }

  return (
    <>
      {cookiehubEnabled && (
        <Script
          id="cookiehub"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
var cpm = {
  cookie: {
    domain: ''
  },
  language: document.documentElement.lang !== null
    ? document.documentElement.lang.substr(0, 2)
    : "fi",
};
(function(h,u,b){
var d=h.getElementsByTagName("script")[0],e=h.createElement("script");
e.async=true;e.src='https://cookiehub.net/c2/c7e96adf.js';
e.onload=function(){u.cookiehub.load(b);}
d.parentNode.insertBefore(e,d);
})(document,window,cpm);
`,
          }}
        />
      )}
      {matomoEnabled && (
        <Script
          data-consent="analytics"
          type="text/plain"
          strategy="afterInteractive"
          id="matomo"
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
      )}
      {hotjarEnabled && (
        <Script
          id="hotjar"
          strategy="afterInteractive"
          data-consent="analytics"
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
      )}
    </>
  );
};

export default ExternalScripts;
