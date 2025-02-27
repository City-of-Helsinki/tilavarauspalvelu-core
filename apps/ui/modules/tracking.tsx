import React, { useEffect } from "react";
import { useRouter } from "next/router";

const trackPageView = () => {
  try {
    const _paq = (window._paq = window._paq || []);
    _paq.push(["trackPageView"]);
  } catch (_) {
    // ignore
  }
};

type TrackingWrapperProps = {
  children: React.ReactNode;
  matomoEnabled: boolean;
};

export const TrackingWrapper = ({
  children,
  matomoEnabled,
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
