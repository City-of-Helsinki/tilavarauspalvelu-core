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

export function TrackingWrapper({ children, matomoEnabled }: TrackingWrapperProps): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    // oxlint-disable react/exhaustive-deps -- should be refactored to remove event handler on unmount
    if (matomoEnabled) {
      router.events.on("routeChangeComplete", trackPageView);
    }
    // oxlint-enable react/exhaustive-deps -- should be refactored to remove event handler on unmount
  }, []);

  // eslint-disable-next-line react/jsx-no-useless-fragment -- return type issues
  return <>{children}</>;
}
