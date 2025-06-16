import { useEffect } from "react";
import { useLocalStorage } from "react-use";

/// Local storage usage has been removed
/// leaving this hook for now to cleanup any existing users
export function useRemoveStoredReservation() {
  const [storedReservation, , removeStoredReservation] = useLocalStorage<unknown>("reservation");

  useEffect(() => {
    if (storedReservation) removeStoredReservation();
  }, [storedReservation, removeStoredReservation]);
}
