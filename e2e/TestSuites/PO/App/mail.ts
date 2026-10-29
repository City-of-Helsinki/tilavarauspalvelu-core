/** Port of PO/App/mail.robot */
import { V, expect, str, step, log } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { PageObject } from "../../page-object";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import "../../Resources/parallel_test_data";
import { robot_email_test_tool } from "../../Resources/robot_email_test_tool";

export class Mail extends PageObject {
  /** Verify confirmation email contains all required terms */
  @step("mail.Verify Reservation Confirmation Email")
  async verifyReservationConfirmationEmail(reservation_number: RobotValue) {
    let expected_terms: RobotValue;
    await log(`Verifying confirmation email for reservation: ${str(reservation_number)}`);

    // Build list of expected terms
    expected_terms = [
      V.ALWAYS_PAID_UNIT,
      V.CONFIRMATION_TEXT_IN_MAIL,
      reservation_number,
      V.FORMATTED_STARTTIME_EMAIL,
      V.FORMATTED_ENDTIME_EMAIL,
    ];

    // Port: the backend sends emails from a background task, so the email cache is checked until the email is there
    await expect(async () => {
      const result = await robot_email_test_tool.verify_reservation_email(reservation_number, expected_terms, false); // No attachment expected
      expect(result, "Some required terms are missing in confirmation email").toBe(true);
    }).toPass({ intervals: [5000], timeout: 120_000 });
  }

  /** Verify cancellation email contains all required terms */
  @step("mail.Verify Reservation Cancellation Email")
  async verifyReservationCancellationEmail(reservation_number: RobotValue) {
    let expected_terms: RobotValue;
    await log(`Verifying cancellation email for reservation: ${str(reservation_number)}`);

    expected_terms = [
      V.ALWAYS_PAID_UNIT,
      V.CANCELLATION_TEXT_IN_MAIL,
      reservation_number,
      V.FORMATTED_STARTTIME_EMAIL,
      V.FORMATTED_ENDTIME_EMAIL,
    ];

    // Port: the email cache is checked until the email is there, see Verify Reservation Confirmation Email
    await expect(async () => {
      const result = await robot_email_test_tool.verify_reservation_email(reservation_number, expected_terms, false); // No attachment expected
      expect(result, "Some required terms are missing in cancellation email").toBe(true);
    }).toPass({ intervals: [5000], timeout: 120_000 });
  }

  /** Format reservation times for email verification */
  @step("mail.Format Reservation Time For Email Texts And Receipts")
  async formatReservationTimeForEmailTextsAndReceipts(time_of_reservation: RobotValue) {
    // This sets "Alkamisaika: 1.11.2024 klo 11:00" and "Päättymisaika: 1.11.2024 klo 12:00"
    await log('this formats variables "FORMATTED_STARTTIME" and "FORMATTED_ENDTIME"');
    await this.pages.dataModification.formatsReservationTimeToStartAndEndTime(time_of_reservation);
  }
}
