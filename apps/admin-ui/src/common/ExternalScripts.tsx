import React from "react";
import Script from "next/script";
import { isBrowser } from "@/common/const";

export function ExternalScripts({
  isHotjarEnabled,
  isCookiehubEnabled,
}: {
  isHotjarEnabled: boolean;
  isCookiehubEnabled: boolean;
}): JSX.Element | null {
  if (!isBrowser) {
    return null;
  }

  return (
    <>
      {isCookiehubEnabled && (
        <Script
          id="cookiehub"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            var cpm = {
              cookie: {
                domain: ''
              },
              language: "fi",
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
      {isHotjarEnabled && (
        <Script
          id="hotjar"
          strategy="afterInteractive"
          data-consent="analytics"
          type="text/plain"
          dangerouslySetInnerHTML={{
            __html: `
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:2913611,hjsv:6};
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
