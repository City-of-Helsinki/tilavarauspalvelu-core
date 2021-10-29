import { promotionHandlers } from "./handlers/promotions";
import { recommendationHandlers } from "./handlers/recommendations";
import { reservationUnitHandlers } from "./handlers/reservationUnit";
import { reservationUnitSearchHandlers } from "./handlers/singleSearch";
import { applicationRoundHandlers } from "./handlers/applicationRound";
import { reservationHandlers } from "./handlers/reservation";

export const handlers = [
  ...reservationUnitSearchHandlers,
  ...promotionHandlers,
  ...recommendationHandlers,
  ...reservationUnitHandlers,
  ...applicationRoundHandlers,
  ...reservationHandlers,
];
