import type { Locator } from "@playwright/test";
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { BASIC_ADMIN_MALE } from "../../Resources/serial_users";
import {
  ADMIN_BEHALF_FIRSTNAME_FI,
  ADMIN_BEHALF_PHONE_FI,
  ADMIN_TOAST_NEW_TIME_SAVED,
  CALENDAR_CHANGE_TIME_FI,
  JUSTIFICATION_FOR_SUBVENTION,
  PREFIX_RESERVATIONS_BY_ADMIN_BEHALF_FI,
} from "../../Resources/texts_FI";
import { TEXT_CHECK_TIMEOUT } from "../../Resources/variables";

/** The admin's reservation pages: the search of the requested list, a reservation and its dialogs. */
export class AdminReservations extends PageObject {
  /** The reservation's info dialog */
  private get infoDialog() {
    return this.page.locator("#info-dialog");
  }

  /** The reservation's state, under its title */
  private get reservationState() {
    return this.page.getByTestId("reservation_title_section__reservation_state");
  }

  /** The start time's hours */
  private get startHoursInput() {
    return this.page.locator('[id="TimeInput.startTime-hours"]');
  }

  /** The start time's minutes */
  private get startMinutesInput() {
    return this.page.locator('[id="TimeInput.startTime-minutes"]');
  }

  /** The end time's hours */
  private get endHoursInput() {
    return this.page.locator('[id="TimeInput.endTime-hours"]');
  }

  /** The end time's minutes */
  private get endMinutesInput() {
    return this.page.locator('[id="TimeInput.endTime-minutes"]');
  }

