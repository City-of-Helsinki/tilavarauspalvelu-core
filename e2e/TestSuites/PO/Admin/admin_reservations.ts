/** Port of PO/Admin/admin_reservations.robot */
import type { Locator } from "@playwright/test";
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { BASIC_ADMIN_MALE } from "../../Resources/serial_users";
import {
  ADMIN_BEHALF_FIRSTNAME_FI,
  ADMIN_BEHALF_PHONE_FI,
  CALENDAR_CHANGE_TIME_FI,
  JUSTIFICATION_FOR_SUBVENTION,
  PREFIX_RESERVATIONS_BY_ADMIN_BEHALF_FI,
} from "../../Resources/texts_FI";

export class AdminReservations extends PageObject {
  /** This keyword types the reservation number and there should be only one match in the list */
  @step("admin_reservations.Admin Searches Reservation With Id Number And Clicks It From Name")
  async adminSearchesReservationWithIdNumberAndClicksItFromName(booking_number: string, user_fullname: string) {
    await expect(
      this.page.locator("#search"),
      "Check we are on the page where admin can filter reservations"
    ).toBeVisible();
    await this.page.locator("#search").fill(booking_number);
    await this.page.locator('[type="submit"]').click();
    // Check Elements Text waits until the search results show the reservation
    await this.pages.customKeywords.checkElementsText(this.page.getByTestId("pk-0"), booking_number, {
      message: "ERROR: Check from screenshot that the search worked and there is only one match in the list.",
    });
    await this.pages.customKeywords.findAndClickElementWithText(
      this.page.getByTestId("reservee_name-0").locator("a"),
      user_fullname
    );
    // The reservation's page opens
    await this.page.waitForURL((url) => url.pathname.endsWith(`/reservations/${booking_number}`), {
      timeout: 15_000,
    });
  }

  @step("admin_reservations.Admin Searches Reservation With Id Number And Checks The Status")
  async adminSearchesReservationWithIdNumberAndChecksTheStatus(booking_number: string, reservation_status: string) {
    await expect(
      this.page.locator("#search"),
      "Check we are on the page where admin can filter reservations"
    ).toBeVisible();
    await this.page.locator('[type="submit"]').click();
    // Check Elements Text waits until the search results show the reservation
    await this.pages.customKeywords.checkElementsText(this.page.getByTestId("pk-0"), booking_number, {
      message: "ERROR: Check from screenshot that the search worked and there is only one match in the list.",
    });
    await this.pages.customKeywords.checkElementsText(this.page.getByTestId("state-0"), reservation_status);
  }

  @step("admin_reservations.Admin Checks Reservation H1")
  async adminChecksReservationH1(h1_reservationnumber_firstname_lastname: string) {
    await expect(this.page.getByTestId("reservation_title_section__reservation_state")).toBeVisible();
    await this.pages.customKeywords.checkElementsText("h1", h1_reservationnumber_firstname_lastname);
  }

