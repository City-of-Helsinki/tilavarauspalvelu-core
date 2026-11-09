import { step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

/** The reserver type choice on the booking form. */
export class ReservationUnitReserverTypes extends PageObject {
  // BOOKING DETAILS
  @step("reservation_unit_reserver_types.Select Reserver Type")
  async selectReserverType(reserver_type: string) {
    await this.page.locator(reserver_type).click();
  }
}
