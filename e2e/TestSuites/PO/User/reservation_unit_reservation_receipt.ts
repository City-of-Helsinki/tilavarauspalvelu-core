/** Port of PO/User/reservation_unit_reservation_receipt.robot */
import { Browser, loc } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, expect, keywords } from "../../../lib/robot";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/parallel_test_data";

export const reservation_unit_reservation_receipt = keywords("reservation_unit_reservation_receipt", {
  /** Validates the reservation details of the user. */
  "Check Reservation User Info": async () => {
    await expect(loc('[data-testid="reservation__summary-fields__reserveeFirstName"]')).toContainText(
      V.CURRENT_USER_FIRST_NAME,
      { useInnerText: true }
    );
    await expect(loc('[data-testid="reservation__summary-fields__reserveeLastName"]')).toContainText(
      V.CURRENT_USER_LAST_NAME,
      { useInnerText: true }
    );
    await expect(loc('[data-testid="reservation__summary-fields__reserveeEmail"]')).toContainText(
      V.CURRENT_USER_EMAIL,
      { useInnerText: true }
    );
    await expect(loc('[data-testid="reservation__summary-fields__reserveePhone"]')).toContainText(
      V.CURRENT_USER_PHONE,
      { useInnerText: true }
    );
  },

  /** Validates details for a free single booking. */
  "Check Free Single Booking Info": async () => {
    await expect(loc('[data-testid="reservation__summary-fields__name"]')).toContainText(V.SINGLEBOOKING_NAME, {
      useInnerText: true,
    });
    await expect(loc('[data-testid="reservation__summary-fields__purpose"]')).toContainText(V.PURPOSE_OF_THE_BOOKING, {
      useInnerText: true,
    });
    await expect(loc('[data-testid="reservation__summary-fields__description"]')).toContainText(
      V.SINGLEBOOKING_DESCRIPTION,
      { useInnerText: true }
    );
    await expect(loc('[data-testid="confirm_freeOfChargeReason"]')).toContainText(V.JUSTIFICATION_FOR_FREE_OF_CHARGE, {
      useInnerText: true,
    });
    await expect(loc('[data-testid="reservation__summary-fields__numPersons"]')).toContainText(
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      { useInnerText: true }
    );
  },

  /** Validates details for a single booking. */
  "Check Single Booking Info": async () => {
    await expect(loc('[data-testid="reservation__summary-fields__name"]')).toContainText(V.SINGLEBOOKING_NAME, {
      useInnerText: true,
    });
    await expect(loc('[data-testid="reservation__summary-fields__purpose"]')).toContainText(V.PURPOSE_OF_THE_BOOKING, {
      useInnerText: true,
    });
    await expect(loc('[data-testid="reservation__summary-fields__description"]')).toContainText(
      V.SINGLEBOOKING_DESCRIPTION,
      { useInnerText: true }
    );
    await expect(loc('[data-testid="reservation__summary-fields__numPersons"]')).toContainText(
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      { useInnerText: true }
    );
  },

  /** Validates details for a non-cancelable booking. */
  "Check Noncancelable Booking Info": async () => {
    await expect(loc('[data-testid="reservation__summary-fields__description"]')).toContainText(
      V.SINGLEBOOKING_DESCRIPTION,
      { useInnerText: true }
    );
    await expect(loc('[data-testid="reservation__summary-fields__numPersons"]')).toContainText(
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      { useInnerText: true }
    );
  },

  // VALIDATION MESSAGES
  "Check The Reservation Status Message": async (expected_reservation_message: string) => {
    await expect(loc('[data-testid="reservation__status-notification"]')).toContainText(expected_reservation_message, {
      useInnerText: true,
      timeout: 15_000,
    });
    await BuiltIn["Log"](expected_reservation_message);
  },

  // TERMS AND CONDITIONS
  "Click The Checkbox Accepted Terms": async () => {
    await Browser["Click"]('[for="cancellation-and-payment-terms-terms-accepted"]');
  },

  "Click The Checkbox Generic Terms": async () => {
    await Browser["Click"]('[for="generic-and-service-specific-terms-terms-accepted"]');
  },
});