  @step("admin_reservations.Admin Checks Reservation Title Tagline")
  async adminChecksReservationTitleTagline(reservation_tagline: string) {
    // ${RESERVATION_TAGLINE} is set with keyword Formats tagline for admin side
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation_title_section__tagline"),
      reservation_tagline
    );
  }

  @step("admin_reservations.Admin Checks Reservation Info Dialog Time Tagline")
  async adminChecksReservationInfoDialogTimeTagline(reservation_tagline: string) {
    // DEVNOTE: Not in use for now
    // The time boxes of the edit time dialog are paragraphs with the time in bold
    await this.pages.customKeywords.findTextFromElementsOrFail(
      this.page.locator("#info-dialog").locator("p > b"),
      reservation_tagline
    );
  }

  @step("admin_reservations.Admin Checks Reservation User Info")
  async adminChecksReservationUserInfo() {
    await this.pages.customKeywords.findAndClickElementWithText(".label", "Tilan käyttäjän tiedot");
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__info--Sukunimi"),
      this.state.adminBehalfLastnameFi
    );
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__info--Etunimi"),
      ADMIN_BEHALF_FIRSTNAME_FI
    );
  }

  @step("admin_reservations.Admin Checks Reservation Maker Info")
  async adminChecksReservationMakerInfo() {
    await this.pages.customKeywords.findAndClickElementWithText(".label", "Varauksen tekijä");
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__info--Varauksen tekijä"),
      BASIC_ADMIN_MALE.fullName
    );
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__info--Sähköposti"),
      BASIC_ADMIN_MALE.email
    );
  }

  @step("admin_reservations.Admin Checks Reservation Info After Handling")
  async adminChecksReservationInfoAfterHandling(
    singlebooking_price: string,
    singlebooking_status: string,
    purpose_of_the_booking: string,
    singlebooking_description: string,
    singlebooking_number_of_participants: string,
    singlebooking_age_group: string | null,
    reason_of_rejection: string | null
  ) {
    // Check price if provided
    if (singlebooking_price !== "None") {
      await this.pages.customKeywords.checkElementsTextWithRemoveNonBreakingSpace(
        '[data-testid="reservation__summary--Hinta"]',
        singlebooking_price
      );
    }

    // Check status if provided
    if (singlebooking_status !== "None") {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation_title_section__reservation_state"),
        singlebooking_status
      );
    }

    // Check purpose if provided
    if (purpose_of_the_booking !== "None") {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation__summary--Käyttötarkoitus"),
        purpose_of_the_booking
      );
    }

    // Check description if provided
    if (singlebooking_description !== "None") {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation__summary--Kuvaus"),
        singlebooking_description
      );
    }

    // Check number of participants if provided
    if (singlebooking_number_of_participants !== "None") {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation__summary--Osallistujamäärä"),
        singlebooking_number_of_participants
      );
    }

    // Check age group if provided
    if (singlebooking_age_group != null) {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation__summary--Ikäryhmä"),
        singlebooking_age_group
      );
    }

    // Check reason of rejection if provided
    if (reason_of_rejection != null) {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation__summary--Hylkäyksen syy"),
        reason_of_rejection
      );
    }
  }

  @step("admin_reservations.Admin Checks Reservation Info Before Handling")
  async adminChecksReservationInfoBeforeHandling(
    singlebooking_price: string,
    singlebooking_status: string,
    purpose_of_the_booking: string,
    singlebooking_description: string,
    singlebooking_number_of_participants: string,
    singlebooking_age_group: string | null
  ) {
    // Check price if provided
    if (singlebooking_price !== "None") {
      await this.pages.customKeywords.checkElementsTextWithRemoveNonBreakingSpace(
        '[data-testid="reservation__summary--Hinta"]',
        singlebooking_price
      );
    }

    // Check status if provided
    if (singlebooking_status !== "None") {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation_title_section__reservation_state"),
        singlebooking_status
      );
    }

    // Check purpose if provided
    if (purpose_of_the_booking !== "None") {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation__summary--Käyttötarkoitus"),
        purpose_of_the_booking
      );
    }

    // Check description if provided
    if (singlebooking_description !== "None") {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation__summary--Kuvaus"),
        singlebooking_description
      );
    }

    // Check number of participants if provided
    if (singlebooking_number_of_participants !== "None") {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation__summary--Osallistujamäärä"),
        singlebooking_number_of_participants
      );
    }

    // Check age group if provided
    if (singlebooking_age_group != null) {
      await this.pages.customKeywords.checkElementsText(
        this.page.getByTestId("reservation__summary--Ikäryhmä"),
        singlebooking_age_group
      );
    }
  }

  @step("admin_reservations.Admin Checks Reservation Status")
  async adminChecksReservationStatus(status: string) {
    await log(status);
    // Check Elements Text waits until the page shows the status
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation_title_section__reservation_state"),
      status
    );
  }

  @step("admin_reservations.Admin Saves Reservation Number")
  async adminSavesReservationNumber() {
    // Opens the reservation details section
    await this.page.locator("#reservation__reservation-details-heading").click();
    await expect(this.page.getByTestId("reservation__info--Varaustunnus")).toBeVisible();
    // Gets the reservation number
    const reservation_number = await this.page.getByTestId("reservation__info--Varaustunnus").innerText();
    this.state.reservationNumberAdminside = reservation_number;
  }

  @step("admin_reservations.Admin Clicks Button In Reservation Page")
  async adminClicksButtonInReservationPage(button_data_id: string | Locator) {
    await this.locate(button_data_id).click();
  }

  @step("admin_reservations.Admin Selects Reservation Unit")
  async adminSelectsReservationUnit(by_unit: string) {
    await this.page.locator("#reservation-unit-toggle-button").click();
    await this.pages.customKeywords.findAndClickElementWithText(
      this.page.locator("#reservation-unit-menu").locator("li"),
      by_unit
    );
  }

  @step("admin_reservations.Admin Open Access Code Modal")
  async adminOpenAccessCodeModal() {
    await this.page.locator("#reservation__access-type").click();
  }

  @step("admin_reservations.Admin Changes Access Code")
  async adminChangesAccessCode() {
    await this.page.getByTestId("AccessCodeChangeRepairButton--open-dialog").click();
  }

  // Dialog window
  @step("admin_reservations.Admin Selects Reason For Rejection")
  async adminSelectsReasonForRejection(reason_of_rejection: string) {
    await this.page.locator("#denyReason-main-button").click();
    await this.page.locator("#denyReason-list").getByRole("option", { name: reason_of_rejection, exact: true }).click();
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await this.pages.customKeywords.closeSelectListIfOpen("#denyReason-main-button");
  }

  @step("admin_reservations.Admin Checks Reason For Subvention In Dialog")
  async adminChecksReasonForSubventionInDialog() {
    await this.pages.customKeywords.findTextFromElementsOrFail(
      this.page.locator("#info-dialog").locator("p"),
      JUSTIFICATION_FOR_SUBVENTION
    );
  }

  @step("admin_reservations.Admin Clicks Set Reservation To Free")
  async adminClicksSetReservationToFree() {
    await this.page.locator("#clearPrice").click();
    await expect(this.page.locator("#approvalPrice")).toHaveValue("0");
  }

  @step("admin_reservations.Admin Fills Reservation Details Behalf")
  async adminFillsReservationDetailsBehalf() {
    // this keyword generates a random letter and number and uses that string as last name
    const ADMIN_BEHALF_LASTNAME = await this.pages.dataModification.generateRandomLetterAndNumber();
    this.state.adminBehalfLastnameFi = ADMIN_BEHALF_LASTNAME;

    // this keyword generates the info for checking calendar content
    const Calendar_event_content_name = await this.pages.dataModification.formatsCalendarEventContent(
      ADMIN_BEHALF_FIRSTNAME_FI,
      this.state.adminBehalfLastnameFi,
      PREFIX_RESERVATIONS_BY_ADMIN_BEHALF_FI
    );
    this.state.calendarEventName = Calendar_event_content_name;

    await this.page.locator('[name="reserveeFirstName"]').fill(ADMIN_BEHALF_FIRSTNAME_FI);
    await this.page.locator('[name="reserveeLastName"]').fill(this.state.adminBehalfLastnameFi);
    await this.page.locator('[name="reserveeEmail"]').fill(BASIC_ADMIN_MALE.email);
    await this.page.locator('[name="reserveePhone"]').fill(ADMIN_BEHALF_PHONE_FI);
  }

  /**
   * This keyword changes the time with date and hours and minutes.
   * This test uses 00 for minutes. So all the changed times will be 10:00–11:00 -> 15:00–17:00 etc.
   */
  @step("admin_reservations.Admin Enters Reservation Time And Type Of Reservation")
  async adminEntersReservationTimeAndTypeOfReservation(
    type_of_reservation: string,
    startTime_hours: string,
    endTime_hours: string,
    date: string
  ) {
    // Click  ${type_of_reservation}
    // Type Text  id=ReservationDialog.startTime-hours  ${startTime-hours}
    await this.page.locator('[id="TimeInput.startTime-hours"]').clear();
    await this.page.locator('[id="TimeInput.startTime-hours"]').pressSequentially(startTime_hours);
    // Type Text  id=ReservationDialog.startTime-minutes  00
    await this.page.locator('[id="TimeInput.startTime-minutes"]').clear();
    await this.page.locator('[id="TimeInput.startTime-minutes"]').pressSequentially("00");
    // Type Text  id=ReservationDialog.endTime-hours  ${endTime-hours}
    await this.page.locator('[id="TimeInput.endTime-hours"]').clear();
    await this.page.locator('[id="TimeInput.endTime-hours"]').pressSequentially(endTime_hours);
    // Type Text  id=ReservationDialog.endTime-minutes  00
    await this.page.locator('[id="TimeInput.endTime-minutes"]').clear();
    await this.page.locator('[id="TimeInput.endTime-minutes"]').pressSequentially("00");
    await this.page.locator("#controlled-date-input__date").clear();
    await this.page.locator("#controlled-date-input__date").pressSequentially(date);

    await this.page.locator(type_of_reservation).click();
  }

  @step("admin_reservations.Admin Clicks Confirm Access Code Button")
  async adminClicksConfirmAccessCodeButton() {
    await this.page.getByTestId("AccessCodeChangeRepairButton__ConfirmationDialog--accept").click();
  }

  @step("admin_reservations.Admin Closes Dialog Modal")
  async adminClosesDialogModal() {
    await this.page.locator("#info-dialog").getByTestId("CreateReservationModal__cancel-reservation").click();
    // waiting for the dialog to close
    await expect(this.page.locator("#info-dialog")).toBeHidden();
  }

  /** Fails if the reservation modal stays open after submit/cancel. */
  @step("admin_reservations.Admin Verifies Reservation Modal Is Closed")
  async adminVerifiesReservationModalIsClosed() {
    // Saving the reservation closes the modal, so this waits for the save too
    await expect(
      this.page.locator("#info-dialog"),
      "Reservation modal did not close correctly: id=info-dialog is still visible"
    ).toBeHidden({ timeout: 15_000 });
  }

  // Reservation calendar
  /**
   * This keyword opens the reservation calendar and changes the reservation time.
   * It uses the keyword 'Admin enters reservation time and type of reservation' to set the new time.
   */
  @step("admin_reservations.Admin Opens Calendar And Changes Reservation Time")
  async adminOpensCalendarAndChangesReservationTime() {
    await this.page.locator("#reservation__calendar-heading").click();
    // By its text: the calendar's toolbar is aria-hidden in the app, so its buttons have no role to find them by
    await this.page
      .locator("#reservation__calendar-content")
      .getByText(CALENDAR_CHANGE_TIME_FI, { exact: true })
      .click();

    // Call the keyword and capture the returned values
    const [date_plus_x_days, start_hour, end_hour] = await this.pages.dataModification.getModifiedDateAndTime();

    this.state.modifiedDateSubventedReservation = date_plus_x_days;
    this.state.modifiedHourStarttimeSubventedReservation = start_hour;
    this.state.modifiedHourEndtimeSubventedReservation = end_hour;

    // This for the keyword Set and format the reservation finnish time
    this.state.modifiedStarttimeSubventedReservation = `${start_hour}.00`;

    // Changes the reservation time with date and hours and minutes
    await log("This test uses 00 for minutes. So all the changed times will be 10:00–11:00 -> 15:00–17:00 etc");

    await this.page.locator('[id="TimeInput.startTime-hours"]').clear();
    await this.page
      .locator('[id="TimeInput.startTime-hours"]')
      .pressSequentially(this.state.modifiedHourStarttimeSubventedReservation);
    await this.page.locator('[id="TimeInput.startTime-minutes"]').clear();
    await this.page.locator('[id="TimeInput.startTime-minutes"]').pressSequentially("00");
    await this.page.locator('[id="TimeInput.endTime-hours"]').clear();
    await this.page
      .locator('[id="TimeInput.endTime-hours"]')
      .pressSequentially(this.state.modifiedHourEndtimeSubventedReservation);
    await this.page.locator('[id="TimeInput.endTime-minutes"]').clear();
    await this.page.locator('[id="TimeInput.endTime-minutes"]').pressSequentially("00");
    await this.page.locator("#controlled-date-input__date").clear();
    await this.page
      .locator("#controlled-date-input__date")
      .pressSequentially(this.state.modifiedDateSubventedReservation);
    await expect(
      this.page.locator('button[type="submit"]'),
      " Check that the modified time is available?"
    ).toBeEnabled();
    await this.page.locator('button[type="submit"]').focus();
    await this.page.locator('button[type="submit"]').click();
    // Saving the new time closes the dialog
    await expect(this.page.locator("#info-dialog")).toBeHidden({ timeout: 15_000 });

    // Not currently in use
    // This was used to navigate to reservations through calendar view
    // Admin Finds Reservation And Clicks It
    // [Arguments]  ${reservation_name}
    // Sleep  3s
    // custom_keywords.Find And Click Element With Exact Text Using JS
    // ...  [role="button"] >> css=.rbc-event-content
    // ...  ${reservation_name}
    // Sleep  500ms
    // Wait For Load State  load  timeout=15s
  }
}
