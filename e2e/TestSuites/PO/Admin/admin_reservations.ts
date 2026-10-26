/** Port of PO/Admin/admin_reservations.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import { data_modification } from "../../Resources/data_modification";
import "../../Resources/variables";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/parallel_test_data";

export const admin_reservations = keywords("admin_reservations", {
  /** This keyword types the reservation number and there should be only one match in the list */
  "Admin Searches Reservation With Id Number And Clicks It From Name": async (
    booking_number: RobotValue,
    user_fullname: RobotValue
  ) => {
    await Browser["Wait For Elements State"](
      "id=search",
      "visible",
      named({ message: "Check we are on the page where admin can filter reservations" })
    );
    await Browser["Type Text"]("id=search", booking_number);
    await BuiltIn["Sleep"]("1s");
    await Browser["Click"]('[type="submit"]');
    await BuiltIn["Sleep"]("4s"); // wait for the search results to load
    await custom_keywords["Check Elements Text"](
      '[data-testid="pk-0"]',
      booking_number,
      undefined,
      undefined,
      undefined,
      /* message= */ "ERROR: Check from screenshot that the search worked and there is only one match in the list."
    );
    await custom_keywords["Find And Click Element With Text"]('[data-testid="reservee_name-0"] >> a', user_fullname);
    await BuiltIn["Sleep"]("5s"); // wait for the page to load
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
  },

  "Admin Searches Reservation With Id Number And Checks The Status": async (
    booking_number: RobotValue,
    reservation_status: RobotValue
  ) => {
    await Browser["Wait For Elements State"](
      "id=search",
      "visible",
      named({ message: "Check we are on the page where admin can filter reservations" })
    );
    await BuiltIn["Sleep"]("1s");
    await Browser["Click"]('[type="submit"]');
    await BuiltIn["Sleep"]("4s"); // wait for the search results to load
    await custom_keywords["Check Elements Text"](
      '[data-testid="pk-0"]',
      booking_number,
      undefined,
      undefined,
      undefined,
      /* message= */ "ERROR: Check from screenshot that the search worked and there is only one match in the list."
    );
    await custom_keywords["Check Elements Text"]('[data-testid="state-0"]', reservation_status);
    await BuiltIn["Sleep"]("2s");
  },

  "Admin Checks Reservation H1": async (h1_reservationnumber_firstname_lastname: RobotValue) => {
    await Browser["Wait For Elements State"]('[data-testid="reservation_title_section__reservation_state"]', "visible");
    await custom_keywords["Check Elements Text"]("h1", h1_reservationnumber_firstname_lastname);
  },

  "Admin Checks Reservation Title Tagline": async (reservation_tagline: RobotValue) => {
    await Browser["Wait For Elements State"]('[data-testid="reservation_title_section__tagline"]', "visible");

    // ${RESERVATION_TAGLINE} is set with keyword Formats tagline for admin side
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation_title_section__tagline"]',
      reservation_tagline
    );
  },

  "Admin Checks Reservation Info Dialog Time Tagline": async (reservation_tagline: RobotValue) => {
    // DEVNOTE: Not in use for now
    await custom_keywords["Find Text From Elements Or Fail"](
      '[class*="EditTimeModal__TimeInfoBox"] >> b',
      reservation_tagline
    );
  },

  "Admin Checks Reservation User Info": async () => {
    await custom_keywords["Find And Click Element With Text"]("css=.label", "Tilan käyttäjän tiedot");
    await BuiltIn["Sleep"]("500ms");
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__info--Sukunimi"]',
      V.ADMIN_BEHALF_LASTNAME_FI
    );
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__info--Etunimi"]',
      V.ADMIN_BEHALF_FIRSTNAME_FI
    );
  },

  "Admin Checks Reservation Maker Info": async () => {
    await custom_keywords["Find And Click Element With Text"]("css=.label", "Varauksen tekijä");
    await BuiltIn["Sleep"]("500ms");
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__info--Varauksen tekijä"]',
      V.BASIC_ADMIN_MALE_FULLNAME
    );
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__info--Sähköposti"]',
      V.BASIC_ADMIN_MALE_EMAIL
    );
  },

  "Admin Checks Reservation Info After Handling": async (
    singlebooking_price: RobotValue,
    singlebooking_status: RobotValue,
    purpose_of_the_booking: RobotValue,
    singlebooking_description: RobotValue,
    singlebooking_number_of_participants: RobotValue,
    singlebooking_age_group: RobotValue,
    reason_of_rejection: RobotValue
  ) => {
    // Check price if provided
    if (str(singlebooking_price) !== "None") {
      await custom_keywords["Check Elements Text With Remove Non-breaking Space"](
        '[data-testid="reservation__summary--Hinta"]',
        singlebooking_price
      );
    }

    // Check status if provided
    if (str(singlebooking_status) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation_title_section__reservation_state"]',
        singlebooking_status
      );
    }

    // Check purpose if provided
    if (str(purpose_of_the_booking) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation__summary--Käyttötarkoitus"]',
        purpose_of_the_booking
      );
    }

    // Check description if provided
    if (str(singlebooking_description) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation__summary--Kuvaus"]',
        singlebooking_description
      );
    }

    // Check number of participants if provided
    if (str(singlebooking_number_of_participants) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation__summary--Osallistujamäärä"]',
        singlebooking_number_of_participants
      );
    }

    // Check age group if provided
    if (str(singlebooking_age_group) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation__summary--Ikäryhmä"]',
        singlebooking_age_group
      );
    }

    // Check reason of rejection if provided
    if (str(reason_of_rejection) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation__summary--Hylkäyksen syy"]',
        reason_of_rejection
      );
    }
  },

  "Admin Checks Reservation Info Before Handling": async (
    singlebooking_price: RobotValue,
    singlebooking_status: RobotValue,
    purpose_of_the_booking: RobotValue,
    singlebooking_description: RobotValue,
    singlebooking_number_of_participants: RobotValue,
    singlebooking_age_group: RobotValue
  ) => {
    // Check price if provided
    if (str(singlebooking_price) !== "None") {
      await custom_keywords["Check Elements Text With Remove Non-breaking Space"](
        '[data-testid="reservation__summary--Hinta"]',
        singlebooking_price
      );
    }

    // Check status if provided
    if (str(singlebooking_status) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation_title_section__reservation_state"]',
        singlebooking_status
      );
    }

    // Check purpose if provided
    if (str(purpose_of_the_booking) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation__summary--Käyttötarkoitus"]',
        purpose_of_the_booking
      );
    }

    // Check description if provided
    if (str(singlebooking_description) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation__summary--Kuvaus"]',
        singlebooking_description
      );
    }

    // Check number of participants if provided
    if (str(singlebooking_number_of_participants) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation__summary--Osallistujamäärä"]',
        singlebooking_number_of_participants
      );
    }

    // Check age group if provided
    if (str(singlebooking_age_group) !== "None") {
      await custom_keywords["Check Elements Text"](
        '[data-testid="reservation__summary--Ikäryhmä"]',
        singlebooking_age_group
      );
    }
  },

  "Admin Checks Reservation Status": async (status: RobotValue) => {
    await BuiltIn["Log"](status);
    await BuiltIn["Sleep"]("2s");
    await Browser["Wait For Elements State"]('[data-testid="reservation_title_section__reservation_state"]', "visible");
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation_title_section__reservation_state"]',
      status
    );
  },

  "Admin Saves Reservation Number": async () => {
    let reservation_number: RobotValue;
    // Opens the reservation details section
    await Browser["Click"]("id=reservation__reservation-details-heading");
    await BuiltIn["Sleep"]("500ms");
    await Browser["Wait For Elements State"]('[data-testid="reservation__info--Varaustunnus"]', "visible");
    // Gets the reservation number
    reservation_number = await Browser["Get Text"]('[data-testid="reservation__info--Varaustunnus"]');
    V.RESERVATION_NUMBER_ADMINSIDE = reservation_number;
  },

  "Admin Clicks Button In Reservation Page": async (button_data_id: RobotValue) => {
    await Browser["Click"](button_data_id);
    await BuiltIn["Sleep"]("2.5s");
  },

  "Admin Selects Reservation Unit": async (by_unit: RobotValue) => {
    await Browser["Wait For Elements State"]("id=reservation-unit-toggle-button", "visible");
    await Browser["Click"]("id=reservation-unit-toggle-button");
    await BuiltIn["Sleep"]("1.5s");
    await custom_keywords["Find And Click Element With Text"]("id=reservation-unit-menu >> li", by_unit);
    await BuiltIn["Sleep"]("1s");
  },

  "Admin Open Access Code Modal": async () => {
    await Browser["Click"]("id=reservation__access-type");
    // Wait for the modal to open
    await BuiltIn["Sleep"]("1s");
  },

  "Admin Changes Access Code": async () => {
    await Browser["Click"]('[data-testid="AccessCodeChangeRepairButton--open-dialog"]');
    // Wait for the modal to open
    await BuiltIn["Sleep"]("1s");

    //
    // Dialog window
    //
  },

  "Admin Selects Reason For Rejection": async (reason_of_rejection: RobotValue) => {
    await Browser["Wait For Elements State"]("id=denyReason-main-button", "visible");
    await Browser["Click"]("id=denyReason-main-button");
    await BuiltIn["Sleep"]("1s");
    await custom_keywords["Find And Click Element With Text"]("id=denyReason-list >> li", reason_of_rejection);
  },

  "Admin Checks Reason For Subvention In Dialog": async () => {
    await custom_keywords["Find Text From Elements Or Fail"]("id=info-dialog >> p", V.JUSTIFICATION_FOR_SUBVENTION);
  },

  "Admin Clicks Set Reservation To Free": async () => {
    let value: RobotValue;
    await Browser["Wait For Elements State"]("id=clearPrice", "visible");
    await Browser["Click"]("id=clearPrice");
    await BuiltIn["Sleep"]("500ms");
    value = await Browser["Get Attribute"]("id=approvalPrice", "value");
    await BuiltIn["Should Be Equal"](value, "0");
  },

  "Admin Fills Reservation Details Behalf": async () => {
    let ADMIN_BEHALF_LASTNAME: RobotValue, Calendar_event_content_name: RobotValue;
    // this keyword generates a random letter and number and uses that string as last name
    ADMIN_BEHALF_LASTNAME = await data_modification["Generate Random Letter And Number"]();
    V.ADMIN_BEHALF_LASTNAME_FI = ADMIN_BEHALF_LASTNAME;

    // this keyword generates the info for checking calendar content
    Calendar_event_content_name = await data_modification["Formats Calendar Event Content"](
      V.ADMIN_BEHALF_FIRSTNAME_FI,
      V.ADMIN_BEHALF_LASTNAME_FI,
      V.PREFIX_RESERVATIONS_BY_ADMIN_BEHALF_FI
    );
    V.CALENDAR_EVENT_NAME = Calendar_event_content_name;

    await Browser["Type Text"]('[name="reserveeFirstName"]', V.ADMIN_BEHALF_FIRSTNAME_FI);
    await BuiltIn["Sleep"]("500ms");
    await Browser["Type Text"]('[name="reserveeLastName"]', V.ADMIN_BEHALF_LASTNAME_FI);
    await BuiltIn["Sleep"]("500ms");
    await Browser["Type Text"]('[name="reserveeEmail"]', V.BASIC_ADMIN_MALE_EMAIL);
    await BuiltIn["Sleep"]("500ms");
    await Browser["Type Text"]('[name="reserveePhone"]', V.ADMIN_BEHALF_PHONE_FI);
    await BuiltIn["Sleep"]("500ms");
  },

  /**
   * This keyword changes the time with date and hours and minutes.
   * This test uses 00 for minutes. So all the changed times will be 10:00–11:00 -> 15:00–17:00 etc.
   */
  "Admin Enters Reservation Time And Type Of Reservation": async (
    type_of_reservation: RobotValue,
    startTime_hours: RobotValue,
    endTime_hours: RobotValue,
    date: RobotValue
  ) => {
    // Click  ${type_of_reservation}
    // Type Text  id=ReservationDialog.startTime-hours  ${startTime-hours}
    await Browser["Type Text"]("id=TimeInput.startTime-hours", startTime_hours);
    await BuiltIn["Sleep"]("500ms");
    // Type Text  id=ReservationDialog.startTime-minutes  00
    await Browser["Type Text"]("id=TimeInput.startTime-minutes", "00");
    await BuiltIn["Sleep"]("500ms");
    // Type Text  id=ReservationDialog.endTime-hours  ${endTime-hours}
    await Browser["Type Text"]("id=TimeInput.endTime-hours", endTime_hours);
    await BuiltIn["Sleep"]("500ms");
    // Type Text  id=ReservationDialog.endTime-minutes  00
    await Browser["Type Text"]("id=TimeInput.endTime-minutes", "00");
    await BuiltIn["Sleep"]("500ms");
    await Browser["Type Text"]("id=controlled-date-input__date", date);
    await BuiltIn["Sleep"]("500ms");

    await Browser["Click"](type_of_reservation);
    await BuiltIn["Sleep"]("1s");
  },

  "Admin Clicks Confirm Access Code Button": async () => {
    await Browser["Click"]('[data-testid="AccessCodeChangeRepairButton__ConfirmationDialog--accept"]');
    // Wait for the modal to open
    await BuiltIn["Sleep"]("500ms");
  },

  "Admin Closes Dialog Modal": async () => {
    await Browser["Click"]('id=info-dialog >> [data-testid="CreateReservationModal__cancel-reservation"]');
    // waiting for the dialog to close
    await BuiltIn["Sleep"]("1s");
  },

  /** Fails if the reservation modal stays open after submit/cancel. */
  "Admin Verifies Reservation Modal Is Closed": async () => {
    await Browser["Wait For Elements State"](
      "id=info-dialog",
      "hidden",
      named({ timeout: "5s", message: "Reservation modal did not close correctly: id=info-dialog is still visible" })
    );

    //
    // Reservation calendar
    //
  },

  /**
   * This keyword opens the reservation calendar and changes the reservation time.
   * It uses the keyword 'Admin enters reservation time and type of reservation' to set the new time.
   */
  "Admin Opens Calendar And Changes Reservation Time": async () => {
    let date_plus_x_days: RobotValue, start_hour: RobotValue, end_hour: RobotValue;
    await Browser["Click"]("id=reservation__calendar-heading");
    await BuiltIn["Sleep"]("1s");
    await custom_keywords["Find And Click Element With Text"](
      "id=reservation__calendar-content >> button",
      V.CALENDAR_CHANGE_TIME_FI
    );

    await BuiltIn["Sleep"]("1s");
    // Call the keyword and capture the returned values
    [date_plus_x_days, start_hour, end_hour] = await data_modification["Get Modified Date And Time"]();

    V.MODIFIED_DATE_SUBVENTED_RESERVATION = date_plus_x_days;
    V.MODIFIED_HOUR_STARTTIME_SUBVENTED_RESERVATION = start_hour;
    V.MODIFIED_HOUR_ENDTIME_SUBVENTED_RESERVATION = end_hour;

    // This for the keyword Set and format the reservation finnish time
    V.MODIFIED_STARTTIME_SUBVENTED_RESERVATION = `${str(start_hour)}.00`;

    // Changes the reservation time with date and hours and minutes
    await BuiltIn["Log"](
      "This test uses 00 for minutes. So all the changed times will be 10:00–11:00 -> 15:00–17:00 etc"
    );

    await Browser["Type Text"]("id=TimeInput.startTime-hours", V.MODIFIED_HOUR_STARTTIME_SUBVENTED_RESERVATION);
    await BuiltIn["Sleep"]("500ms");
    await Browser["Type Text"]("id=TimeInput.startTime-minutes", "00");
    await BuiltIn["Sleep"]("500ms");
    await Browser["Type Text"]("id=TimeInput.endTime-hours", V.MODIFIED_HOUR_ENDTIME_SUBVENTED_RESERVATION);
    await BuiltIn["Sleep"]("500ms");
    await Browser["Type Text"]("id=TimeInput.endTime-minutes", "00");
    await BuiltIn["Sleep"]("500ms");
    await Browser["Type Text"]("id=controlled-date-input__date", V.MODIFIED_DATE_SUBVENTED_RESERVATION);
    await BuiltIn["Sleep"]("1s");
    //
    await Browser["Wait For Elements State"](
      'button[type="submit"]',
      "enabled",
      named({ message: " Check that the modified time is available?" })
    );
    //
    await Browser["Focus"]('button[type="submit"]');
    await Browser["Click"]('button[type="submit"]');
    await BuiltIn["Sleep"]("4s");

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
  },
});
