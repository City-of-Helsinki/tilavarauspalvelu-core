import { useEffect } from "react";
import { useTranslation } from "next-i18next/pages";
import { useRouter } from "next/router";
import { ROUTE_CHANGE_CANCELLED_MESSAGE } from "@/modules/const";

/// Ask the user to confirm before they leave a page that has unsaved changes.
/// Covers links, router.push, the browser back and forward buttons, reload and tab close.
/// Set hasUnsavedChanges to false while the page saves and navigates, so a save does not ask.
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean): void {
  const router = useRouter();
  const { t } = useTranslation();
  const message = t("common:unsavedChangesConfirm");

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    // Back and forward go through both onBeforePopState and onRouteChangeStart. Ask only once.
    let isLeaveConfirmed = false;
    const confirmLeave = (): boolean => {
      // oxlint-disable-next-line no-alert -- the route change handlers must answer at once. A custom dialog is async.
      isLeaveConfirmed = isLeaveConfirmed || window.confirm(message);
      return isLeaveConfirmed;
    };
    // A confirmed navigation can still fail. Ask again on the next one.
    const resetConfirm = () => {
      isLeaveConfirmed = false;
    };

    // Reload and tab close. The browser shows its own text.
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    // The history entry of this page. Used to undo a cancelled back or forward navigation.
    const pageState: unknown = window.history.state;
    const pageUrl = window.location.href;
    const onBeforePopState = (): boolean => {
      if (confirmLeave()) {
        return true;
      }
      // The browser already moved in the history. Add this page back, so the address bar shows the correct page.
      window.history.pushState(pageState, "", pageUrl);
      return false;
    };

    // Next.js (pages router) has no API to cancel a route change. Throwing here is the known way.
    // The error goes to the caller of router.push as a rejected promise. Sentry ignores it by its message.
    const onRouteChangeStart = () => {
      if (!confirmLeave()) {
        throw new Error(ROUTE_CHANGE_CANCELLED_MESSAGE);
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    router.beforePopState(onBeforePopState);
    router.events.on("routeChangeStart", onRouteChangeStart);
    router.events.on("routeChangeError", resetConfirm);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      router.beforePopState(() => true);
      router.events.off("routeChangeStart", onRouteChangeStart);
      router.events.off("routeChangeError", resetConfirm);
    };
  }, [hasUnsavedChanges, message, router]);
}
