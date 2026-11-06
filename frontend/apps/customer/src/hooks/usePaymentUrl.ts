import { useSyncExternalStore } from "react";
import type { LocalizationLanguages } from "ui/src/modules/urlBuilder";
import type { ReservationPaymentUrlFragment } from "@gql/gql-types";
import { getPaymentUrl } from "@/modules/reservation";

function subscribeToNothing(): () => void {
  return () => {};
}

function getPageOrigin(): string | null {
  return window.location.origin;
}

function getServerPageOrigin(): string | null {
  return null;
}

/// Returns the payment url of a reservation.
/// The url for a handled reservation needs the page origin, which only the browser knows.
/// The server render and the first browser render use null, so the html from the server matches the hydration.
/// Then React renders again with the page origin.
export function usePaymentUrl(
  reservation: ReservationPaymentUrlFragment,
  lang: LocalizationLanguages
): string | undefined {
  const pageOrigin = useSyncExternalStore(subscribeToNothing, getPageOrigin, getServerPageOrigin);
  return getPaymentUrl(reservation, lang, pageOrigin);
}
