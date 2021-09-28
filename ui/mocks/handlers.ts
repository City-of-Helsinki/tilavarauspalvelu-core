import { reservationUnitHandlers } from "./handlers/reservationUnit";
import { reservationUnitSearchHandlers } from "./handlers/singleSearch";

export const handlers = [
  ...reservationUnitHandlers,
  ...reservationUnitSearchHandlers,
];