  /** This keyword types the reservation number and there should be only one match in the list */
  @step("admin_reservations.Admin Searches Reservation With Id Number And Clicks It From Name")
  async adminSearchesReservationWithIdNumberAndClicksItFromName(booking_number: string, user_fullname: string) {
    await expect(this.page.locator("#search"), "The page has the reservation search").toBeVisible();
    await this.page.locator("#search").fill(booking_number);
    await this.page.locator('[type="submit"]').click();
    // The check waits until the search results show the reservation
    await expect(this.page.getByTestId("pk-0"), `The search shows reservation ${booking_number} first`).toHaveText(
      booking_number,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
    await this.page.getByTestId("reservee_name-0").getByRole("link", { name: user_fullname, exact: true }).click();
    // The reservation's page opens
    await this.page.waitForURL((url) => url.pathname.endsWith(`/reservations/${booking_number}`), {
      timeout: 15_000,
    });
  }

  @step("admin_reservations.Admin Searches Reservation With Id Number And Checks The Status")
  async adminSearchesReservationWithIdNumberAndChecksTheStatus(booking_number: string, reservation_status: string) {
    await expect(this.page.locator("#search"), "The page has the reservation search").toBeVisible();
    await this.page.locator('[type="submit"]').click();
    // The check waits until the search results show the reservation
    await expect(this.page.getByTestId("pk-0"), `The search shows reservation ${booking_number} first`).toHaveText(
      booking_number,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
    await expect(this.page.getByTestId("state-0"), `The search shows the state ${reservation_status}`).toHaveText(
      reservation_status,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
  }

  @step("admin_reservations.Admin Checks Reservation H1")
  async adminChecksReservationH1(h1_reservationnumber_firstname_lastname: string) {
    await expect(this.reservationState).toBeVisible();
    await expect(this.page.locator("h1")).toHaveText(h1_reservationnumber_firstname_lastname, {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
  }

  @step("admin_reservations.Admin Checks Reservation Title Tagline")
  async adminChecksReservationTitleTagline(reservation_tagline: string) {
    // ${RESERVATION_TAGLINE} is set with keyword Formats tagline for admin side
    await expect(this.page.getByTestId("reservation_title_section__tagline")).toHaveText(reservation_tagline, {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
  }

  @step("admin_reservations.Admin Checks Reservation Info Dialog Time Tagline")
  async adminChecksReservationInfoDialogTimeTagline(reservation_tagline: string) {
    // DEVNOTE: Not in use for now
    // The time boxes of the edit time dialog are paragraphs with the time in bold
    await this.pages.customKeywords.findTextFromElementsOrFail(this.infoDialog.locator("p > b"), reservation_tagline);
  }

  @step("admin_reservations.Admin Checks Reservation User Info")
  async adminChecksReservationUserInfo() {
    await this.pages.customKeywords.findAndClickElementWithText(".label", "Tilan käyttäjän tiedot");
    await expect(
      this.page.getByTestId("reservation__info--Sukunimi"),
      `The reserver's last name is ${this.state.adminBehalfLastnameFi}`
    ).toHaveText(this.state.adminBehalfLastnameFi, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    await expect(
      this.page.getByTestId("reservation__info--Etunimi"),
      `The reserver's first name is ${ADMIN_BEHALF_FIRSTNAME_FI}`
    ).toHaveText(ADMIN_BEHALF_FIRSTNAME_FI, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
  }

  @step("admin_reservations.Admin Checks Reservation Maker Info")
  async adminChecksReservationMakerInfo() {
    await this.pages.customKeywords.findAndClickElementWithText(".label", "Varauksen tekijä");
    await expect(
      this.page.getByTestId("reservation__info--Varauksen tekijä"),
      `The reservation was made by ${BASIC_ADMIN_MALE.fullName}`
    ).toHaveText(BASIC_ADMIN_MALE.fullName, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    await expect(
      this.page.getByTestId("reservation__info--Sähköposti"),
      `The reservation maker's email is ${BASIC_ADMIN_MALE.email}`
    ).toHaveText(BASIC_ADMIN_MALE.email, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
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
        this.page.getByTestId("reservation__summary--Hinta"),
        singlebooking_price
      );
    }

    // Check status if provided
    if (singlebooking_status !== "None") {
      await expect(this.reservationState, `The reservation's state is ${singlebooking_status}`).toHaveText(
        singlebooking_status,
        { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
      );
    }

    // Check purpose if provided
    if (purpose_of_the_booking !== "None") {
      await expect(
        this.page.getByTestId("reservation__summary--Käyttötarkoitus"),
        `The purpose of use is ${purpose_of_the_booking}`
      ).toHaveText(purpose_of_the_booking, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    }

    // Check description if provided
    if (singlebooking_description !== "None") {
      await expect(
        this.page.getByTestId("reservation__summary--Kuvaus"),
        `The description is ${singlebooking_description}`
      ).toHaveText(singlebooking_description, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    }

    // Check number of participants if provided
    if (singlebooking_number_of_participants !== "None") {
      await expect(
        this.page.getByTestId("reservation__summary--Osallistujamäärä"),
        `The number of participants is ${singlebooking_number_of_participants}`
      ).toHaveText(singlebooking_number_of_participants, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    }

    // Check age group if provided
    if (singlebooking_age_group != null) {
      await expect(
        this.page.getByTestId("reservation__summary--Ikäryhmä"),
        `The age group is ${singlebooking_age_group}`
      ).toHaveText(singlebooking_age_group, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    }

    // Check reason of rejection if provided
    if (reason_of_rejection != null) {
      await expect(
        this.page.getByTestId("reservation__summary--Hylkäyksen syy"),
        `The reason for rejection is ${reason_of_rejection}`
      ).toHaveText(reason_of_rejection, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
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
        this.page.getByTestId("reservation__summary--Hinta"),
        singlebooking_price
      );
    }

    // Check status if provided
    if (singlebooking_status !== "None") {
      await expect(this.reservationState, `The reservation's state is ${singlebooking_status}`).toHaveText(
        singlebooking_status,
        { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
      );
    }

    // Check purpose if provided
    if (purpose_of_the_booking !== "None") {
      await expect(
        this.page.getByTestId("reservation__summary--Käyttötarkoitus"),
        `The purpose of use is ${purpose_of_the_booking}`
      ).toHaveText(purpose_of_the_booking, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    }

    // Check description if provided
    if (singlebooking_description !== "None") {
      await expect(
        this.page.getByTestId("reservation__summary--Kuvaus"),
        `The description is ${singlebooking_description}`
      ).toHaveText(singlebooking_description, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    }

    // Check number of participants if provided
    if (singlebooking_number_of_participants !== "None") {
      await expect(
        this.page.getByTestId("reservation__summary--Osallistujamäärä"),
        `The number of participants is ${singlebooking_number_of_participants}`
      ).toHaveText(singlebooking_number_of_participants, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    }

    // Check age group if provided
    if (singlebooking_age_group != null) {
      await expect(
        this.page.getByTestId("reservation__summary--Ikäryhmä"),
        `The age group is ${singlebooking_age_group}`
      ).toHaveText(singlebooking_age_group, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
    }
  }

  @step("admin_reservations.Admin Checks Reservation Status")
  async adminChecksReservationStatus(status: string) {
    // The check waits until the page shows the status
    await expect(this.reservationState).toHaveText(status, {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
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
      this.infoDialog.locator("p"),
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
    await this.startHoursInput.clear();
    await this.startHoursInput.pressSequentially(startTime_hours);
    // Type Text  id=ReservationDialog.startTime-minutes  00
    await this.startMinutesInput.clear();
    await this.startMinutesInput.pressSequentially("00");
    // Type Text  id=ReservationDialog.endTime-hours  ${endTime-hours}
    await this.endHoursInput.clear();
    await this.endHoursInput.pressSequentially(endTime_hours);
    // Type Text  id=ReservationDialog.endTime-minutes  00
    await this.endMinutesInput.clear();
    await this.endMinutesInput.pressSequentially("00");
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
    await this.infoDialog.getByTestId("CreateReservationModal__cancel-reservation").click();
    // waiting for the dialog to close
    await expect(this.infoDialog).toBeHidden();
  }

  /** Fails if the reservation modal stays open after submit/cancel. */
  @step("admin_reservations.Admin Verifies Reservation Modal Is Closed")
  async adminVerifiesReservationModalIsClosed() {
    // Saving the reservation closes the modal, so this waits for the save too
    await expect(this.infoDialog, "The reservation dialog closes").toBeHidden({ timeout: 15_000 });
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
    await log("This test uses 00 for minutes. So all the changed times will be 10:00–11:00 -> 15:00–17:00 etc", {
      level: "DEBUG",
    });

    await this.startHoursInput.clear();
    await this.startHoursInput.pressSequentially(this.state.modifiedHourStarttimeSubventedReservation);
    await this.startMinutesInput.clear();
    await this.startMinutesInput.pressSequentially("00");
    await this.endHoursInput.clear();
    await this.endHoursInput.pressSequentially(this.state.modifiedHourEndtimeSubventedReservation);
    await this.endMinutesInput.clear();
    await this.endMinutesInput.pressSequentially("00");
    await this.page.locator("#controlled-date-input__date").clear();
    await this.page
      .locator("#controlled-date-input__date")
      .pressSequentially(this.state.modifiedDateSubventedReservation);
    // The edit time dialog's own submit button
    const submit = this.infoDialog.locator('button[type="submit"]');
    await expect(submit, "The new time can be saved: it is free").toBeEnabled();
    await submit.focus();
    await submit.click();
    // Saving the new time closes the dialog
    await expect(this.infoDialog).toBeHidden({ timeout: 15_000 });
    await this.pages.popups.checkAndCloseTheToast(ADMIN_TOAST_NEW_TIME_SAVED);

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
