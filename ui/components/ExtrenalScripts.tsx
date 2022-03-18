import React from "react";
import Script from "next/script";
import { matomoEnabled, isBrowser } from "../modules/const";

const ExternalScripts = (): JSX.Element | null => {
  if (!isBrowser || !matomoEnabled) {
    return null;
  }

  return (
    <>
      <Script
        id="cookiehub"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          // eslint-disable-next-line
          __html: `
var cpm = {};
(function(h,u,b){
var d=h.getElementsByTagName("script")[0],e=h.createElement("script");
e.async=true;e.src='https://cookiehub.net/c2/c7e96adf.js';
e.onload=function(){u.cookiehub.load(b);}
d.parentNode.insertBefore(e,d);
})(document,window,cpm);
`,
        }}
      />
      <Script
        data-consent="analytics"
        type="text/plain"
        strategy="afterInteractive"
        id="matomo"
        dangerouslySetInnerHTML={{
          // eslint-disable-next-line
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
    </>
  );
};

export default ExternalScripts;
