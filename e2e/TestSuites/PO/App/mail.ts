/** Port of PO/App/mail.robot */
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, isTruthy, keywords, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { data_modification } from "../../Resources/data_modification";
import { robot_email_test_tool } from "../../Resources/robot_email_test_tool";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import "../../Resources/parallel_test_data";

export const mail = keywords("mail", {
  /** Verify confirmation email contains all required terms */
  "Verify Reservation Confirmation Email": async (reservation_number: RobotValue) => {
    let expected_terms: RobotValue, result: RobotValue;
    await BuiltIn["Log"](`Verifying confirmation email for reservation: ${str(reservation_number)}`);

    // Build list of expected terms
    expected_terms = [
      V.ALWAYS_PAID_UNIT,
      V.CONFIRMATION_TEXT_IN_MAIL,
      reservation_number,
      V.FORMATTED_STARTTIME_EMAIL,
      V.FORMATTED_ENDTIME_EMAIL,
    ];

    // Use new API-based verification
    result = await robot_email_test_tool.verify_reservation_email(reservation_number, expected_terms, false); // No attachment expected

    if (!isTruthy(result)) {
      await BuiltIn["Fail"]("Some required terms are missing in confirmation email");
    }
  },

  /** Verify cancellation email contains all required terms */
  "Verify Reservation Cancellation Email": async (reservation_number: RobotValue) => {
    let expected_terms: RobotValue, result: RobotValue;
    await BuiltIn["Log"](`Verifying cancellation email for reservation: ${str(reservation_number)}`);

    expected_terms = [
      V.ALWAYS_PAID_UNIT,
      V.CANCELLATION_TEXT_IN_MAIL,
      reservation_number,
      V.FORMATTED_STARTTIME_EMAIL,
      V.FORMATTED_ENDTIME_EMAIL,
    ];

    result = await robot_email_test_tool.verify_reservation_email(reservation_number, expected_terms, false); // No attachment expected

    if (!isTruthy(result)) {
      await BuiltIn["Fail"]("Some required terms are missing in cancellation email");
    }
  },

  /** Format reservation times for email verification */
  "Format Reservation Time For Email Texts And Receipts": async (time_of_reservation: RobotValue) => {
    // This sets "Alkamisaika: 1.11.2024 klo 11:00" and "Päättymisaika: 1.11.2024 klo 12:00"
    await BuiltIn["Log"]('this formats variables "FORMATTED_STARTTIME" and "FORMATTED_ENDTIME"');
    await data_modification["Formats Reservation Time To Start And End Time"](time_of_reservation);

    //
    //
    //
  },
});
