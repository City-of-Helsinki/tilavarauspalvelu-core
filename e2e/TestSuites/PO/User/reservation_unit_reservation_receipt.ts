/** Port of PO/User/reservation_unit_reservation_receipt.robot */
import { V, expect, step, log } from "../../../lib/robot";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/parallel_test_data";
import { PageObject } from "../../page-object";

export class ReservationUnitReservationReceipt extends PageObject {
  /** Validates the reservation details of the user. */
  @step("reservation_unit_reservation_receipt.Check Reservation User Info")
  async checkReservationUserInfo() {
    await expect(this.page.getByTestId("reservation__summary-fields__reserveeFirstName")).toContainText(
      V.CURRENT_USER_FIRST_NAME,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__reserveeLastName")).toContainText(
      V.CURRENT_USER_LAST_NAME,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__reserveeEmail")).toContainText(
      V.CURRENT_USER_EMAIL,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__reserveePhone")).toContainText(
      V.CURRENT_USER_PHONE,
      { useInnerText: true }
    );
  }

  /** Validates details for a free single booking. */
  @step("reservation_unit_reservation_receipt.Check Free Single Booking Info")
  async checkFreeSingleBookingInfo() {
    await expect(this.page.getByTestId("reservation__summary-fields__name")).toContainText(V.SINGLEBOOKING_NAME, {
      useInnerText: true,
    });
    await expect(this.page.getByTestId("reservation__summary-fields__purpose")).toContainText(
      V.PURPOSE_OF_THE_BOOKING,
      {
        useInnerText: true,
      }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__description")).toContainText(
      V.SINGLEBOOKING_DESCRIPTION,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("confirm_freeOfChargeReason")).toContainText(
      V.JUSTIFICATION_FOR_FREE_OF_CHARGE,
      {
        useInnerText: true,
      }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__numPersons")).toContainText(
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      { useInnerText: true }
    );
  }

  /** Validates details for a single booking. */
  @step("reservation_unit_reservation_receipt.Check Single Booking Info")
  async checkSingleBookingInfo() {
    await expect(this.page.getByTestId("reservation__summary-fields__name")).toContainText(V.SINGLEBOOKING_NAME, {
      useInnerText: true,
    });
    await expect(this.page.getByTestId("reservation__summary-fields__purpose")).toContainText(
      V.PURPOSE_OF_THE_BOOKING,
      {
        useInnerText: true,
      }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__description")).toContainText(
      V.SINGLEBOOKING_DESCRIPTION,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__numPersons")).toContainText(
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      { useInnerText: true }
    );
  }

  /** Validates details for a non-cancelable booking. */
  @step("reservation_unit_reservation_receipt.Check Noncancelable Booking Info")
  async checkNoncancelableBookingInfo() {
    await expect(this.page.getByTestId("reservation__summary-fields__description")).toContainText(
      V.SINGLEBOOKING_DESCRIPTION,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__numPersons")).toContainText(
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      { useInnerText: true }
    );
  }

  // VALIDATION MESSAGES
  @step("reservation_unit_reservation_receipt.Check The Reservation Status Message")
  async checkTheReservationStatusMessage(expected_reservation_message: string) {
    await expect(this.page.getByTestId("reservation__status-notification")).toContainText(
      expected_reservation_message,
      {
        useInnerText: true,
        timeout: 15_000,
      }
    );
    await log(expected_reservation_message);
  }

  // TERMS AND CONDITIONS
  @step("reservation_unit_reservation_receipt.Click The Checkbox Accepted Terms")
  async clickTheCheckboxAcceptedTerms() {
    await this.page.locator("#cancellation-and-payment-terms-terms-accepted").check();
  }

  @step("reservation_unit_reservation_receipt.Click The Checkbox Generic Terms")
  async clickTheCheckboxGenericTerms() {
    await this.page.locator("#generic-and-service-specific-terms-terms-accepted").check();
  }
}
