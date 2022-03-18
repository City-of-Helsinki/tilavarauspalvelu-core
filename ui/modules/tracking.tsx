import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { matomoEnabled } from "./const";

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

  useEffect(() => {
    if (matomoEnabled) {
      router.events.on("routeChangeComplete", trackPageView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};
