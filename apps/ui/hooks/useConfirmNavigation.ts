import { useRouter } from "next/router";
import { useEffect } from "react";

/// How to use these hooks:
/// - navigation hook: useConfirmNavigation
/// allows both blocking the navigation and calling a callback function when the user confirms the navigation
/// - refresh hook: useConfirmBrowserRefresh
/// allows blocking the refresh (and stray <a> links)
///
/// Design issues:
/// - have to use non linear control flow (exceptions) to break out of routing
/// - exceptions in React are designed to break, not for control flow (Fallback components instead of catch -> ignore).
/// - can't tap into browser events (there is a good reason for that, but makes this only a partial solution)
///   e.g. we can intercept the back button and links, but we can't intercept the url change or window close.
/// - can't call the cb function unless the link is a next-link
/// - requires separate handling for a links, next-links, and refresh
/// - refresh is a special case (useful for forms, but not for the callback use case).

/// Confirm navigation (next-link)
/// @param confirm - if true, the user will be prompted to confirm the navigation
/// @param confirmMessage - the message to show to the user
/// @param onNavigationConfirmed - the callback function to call when the user confirms the navigation
/// @param whitelist - a list of urls to ignore the confirmation
export function useConfirmNavigation(props: {
  confirm: boolean;
  confirmMessage: string;
  onNavigationConfirmed?: () => void;
  whitelist?: Array<RegExp | string>;
}) {
  const { confirm, confirmMessage, onNavigationConfirmed, whitelist } = props;
  const router = useRouter();
  useEffect(() => {
    // The only way to escape the routing is to throw an error
    const handler = (url: string) => {
      // skip so we don't call the callback if checks are disabled
      if (!confirm) {
        return;
      }
      if (whitelist != null) {
        for (const whitelisted of whitelist) {
          const m = url.match(whitelisted);
          if (m != null) {
            return;
          }
        }
      }
      // eslint-disable-next-line no-alert
      if (!window.confirm(confirmMessage)) {
        // TODO should use a custom error type and catch it in the page / component
        // but if we inherit from Error we need to catch it and error-boundary is not designed for ignoring errors.
        // eslint-disable-next-line @typescript-eslint/no-throw-literal -- we don't want this to be processed
        throw "Route Canceled";
      }
      onNavigationConfirmed?.();
    };
    router.events.on("beforeHistoryChange", handler);

    return () => {
      router.events.off("beforeHistoryChange", handler);
    };
  }, [confirm, confirmMessage, onNavigationConfirmed, router, whitelist]);
}

/// Confirm browser refresh
/// @param confirm - if true, the user will be prompted to confirm the refresh
/// @param confirmMessage - the message to show to the user
/// Use case: form reset, unsaved changes
/// handles refresh and <a> links (there should be no <a> links in the app)
/// doesn't support callback because there is no easy way to hook it (page load event is the closest)
export function useConfirmBrowserRefresh(
  confirm: boolean,
  confirmMessage: string
) {
  useEffect(() => {
    const beforeUnloadHandler = (event: Event) => {
      if (confirm) {
        // Handle browser navigation or refresh (doesn't handle closing)
        event?.preventDefault(); // Recommended
        // Included for legacy support, e.g. Chrome/Edge < 119
        event.returnValue = true;
      }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    };
  }, [confirm, confirmMessage]);
}
