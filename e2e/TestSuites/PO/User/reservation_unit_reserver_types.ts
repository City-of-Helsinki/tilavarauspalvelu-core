/** Port of PO/User/reservation_unit_reserver_types.robot */
import { Browser } from "../../../lib/Browser";
import { keywords } from "../../../lib/robot";

export const reservation_unit_reserver_types = keywords("reservation_unit_reserver_types", {
  // BOOKING DETAILS
  "Select Reserver Type": async (reserver_type: string) => {
    await Browser["Click"](reserver_type);
  },
});
