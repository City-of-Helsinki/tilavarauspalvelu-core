/** Port of PO/User/reservation_unit_reservation_receipt.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, keywords, named } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/parallel_test_data";

export const reservation_unit_reservation_receipt = keywords("reservation_unit_reservation_receipt", {
  /** Validates the reservation details of the user. */
  "Check Reservation User Info": async () => {
    let confirmed_firstname: RobotValue,
      confirmed_lastname: RobotValue,
      confirmed_email: RobotValue,
      confirmed_phone: RobotValue;
    await Browser["Wait For Elements State"]('[data-testid="reservation__summary-fields__reserveePhone"]', "visible");
    //
    confirmed_firstname = await Browser["Get Text"]('[data-testid="reservation__summary-fields__reserveeFirstName"]');
    await BuiltIn["Should Contain"](confirmed_firstname, V.CURRENT_USER_FIRST_NAME);
    //
    confirmed_lastname = await Browser["Get Text"]('[data-testid="reservation__summary-fields__reserveeLastName"]');
    await BuiltIn["Should Contain"](confirmed_lastname, V.CURRENT_USER_LAST_NAME);
    //
    confirmed_email = await Browser["Get Text"]('[data-testid="reservation__summary-fields__reserveeEmail"]');
    await BuiltIn["Should Contain"](confirmed_email, V.CURRENT_USER_EMAIL);
    //
    confirmed_phone = await Browser["Get Text"]('[data-testid="reservation__summary-fields__reserveePhone"]');
    await BuiltIn["Should Contain"](confirmed_phone, V.CURRENT_USER_PHONE);
  },

  /** Validates details for a free single booking. */
  "Check Free Single Booking Info": async () => {
    let confirmed_name_of_booking: RobotValue,
      confirmed_purpose: RobotValue,
      confirmed_description: RobotValue,
      confirmed_reason_for_free: RobotValue,
      confirmed_number_of_persons: RobotValue;
    await Browser["Wait For Elements State"]('[data-testid="reservation__summary-fields__reserveePhone"]', "visible");
    //
    confirmed_name_of_booking = await Browser["Get Text"]('[data-testid="reservation__summary-fields__name"]');
    await BuiltIn["Should Contain"](confirmed_name_of_booking, V.SINGLEBOOKING_NAME);
    //
    confirmed_purpose = await Browser["Get Text"]('[data-testid="reservation__summary-fields__purpose"]');
    await BuiltIn["Should Contain"](confirmed_purpose, V.PURPOSE_OF_THE_BOOKING);
    //
    confirmed_description = await Browser["Get Text"]('[data-testid="reservation__summary-fields__description"]');
    await BuiltIn["Should Contain"](confirmed_description, V.SINGLEBOOKING_DESCRIPTION);
    //
    confirmed_reason_for_free = await Browser["Get Text"]('[data-testid="confirm_freeOfChargeReason"]');
    await BuiltIn["Should Contain"](confirmed_reason_for_free, V.JUSTIFICATION_FOR_FREE_OF_CHARGE);
    //
    confirmed_number_of_persons = await Browser["Get Text"]('[data-testid="reservation__summary-fields__numPersons"]');
    await BuiltIn["Should Contain"](confirmed_number_of_persons, V.SINGLEBOOKING_NUMBER_OF_PERSONS);
  },

  /** Validates details for a single booking. */
  "Check Single Booking Info": async () => {
    let confirmed_name_of_booking: RobotValue,
      confirmed_purpose: RobotValue,
      confirmed_description: RobotValue,
      confirmed_number_of_persons: RobotValue;
    await Browser["Wait For Elements State"]('[data-testid="reservation__summary-fields__reserveePhone"]', "visible");
    //
    confirmed_name_of_booking = await Browser["Get Text"]('[data-testid="reservation__summary-fields__name"]');
    await BuiltIn["Should Contain"](confirmed_name_of_booking, V.SINGLEBOOKING_NAME);
    //
    confirmed_purpose = await Browser["Get Text"]('[data-testid="reservation__summary-fields__purpose"]');
    await BuiltIn["Should Contain"](confirmed_purpose, V.PURPOSE_OF_THE_BOOKING);
    //
    confirmed_description = await Browser["Get Text"]('[data-testid="reservation__summary-fields__description"]');
    await BuiltIn["Should Contain"](confirmed_description, V.SINGLEBOOKING_DESCRIPTION);
    //
    confirmed_number_of_persons = await Browser["Get Text"]('[data-testid="reservation__summary-fields__numPersons"]');
    await BuiltIn["Should Contain"](confirmed_number_of_persons, V.SINGLEBOOKING_NUMBER_OF_PERSONS);
  },

  /** Validates details for a non-cancelable booking. */
  "Check Noncancelable Booking Info": async () => {
    let confirmed_description: RobotValue, confirmed_number_of_persons: RobotValue;
    await Browser["Wait For Elements State"]('[data-testid="reservation__summary-fields__description"]', "visible");
    //
    confirmed_description = await Browser["Get Text"]('[data-testid="reservation__summary-fields__description"]');
    await BuiltIn["Should Contain"](confirmed_description, V.SINGLEBOOKING_DESCRIPTION);
    //
    confirmed_number_of_persons = await Browser["Get Text"]('[data-testid="reservation__summary-fields__numPersons"]');
    await BuiltIn["Should Contain"](confirmed_number_of_persons, V.SINGLEBOOKING_NUMBER_OF_PERSONS);

    //
    // VALIDATION MESSAGES
    //
  },

  "Check The Reservation Status Message": async (expected_reservation_message: RobotValue) => {
    let confirmation_text: RobotValue;
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__status-notification"]',
      "visible",
      named({ timeout: "15s" })
    );
    confirmation_text = await Browser["Get Text"]('[data-testid="reservation__status-notification"]');
    await BuiltIn["Should Contain"](confirmation_text, expected_reservation_message);
    await BuiltIn["Log"](expected_reservation_message);

    //
    // TERMS AND CONDITIONS
    //
  },

  "Click The Checkbox Accepted Terms": async () => {
    await Browser["Click"]('[for="cancellation-and-payment-terms-terms-accepted"]');
  },

  "Click The Checkbox Generic Terms": async () => {
    await Browser["Click"]('[for="generic-and-service-specific-terms-terms-accepted"]');
  },
});
