import { promotionHandlers } from "./handlers/promotions";
import { recommendationHandlers } from "./handlers/recommendations";
import { reservationUnitSearchHandlers } from "./handlers/singleSearch";

export const handlers = [
  ...reservationUnitSearchHandlers,
  ...promotionHandlers,
  ...recommendationHandlers,
];
