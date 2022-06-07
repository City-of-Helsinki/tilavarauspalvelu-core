import React from "react";
import { Helmet } from "react-helmet";

const ExternalScripts = (): JSX.Element => {
  const isCookiehubEnabled = process.env.REACT_APP_COOKIEHUB_ENABLED === "true";
  const isHotjarEnabled = process.env.REACT_APP_HOTJAR_ENABLED === "true";

  return (
    <Helmet>
      {isCookiehubEnabled && (
        <script>
          {`
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
          `}
        </script>
      )}
      {isHotjarEnabled && (
        <script>
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:2913611,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </script>
      )}
    </Helmet>
  );
};

export default ExternalScripts;
