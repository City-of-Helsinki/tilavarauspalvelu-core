/** Port of PO/User/reservation_unit_reservation_receipt.robot */
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import {
  JUSTIFICATION_FOR_FREE_OF_CHARGE,
  PURPOSE_OF_THE_BOOKING,
  SINGLEBOOKING_DESCRIPTION,
  SINGLEBOOKING_NAME,
  SINGLEBOOKING_NUMBER_OF_PERSONS,
} from "../../Resources/texts_FI";

export class ReservationUnitReservationReceipt extends PageObject {
  /** Validates the reservation details of the user. */
  @step("reservation_unit_reservation_receipt.Check Reservation User Info")
  async checkReservationUserInfo() {
    await expect(this.page.getByTestId("reservation__summary-fields__reserveeFirstName")).toContainText(
      this.testData.user.firstName,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__reserveeLastName")).toContainText(
      this.testData.user.lastName,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__reserveeEmail")).toContainText(
      this.testData.user.email,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__reserveePhone")).toContainText(
      this.testData.user.phone,
      { useInnerText: true }
    );
  }

  /** Validates details for a free single booking. */
  @step("reservation_unit_reservation_receipt.Check Free Single Booking Info")
  async checkFreeSingleBookingInfo() {
    await expect(this.page.getByTestId("reservation__summary-fields__name")).toContainText(SINGLEBOOKING_NAME, {
      useInnerText: true,
    });
    await expect(this.page.getByTestId("reservation__summary-fields__purpose")).toContainText(PURPOSE_OF_THE_BOOKING, {
      useInnerText: true,
    });
    await expect(this.page.getByTestId("reservation__summary-fields__description")).toContainText(
      SINGLEBOOKING_DESCRIPTION,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("confirm_freeOfChargeReason")).toContainText(JUSTIFICATION_FOR_FREE_OF_CHARGE, {
      useInnerText: true,
    });
    await expect(this.page.getByTestId("reservation__summary-fields__numPersons")).toContainText(
      SINGLEBOOKING_NUMBER_OF_PERSONS,
      { useInnerText: true }
    );
  }

  /** Validates details for a single booking. */
  @step("reservation_unit_reservation_receipt.Check Single Booking Info")
  async checkSingleBookingInfo() {
    await expect(this.page.getByTestId("reservation__summary-fields__name")).toContainText(SINGLEBOOKING_NAME, {
      useInnerText: true,
    });
    await expect(this.page.getByTestId("reservation__summary-fields__purpose")).toContainText(PURPOSE_OF_THE_BOOKING, {
      useInnerText: true,
    });
    await expect(this.page.getByTestId("reservation__summary-fields__description")).toContainText(
      SINGLEBOOKING_DESCRIPTION,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__numPersons")).toContainText(
      SINGLEBOOKING_NUMBER_OF_PERSONS,
      { useInnerText: true }
    );
  }

  /** Validates details for a non-cancelable booking. */
  @step("reservation_unit_reservation_receipt.Check Noncancelable Booking Info")
  async checkNoncancelableBookingInfo() {
    await expect(this.page.getByTestId("reservation__summary-fields__description")).toContainText(
      SINGLEBOOKING_DESCRIPTION,
      { useInnerText: true }
    );
    await expect(this.page.getByTestId("reservation__summary-fields__numPersons")).toContainText(
      SINGLEBOOKING_NUMBER_OF_PERSONS,
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
