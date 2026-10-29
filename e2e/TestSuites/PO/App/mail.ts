/** Port of PO/App/mail.robot */
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { robot_email_test_tool } from "../../Resources/robot_email_test_tool";
import { CANCELLATION_TEXT_IN_MAIL, CONFIRMATION_TEXT_IN_MAIL } from "../../Resources/texts_FI";
import { ALWAYS_PAID_UNIT } from "../../Resources/variables";

export class Mail extends PageObject {
  /** Verify confirmation email contains all required terms */
  @step("mail.Verify Reservation Confirmation Email")
  async verifyReservationConfirmationEmail(reservation_number: string) {
    await log(`Verifying confirmation email for reservation: ${reservation_number}`);

    // Build list of expected terms
    const expected_terms = [
      ALWAYS_PAID_UNIT,
      CONFIRMATION_TEXT_IN_MAIL,
      reservation_number,
      this.state.formattedStarttimeEmail,
      this.state.formattedEndtimeEmail,
    ];

    // Port: the backend sends emails from a background task, so the email cache is checked until the email is there
    await expect(async () => {
      const result = await robot_email_test_tool.verify_reservation_email(reservation_number, expected_terms, false); // No attachment expected
      expect(result, "Some required terms are missing in confirmation email").toBe(true);
    }).toPass({ intervals: [5000], timeout: 120_000 });
  }

  /** Verify cancellation email contains all required terms */
  @step("mail.Verify Reservation Cancellation Email")
  async verifyReservationCancellationEmail(reservation_number: string) {
    await log(`Verifying cancellation email for reservation: ${reservation_number}`);

    const expected_terms = [
      ALWAYS_PAID_UNIT,
      CANCELLATION_TEXT_IN_MAIL,
      reservation_number,
      this.state.formattedStarttimeEmail,
      this.state.formattedEndtimeEmail,
    ];

    // Port: the email cache is checked until the email is there, see Verify Reservation Confirmation Email
    await expect(async () => {
      const result = await robot_email_test_tool.verify_reservation_email(reservation_number, expected_terms, false); // No attachment expected
      expect(result, "Some required terms are missing in cancellation email").toBe(true);
    }).toPass({ intervals: [5000], timeout: 120_000 });
  }

  /** Format reservation times for email verification */
  @step("mail.Format Reservation Time For Email Texts And Receipts")
  async formatReservationTimeForEmailTextsAndReceipts(time_of_reservation: string) {
    // This sets "Alkamisaika: 1.11.2024 klo 11:00" and "Päättymisaika: 1.11.2024 klo 12:00"
    await log('this formats variables "FORMATTED_STARTTIME" and "FORMATTED_ENDTIME"');
    await this.pages.dataModification.formatsReservationTimeToStartAndEndTime(time_of_reservation);
  }
}
