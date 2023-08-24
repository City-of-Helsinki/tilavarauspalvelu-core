import { promotionHandlers } from "./handlers/promotions";
import { reservationUnitHandlers } from "./handlers/reservationUnit";
import { reservationUnitSearchHandlers } from "./handlers/singleSearch";
import { applicationRoundHandlers } from "./handlers/applicationRound";
import { reservationHandlers } from "./handlers/reservation";
import { applicationHandlers } from "./handlers/application";
import { userHandlers } from "./handlers/user";
import { parameterHandlers } from "./handlers/parameters";

export const handlers = [
  ...reservationUnitSearchHandlers,
  ...promotionHandlers,
  ...reservationUnitHandlers,
  ...applicationRoundHandlers,
  ...reservationHandlers,
  ...applicationRoundHandlers,
  ...applicationHandlers,
  ...userHandlers,
  ...parameterHandlers,
];
