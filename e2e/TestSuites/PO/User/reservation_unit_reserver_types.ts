/** Port of PO/User/reservation_unit_reserver_types.robot */
import { step } from "../../../lib/robot";
import { PageObject } from "../../page-object";

export class ReservationUnitReserverTypes extends PageObject {
  // BOOKING DETAILS
  @step("reservation_unit_reserver_types.Select Reserver Type")
  async selectReserverType(reserver_type: string) {
    await this.page.locator(reserver_type).click();
  }
}
