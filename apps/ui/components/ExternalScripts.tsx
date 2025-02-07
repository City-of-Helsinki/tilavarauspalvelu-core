import React from "react";
import Script from "next/script";
import { isBrowser } from "@/modules/const";

const hosts = [
  "tilavaraus.hel.fi",
  "tilavaraus.dev.hel.ninja",
  "tilavaraus.test.hel.ninja",
  "tilavaraus.stage.hel.ninja",
];

// Hack to make cookiehub not destroy our cookies
// temporary for a few weeks to fix critical production issue
const addCookieHubExceptions = `
  const cookies = ["csrftoken", "sessionid", "language"];
  for (let i = 0; i < cookies.length; i++) {
    window.__cookiehub.cookies.push({
      category: (window.__cookiehub.categories.find((c) => c.implicit).id),
      expiry: "365 {day}",
      display_name: cookies[i],
      hide: 0,
      hosts: ${JSON.stringify(hosts)},
      http_only: 0,
      id: 99990 + i,
      name: cookies[i],
      path: "/",
      prefix: 0,
      secure: 0,
      third_party: 0,
      type: 1
    });
  }
`;
export function ExternalScripts({
  cookiehubEnabled,
  matomoEnabled,
  hotjarEnabled,
}: {
  cookiehubEnabled: boolean;
  matomoEnabled: boolean;
  hotjarEnabled: boolean;
}): JSX.Element | null {
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
    domain: "",
  },
  language: document.documentElement.lang !== null
    ? document.documentElement.lang.substr(0, 2)
    : "fi",
};
(function(h,u,b){
var d=h.getElementsByTagName("script")[0],e=h.createElement("script");
e.async=true;e.src='https://cookiehub.net/c2/c7e96adf.js';
e.onload=function(){
  u.cookiehub.load(b);
  ${addCookieHubExceptions};
}
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
}
