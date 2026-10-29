/** Port of PO/App/app_user.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { OperatingSystem } from "../../../lib/OperatingSystem";
import { PabotLib } from "../../../lib/PabotLib";
import { V, chain, isTruthy, keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { checkout } from "../../PO/Common/checkout";
import { topnav } from "../../PO/Common/topnav";
import { mybookings } from "../../PO/User/mybookings";
import { quick_reservation } from "../../PO/User/quick_reservation";
import { recurring_applications } from "../../PO/User/recurring_applications";
import { recurring_applications_page2 } from "../../PO/User/recurring_applications_page2";
import { recurring_applications_page3 } from "../../PO/User/recurring_applications_page3";
import { recurring_applications_page_preview } from "../../PO/User/recurring_applications_page_preview";
import { recurring_applications_page_sent } from "../../PO/User/recurring_applications_page_sent";
import { reservation_calendar } from "../../PO/User/reservation_calendar";
import { reservation_lownav } from "../../PO/User/reservation_lownav";
import { reservation_unit_booking_details } from "../../PO/User/reservation_unit_booking_details";
import { reservation_unit_reservation_receipt } from "../../PO/User/reservation_unit_reservation_receipt";
import { reservation_unit_reserver_info } from "../../PO/User/reservation_unit_reserver_info";
import { reservation_unit_reserver_types } from "../../PO/User/reservation_unit_reserver_types";
import { singlebooking } from "../../PO/User/singlebooking";
import { user_landingpage } from "../../PO/User/user_landingpage";
import { custom_keywords } from "../../Resources/custom_keywords";
import { data_modification } from "../../Resources/data_modification";
import "../../Resources/parallel_test_data";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const app_user = keywords("app_user", {
  // Front page
  "User Navigates To Single Booking Page": async () => {
    await topnav["Navigate To Single Booking Page"]();
  },

  "User Navigates To My Bookings": async () => {
    await topnav["Navigate To My Bookings"]();
  },

  "User Navigates To Recurring Booking Page": async () => {
    await topnav["Navigate To Recurring Booking Page"]();
  },

  // Payment notification banner
  "User Accepts Payment To Checkout": async () => {
    await BuiltIn["Log"]("This clicks approve button from notification banner");
    await user_landingpage["Approve Interrupted Payment"]();
  },

  // Checkout
  "User Checks Info In Paid Checkout And Confirms Booking": async () => {
    await BuiltIn["Log"]("This step gets the reservation number");
    await checkout["Check The Info In Checkout"]();
  },

  "User Interrupts Paid Checkout": async (input_URL: string) => {
    await checkout["Interrupted Checkout"](input_URL);
    await user_landingpage["Check The User Landing Page H1"](V.USER_LANDING_PAGE_H1_TEXT);
  },

  // Singlebooking
  "User Uses Search To Find Right Unit": async (nameoftheunit: string) => {
    // This checks if the search element is visible; if it isn’t, it clicks the "advanced search" toggle button to make it visible.
    await singlebooking["Click Advanced Search If Search Not Visible"]();
    await singlebooking["Search Units By Name"](nameoftheunit);

    // A click is lost if the result list is re-rendered at that moment, so click again until the unit page opens
    await BuiltIn["Wait Until Keyword Succeeds"]("3x", "1s", app_user["Open Unit From Search Results"], nameoftheunit);
  },

  "Open Unit From Search Results": async (nameoftheunit: RobotValue) => {
    let url: RobotValue, unit_page_open: RobotValue;
    url = await Browser["Get Url"]();
    unit_page_open = await BuiltIn["Run Keyword And Return Status"](
      BuiltIn["Should Contain"],
      url,
      "/reservation-unit/"
    );
    if (isTruthy(unit_page_open)) {
      return;
    }

    await custom_keywords["Find And Click Element With Text"](
      '[data-testid="list-with-pagination__list--container"] >> [data-testid="card__heading"]',
      nameoftheunit
    );
    await custom_keywords["Wait For Url To Contain"]("/reservation-unit/", /* timeout= */ "8s");
  },

  /**
   * here is keyword --> data_modification.Set info card duration time info
   * that sets $TIME_OF_QUICK_RESERVATION and $TIME_OF_QUICK_RESERVATION_MINUS_T
   */
  "User Selects The Time With Quick Reservation And Sets Time Variables": async () => {
    let quick_reservation_current_date_value: RobotValue,
      formatted_date: RobotValue,
      formatted_date_minus_t: RobotValue;
    await Browser["Wait For Elements State"]("id=quick-reservation", "visible");
    await quick_reservation["Select Duration"](V.QUICK_RESERVATION_DURATION);

    // Checks that calendar opens and has all the buttons inside
    await quick_reservation["Confirms Date Picker Opens From Quick Reservation"]();

    quick_reservation_current_date_value = await quick_reservation["Get The Value From Date Input"]();

    // This sets ${TIME_OF_QUICK_RESERVATION_FREE_SLOT}
    await quick_reservation["Select The Free Slot From Quick Reservation"]();

    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION_FREE_SLOT);

    [formatted_date, formatted_date_minus_t] = await data_modification["Set Info Card Duration Time Info"](
      V.TIME_OF_QUICK_RESERVATION_FREE_SLOT,
      quick_reservation_current_date_value
    );

    V.TIME_OF_QUICK_RESERVATION = formatted_date;
    V.TIME_OF_QUICK_RESERVATION_MINUS_T = formatted_date_minus_t;

    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION);
    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION_MINUS_T);
  },

  /**
   * Selects a free slot in quick reservation and submits it.
   * A unit lock keeps parallel tests from picking overlapping slots.
   */
  "User Reserves A Free Quick Reservation Slot": async () => {
    let lock_name: RobotValue;
    lock_name = await quick_reservation["Get Unit Lock Name"]();
    await PabotLib["Acquire Lock"](lock_name);
    try {
      await BuiltIn["Wait Until Keyword Succeeds"](
        "3x",
        "2s",
        app_user["User Selects And Submits Quick Reservation On Fresh Page"]
      );
    } finally {
      await PabotLib["Release Lock"](lock_name);
    }
  },

  "User Selects And Submits Quick Reservation On Fresh Page": async () => {
    await quick_reservation["Reload Reservation Unit Page And Wait For Reservations"]();
    await app_user["User Selects The Time With Quick Reservation And Sets Time Variables"]();
    await quick_reservation["User Clicks Submit Button In Quick Reservation"]();
  },

  "User Checks That Quick Reservation Does Not Have Reserved Time": async (reservationtime: RobotValue) => {
    await BuiltIn["Log"](reservationtime);
    await quick_reservation["Verify Time Slot Not Available"](reservationtime);
  },

  /**
   * This keyword uses data_modification.Convert finnish short day to english and
   * data_modification.Compute reservation timeslot to set variables
   */
  "User Checks That Reservation Calendar Does Not Have Reserved Time Slot Available": async () => {
    await BuiltIn["Log"](`This keyword sets the variable '${str(V.ENGLISH_DAY)}'`);
    await data_modification["Convert Finnish Short Day To English"](V.TIME_OF_QUICK_RESERVATION);

    await BuiltIn["Log"](`This keyword sets the variable '${str(V.CALENDAR_TIMESLOT)}'`);
    await data_modification["Compute Reservation Time Slot"](
      V.TIME_OF_QUICK_RESERVATION_FREE_SLOT,
      V.QUICK_RESERVATION_DURATION
    );

    await custom_keywords["Verify Reservation Slot Exists"](V.CALENDAR_TIMESLOT, V.ENGLISH_DAY);
  },

  "User Fills The Reservation Info For Always Free Unit And Submits": async () => {
    // Checks that "jatka" button has been loaded
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__button--continue"]',
      "visible",
      named({
        timeout: "10s",
        message:
          "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered.",
      })
    );
    await reservation_unit_reserver_info["Check Application Cannot Be Made Without Info"]();
    await reservation_unit_reserver_info["Enter First Name"](V.CURRENT_USER_FIRST_NAME);
    await reservation_unit_reserver_info["Enter Last Name"](V.CURRENT_USER_LAST_NAME);
    await reservation_unit_reserver_info["Enter Email"](V.CURRENT_USER_EMAIL);
    await reservation_unit_reserver_info["Enter Phone Number"](V.CURRENT_USER_PHONE);
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_lownav["Click Submit Button Continue"]();
  },

  "User Fills The Reservation Info For Unit With Payment And Submits": async () => {
    // Checks that "jatka" button has been loaded
    // Verify we are on the correct booking details page where user info can be given
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__button--continue"]',
      "visible",
      named({
        timeout: "10s",
        message:
          "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered.",
      })
    );
    await reservation_unit_booking_details["Type The Name Of The Booking"](V.SINGLEBOOKING_NAME);
    await reservation_unit_booking_details["Select The Purpose Of The Booking"](V.PURPOSE_OF_THE_BOOKING);
    await reservation_unit_booking_details["Select The Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await reservation_unit_booking_details["Type The Description Of The Booking"](V.SINGLEBOOKING_DESCRIPTION);
    await reservation_unit_reserver_types["Select Reserver Type"](V.RESERVATION_INDIVIDUAL);
    await reservation_unit_reserver_info["Enter First Name"](V.CURRENT_USER_FIRST_NAME);
    await reservation_unit_reserver_info["Enter Last Name"](V.CURRENT_USER_LAST_NAME);
    await reservation_unit_reserver_info["Enter Email"](V.CURRENT_USER_EMAIL);
    await reservation_unit_reserver_info["Enter Phone Number"](V.CURRENT_USER_PHONE);
    await reservation_unit_reserver_info["Select Home City"](V.HOME_CITY);
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_lownav["Click Submit Button Continue"]();
  },

  "User Fills Subvented Booking Details As Individual And Submits": async (justification_for_not_paying: string) => {
    // Checks that "jatka" button has been loaded
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__button--continue"]',
      "visible",
      named({
        timeout: "10s",
        message:
          "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered.",
      })
    );
    await reservation_unit_booking_details["Type The Name Of The Booking"](V.SINGLEBOOKING_NAME);
    await reservation_unit_booking_details["Select The Purpose Of The Booking"](V.PURPOSE_OF_THE_BOOKING);
    await reservation_unit_booking_details["Select The Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await reservation_unit_booking_details["Click And Select AgeGroup Button"](V.AGEGROUP_OF_PERSONS);
    await reservation_unit_booking_details["Type The Description Of The Booking"](V.SINGLEBOOKING_DESCRIPTION);
    await reservation_unit_booking_details["Click To Apply For A Free Booking"]();
    await reservation_unit_booking_details["Type Justification For Free Of Charge"](justification_for_not_paying);
    await reservation_unit_reserver_types["Select Reserver Type"](V.RESERVATION_INDIVIDUAL);
    await reservation_unit_reserver_info["Enter First Name"](V.CURRENT_USER_FIRST_NAME);
    await reservation_unit_reserver_info["Enter Last Name"](V.CURRENT_USER_LAST_NAME);
    await reservation_unit_reserver_info["Enter Email"](V.CURRENT_USER_EMAIL);
    await reservation_unit_reserver_info["Enter Phone Number"](V.CURRENT_USER_PHONE);
    await reservation_unit_reserver_info["Select Home City"](V.HOME_CITY);
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_lownav["Click Submit Button Continue"]();
  },

  "User Fills Noncancelable Booking Details As Individual And Submits": async () => {
    // Checks that "jatka" button has been loaded
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__button--continue"]',
      "visible",
      named({
        timeout: "10s",
        message:
          "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered.",
      })
    );
    await reservation_unit_booking_details["Select The Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await reservation_unit_booking_details["Type The Description Of The Booking"](V.SINGLEBOOKING_DESCRIPTION);
    await reservation_unit_reserver_types["Select Reserver Type"](V.RESERVATION_INDIVIDUAL);
    await reservation_unit_reserver_info["Enter First Name"](V.CURRENT_USER_FIRST_NAME);
    await reservation_unit_reserver_info["Enter Last Name"](V.CURRENT_USER_LAST_NAME);
    await reservation_unit_reserver_info["Enter Email"](V.CURRENT_USER_EMAIL);
    await reservation_unit_reserver_info["Enter Phone Number"](V.CURRENT_USER_PHONE);
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_lownav["Click Submit Button Continue"]();
  },

  "User Fills Info For Unit That Is Always Handled As Individual And Submits": async () => {
    // Checks that "jatka" button has been loaded
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__button--continue"]',
      "visible",
      named({
        timeout: "10s",
        message:
          "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered.",
      })
    );
    await reservation_unit_booking_details["Type The Name Of The Booking"](V.SINGLEBOOKING_NAME);
    await reservation_unit_booking_details["Select The Purpose Of The Booking"](V.PURPOSE_OF_THE_BOOKING);
    await reservation_unit_booking_details["Select The Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await reservation_unit_booking_details["Type The Description Of The Booking"](V.SINGLEBOOKING_DESCRIPTION);
    await reservation_unit_reserver_types["Select Reserver Type"](V.RESERVATION_INDIVIDUAL);
    await reservation_unit_reserver_info["Enter First Name"](V.CURRENT_USER_FIRST_NAME);
    await reservation_unit_reserver_info["Enter Last Name"](V.CURRENT_USER_LAST_NAME);
    await reservation_unit_reserver_info["Enter Email"](V.CURRENT_USER_EMAIL);
    await reservation_unit_reserver_info["Enter Phone Number"](V.CURRENT_USER_PHONE);
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_lownav["Click Submit Button Continue"]();
  },

  "User Fills Booking Details As Individual For Reservation With Access Code And Submits": async () => {
    // Checks that "jatka" button has been loaded
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__button--continue"]',
      "visible",
      named({
        timeout: "10s",
        message:
          "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered.",
      })
    );
    await reservation_unit_booking_details["Type The Name Of The Booking"](V.SINGLEBOOKING_NAME);
    await reservation_unit_booking_details["Select The Purpose Of The Booking"](V.PURPOSE_OF_THE_BOOKING);
    await reservation_unit_booking_details["Select The Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await reservation_unit_booking_details["Click And Select AgeGroup Button"](V.AGEGROUP_OF_PERSONS);
    await reservation_unit_booking_details["Type The Description Of The Booking"](V.SINGLEBOOKING_DESCRIPTION);
    await reservation_unit_reserver_types["Select Reserver Type"](V.RESERVATION_INDIVIDUAL);
    await reservation_unit_reserver_info["Enter First Name"](V.CURRENT_USER_FIRST_NAME);
    await reservation_unit_reserver_info["Enter Last Name"](V.CURRENT_USER_LAST_NAME);
    await reservation_unit_reserver_info["Enter Email"](V.CURRENT_USER_EMAIL);
    await reservation_unit_reserver_info["Enter Phone Number"](V.CURRENT_USER_PHONE);
    await reservation_unit_reserver_info["Select Home City"](V.HOME_CITY);
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_lownav["Click Submit Button Continue"]();
  },

  "User Checks Unit That Is Always Handled Details Are Right Before Submit": async () => {
    await reservation_unit_reservation_receipt["Check Single Booking Info"]();
    await reservation_unit_reservation_receipt["Check Reservation User Info"]();
    await quick_reservation["Check The Price Of Quick Reservation"](V.SINGLEBOOKING_PAID_PRICE_VAT_INCL);
    await reservation_unit_reservation_receipt["Click The Checkbox Accepted Terms"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Generic Terms"]();
  },

  "User Checks Unit That Is Always Handled Details Are Right After Submit": async () => {
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await quick_reservation["Check The Price Of Quick Reservation"](
      V.SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await quick_reservation["Get Booking Number"]();
    await reservation_unit_reservation_receipt["Check The Reservation Status Message"](
      V.RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
  },

  "User Checks The Free Single Booking Details Are Right": async () => {
    await reservation_unit_reservation_receipt["Check Free Single Booking Info"]();
    await reservation_unit_reservation_receipt["Check Reservation User Info"]();
    await quick_reservation["Check The Price Of Quick Reservation"](
      V.SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await reservation_unit_reservation_receipt["Click The Checkbox Accepted Terms"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Generic Terms"]();
    await reservation_lownav["Click Submit Button Continue"]();
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await quick_reservation["Check The Price Of Quick Reservation"](
      V.SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await quick_reservation["Get Booking Number"]();
    await reservation_unit_reservation_receipt["Check The Reservation Status Message"](
      V.RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
  },

  "User Checks The Paid Reservation Info Is Right And Submits": async () => {
    await reservation_unit_reservation_receipt["Check Reservation User Info"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Accepted Terms"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Generic Terms"]();
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_lownav["Click Submit Button Continue"]();
  },

  "User Checks The Subvented Reservation Info Is Right And Submits": async () => {
    await reservation_unit_reservation_receipt["Check Reservation User Info"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Accepted Terms"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Generic Terms"]();
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await quick_reservation["Check The Price Of Quick Reservation"](
      V.SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await reservation_lownav["Click Submit Button Continue"]();
  },

  "User Checks The Subvented Reservation Info Is Right After Submitting": async () => {
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await quick_reservation["Check The Price Of Quick Reservation"](
      V.SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await quick_reservation["Get Booking Number"]();
  },

  "User Checks The Paid Reservation That Requires Handling Info Is Right And Submits": async () => {
    await reservation_unit_reservation_receipt["Check Reservation User Info"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Accepted Terms"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Generic Terms"]();
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_lownav["Click Submit Button Continue"]();
    await reservation_unit_reservation_receipt["Check The Reservation Status Message"](
      V.RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
    await quick_reservation["Get Booking Number"]();
  },

  "User Checks The Paid Reservation Info Is Right After Checkout": async () => {
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_unit_reservation_receipt["Check The Reservation Status Message"](V.RESERVATION_STATUS_MSG_FI);
    await quick_reservation["Check The Price Of Quick Reservation"](V.SINGLEBOOKING_PAID_PRICE_VAT_INCL);
    await quick_reservation["Check Booking Number"](V.BOOKING_NUM_ONLY);
  },

  "User Checks The Reservation Info Is Right Before Submit": async () => {
    await reservation_unit_reservation_receipt["Check Reservation User Info"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Accepted Terms"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Generic Terms"]();
  },

  "User Checks The Reservation Info Is Right After Submit": async () => {
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_unit_reservation_receipt["Check The Reservation Status Message"](V.RESERVATION_STATUS_MSG_FI);
    await quick_reservation["Get Booking Number"]();
  },

  "User Checks The Reservation Info Is Right Before Submit With Access Code": async () => {
    await reservation_unit_reservation_receipt["Check Reservation User Info"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Accepted Terms"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Generic Terms"]();
  },

  "User Checks The Reservation Info Is Right After Submit With Access Code": async () => {
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_unit_reservation_receipt["Check The Reservation Status Message"](V.RESERVATION_STATUS_MSG_FI);
    await quick_reservation["Get Booking Number"]();
    await quick_reservation["Get Access Code"]();
  },

  "User Checks The Noncancelable Reservation Info Is Right Before Submit": async () => {
    await reservation_unit_reservation_receipt["Check Reservation User Info"]();
    await reservation_unit_reservation_receipt["Check Noncancelable Booking Info"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Accepted Terms"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Generic Terms"]();
  },

  "User Checks The Noncancelable Reservation Info Is Right After Submit": async () => {
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await reservation_unit_reservation_receipt["Check The Reservation Status Message"](V.RESERVATION_STATUS_MSG_FI);
    await quick_reservation["Get Booking Number"]();
  },

  "User Checks The Modified Reservation Info Is Right And Clicks Continue": async () => {
    await reservation_unit_reservation_receipt["Click The Checkbox Accepted Terms"]();
    await reservation_unit_reservation_receipt["Click The Checkbox Generic Terms"]();
    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION_MODIFIED);
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION_MODIFIED);
    // TODO: Separate the submit and the next page check into their own keywords
    await reservation_lownav["Click Submit Button Continue"]();
    // The edit page has the same time card, wait for the reservation page itself
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__content"]',
      "visible",
      named({ timeout: "15s" })
    );

    await BuiltIn["Log"]("This check is done in reservations page");
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION_MODIFIED);
  },

  "User Cancel Booking In Reservations And Checks It Got Cancelled": async () => {
    await mybookings["User Cancel Booking"]();
    await mybookings["Click Reason For Cancellation"]();
    await mybookings["Select Reason For Cancellation"](V.REASON_FOR_CANCELLATION);
    await mybookings["Click Cancel Button"]();
    await mybookings["Check Reservation Status"](V.IN_RESERVATIONS_STATUS_CANCELED);
    await quick_reservation["Check Booking Number"](V.BOOKING_NUM_ONLY);
  },

  "User Modifies Booking And Verifies The Changes": async () => {
    let date_value_from_calendar: RobotValue, formatted_date: RobotValue, formatted_date_minus_t: RobotValue;
    await mybookings["User Click Change Time"]();
    // This opens calendar controls
    await reservation_calendar["User Click Reservation Calendar Toggle Button"]();

    await reservation_calendar["Select Duration Calendar"](V.QUICK_RESERVATION_DURATION);

    // This sets ${CALENDAR_CONTROL_TIME_OF_FREE_SLOT}
    await reservation_calendar["Click And Store Free Reservation Time"]();

    date_value_from_calendar = await reservation_calendar["Get Current Date From Datepicker"]();

    // Formats modified date from variables like 15.30 and 15.6.2024. formatting uses 1h duration
    [formatted_date, formatted_date_minus_t] = await data_modification["Set Info Card Duration Time Info"](
      V.CALENDAR_CONTROL_TIME_OF_FREE_SLOT,
      date_value_from_calendar
    );

    V.TIME_OF_QUICK_RESERVATION_MODIFIED = formatted_date;
    V.TIME_OF_QUICK_RESERVATION_MINUS_T_MODIFIED = formatted_date_minus_t;

    // Log  ${returned_formatted_values}
    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION_MODIFIED);
    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION_MINUS_T_MODIFIED);

    await BuiltIn["Log"](
      "If the continue button is not enabled, verify that the reservation time was actually modified"
    );
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__button--continue"]',
      "enabled",
      named({ timeout: "10s" })
    );
    await reservation_calendar["Click Continue Button"]();
  },

  "User Checks Cancelled Booking Is Found": async (
    unitname_mybookings: string,
    time_of_quick_reservation_minusT: RobotValue
  ) => {
    await BuiltIn["Log"]("This checks the canceled booking is not found in upcoming reservations");

    await mybookings["Check Unitname And Reservation Are Not Found"](
      unitname_mybookings,
      time_of_quick_reservation_minusT
    );

    await mybookings["Navigate To Cancelled Bookings"]();

    await mybookings["Check Unitname And Reservation Time And Click Show"](
      unitname_mybookings,
      time_of_quick_reservation_minusT
    );
  },

  "User Can See Upcoming Booking In List And Clicks It": async (unitname: string, reservationtime: RobotValue) => {
    await BuiltIn["Log"](unitname);
    await BuiltIn["Log"](reservationtime);
    // The list is fetched once when the page opens, so reload it if the booking is not in it
    await custom_keywords["Retry With Recovery"](
      mybookings["Check Unitname And Reservation Time And Click Show"],
      Browser["Reload"],
      unitname,
      reservationtime
    );
  },

  "User Can See Upcoming Noncancelable Booking In List And Clicks It": async (
    unitname: string,
    reservationtime: RobotValue
  ) => {
    await BuiltIn["Log"](unitname);
    await BuiltIn["Log"](reservationtime);
    await mybookings["Check My Bookings H1"](V.MYBOOKINGS_FI);
    await custom_keywords["Retry With Recovery"](
      mybookings["Check Unitname And Reservation Time And Verify No Cancel Button"],
      Browser["Reload"],
      unitname,
      reservationtime
    );
    await mybookings["Check Unitname And Reservation Time And Click Show"](unitname, reservationtime);
  },

  "User Navigates To Unit From Bookings List": async () => {
    await topnav["Navigate To My Bookings"]();
  },

  // Reservations
  "User Checks The Paid Reservation Info Is Right In Reservations": async (
    booking_status: string,
    payment_status: string,
    booking_price: string,
    time_in_quickreservations: RobotValue,
    reservation_number: RobotValue
  ) => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__content"]', "visible");
    await quick_reservation["Check The Quick Reservation Time"](time_in_quickreservations);
    await quick_reservation["Check The Price Of Quick Reservation"](booking_price);
    await mybookings["Check Reservation Status"](booking_status);
    await mybookings["Check Reservations Payment Status"](payment_status);
    await mybookings["Check Reservation Booker Email"](V.CURRENT_USER_EMAIL);
    await mybookings["Check Reservation Booker First Name"](V.CURRENT_USER_FIRST_NAME);
    await mybookings["Check Reservation Booker Last Name"](V.CURRENT_USER_LAST_NAME);
    await mybookings["Check Reservation Booker Phone"](V.CURRENT_USER_PHONE);
    await mybookings["Check Reservation Description"](V.SINGLEBOOKING_DESCRIPTION);
    await mybookings["Check Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await mybookings["Check Reservation Purpose"](V.PURPOSE_OF_THE_BOOKING);
    await mybookings["Check Reservation Number From H1 Text"](reservation_number);
  },

  "User Checks Booking Info In Reservations With Number Of Participants And Description And Purpose": async (
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: RobotValue
  ) => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__content"]', "visible");
    await quick_reservation["Check The Quick Reservation Time"](time_in_quickreservations);
    await quick_reservation["Check Booking Number"](V.BOOKING_NUM_ONLY);
    await quick_reservation["Check The Price Of Quick Reservation"](booking_price);

    await mybookings["Check Reservation Number From H1 Text"](V.BOOKING_NUM_ONLY);
    await mybookings["Check Reservation Status"](booking_status);
    await mybookings["Check Reservation Booker Email"](V.CURRENT_USER_EMAIL);
    await mybookings["Check Reservation Booker First Name"](V.CURRENT_USER_FIRST_NAME);
    await mybookings["Check Reservation Booker Last Name"](V.CURRENT_USER_LAST_NAME);
    await mybookings["Check Reservation Booker Phone"](V.CURRENT_USER_PHONE);
    await mybookings["Check Reservation Description"](V.SINGLEBOOKING_DESCRIPTION);
    await mybookings["Check Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await mybookings["Check Reservation Purpose"](V.PURPOSE_OF_THE_BOOKING);
  },

  "User Checks Booking Info In Reservations": async (
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: RobotValue
  ) => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__reservation-info-card__content"]', "visible");
    await quick_reservation["Check The Quick Reservation Time"](time_in_quickreservations);
    await quick_reservation["Check Booking Number"](V.BOOKING_NUM_ONLY);
    await quick_reservation["Check The Price Of Quick Reservation"](booking_price);

    await mybookings["Check Reservation Number From H1 Text"](V.BOOKING_NUM_ONLY);
    await mybookings["Check Reservation Status"](booking_status);
    await mybookings["Check Reservation Booker Email"](V.CURRENT_USER_EMAIL);
    await mybookings["Check Reservation Booker First Name"](V.CURRENT_USER_FIRST_NAME);
    await mybookings["Check Reservation Booker Last Name"](V.CURRENT_USER_LAST_NAME);
    await mybookings["Check Reservation Booker Phone"](V.CURRENT_USER_PHONE);
  },

  "User Checks Booking Info In Reservations With Access Code": async (
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: RobotValue,
    access_code: RobotValue
  ) => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__content"]', "visible");
    await quick_reservation["Check The Quick Reservation Time"](time_in_quickreservations);
    await quick_reservation["Check Booking Number"](V.BOOKING_NUM_ONLY);
    await quick_reservation["Check The Price Of Quick Reservation"](booking_price);

    await mybookings["Check Reservation Number From H1 Text"](V.BOOKING_NUM_ONLY);
    await mybookings["Check Reservation Status"](booking_status);
    await mybookings["Check Reservation Booker Email"](V.CURRENT_USER_EMAIL);
    await mybookings["Check Reservation Booker First Name"](V.CURRENT_USER_FIRST_NAME);
    await mybookings["Check Reservation Booker Last Name"](V.CURRENT_USER_LAST_NAME);
    await mybookings["Check Reservation Booker Phone"](V.CURRENT_USER_PHONE);
    await mybookings["Check Reservation Access Code"](access_code);
  },

  "User Checks Booking Info In Reservations With All Reservation Info": async (
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: RobotValue
  ) => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__content"]', "visible");
    await quick_reservation["Check The Quick Reservation Time"](time_in_quickreservations);
    await quick_reservation["Check Booking Number"](V.BOOKING_NUM_ONLY);
    await quick_reservation["Check The Price Of Quick Reservation"](booking_price);

    await mybookings["Check Reservation Number From H1 Text"](V.BOOKING_NUM_ONLY);
    await mybookings["Check Reservation Status"](booking_status);
    await mybookings["Check Reservation Number From H1 Text"](V.BOOKING_NUM_ONLY);
    await mybookings["Check Reservation Booker Email"](V.CURRENT_USER_EMAIL);
    await mybookings["Check Reservation Booker First Name"](V.CURRENT_USER_FIRST_NAME);
    await mybookings["Check Reservation Booker Last Name"](V.CURRENT_USER_LAST_NAME);
    await mybookings["Check Reservation Booker Phone"](V.CURRENT_USER_PHONE);
    await mybookings["Check Reservation Description"](V.SINGLEBOOKING_DESCRIPTION);
    await mybookings["Check Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await mybookings["Check Reservation Purpose"](V.PURPOSE_OF_THE_BOOKING);
    await mybookings["Check Reservation Age Group"](V.AGEGROUP_OF_PERSONS);
  },

  "User Checks Booking Info In Reservations For Noncancelable Booking": async () => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__content"]', "visible");

    await mybookings["Check Reservation Number From H1 Text"](V.BOOKING_NUM_ONLY);
    await mybookings["Check Reservation Status"](V.MYBOOKINGS_STATUS_CONFIRMED);
    await mybookings["Check Reservation Booker Email"](V.CURRENT_USER_EMAIL);
    await mybookings["Check Reservation Booker First Name"](V.CURRENT_USER_FIRST_NAME);
    await mybookings["Check Reservation Booker Last Name"](V.CURRENT_USER_LAST_NAME);
    await mybookings["Check Reservation Booker Phone"](V.CURRENT_USER_PHONE);
    await mybookings["Check Reservation Description"](V.SINGLEBOOKING_DESCRIPTION);
    await mybookings["Check Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await mybookings["Check Cancel Button Is Not Found In Reservations"]();
    await quick_reservation["Check The Price Of Quick Reservation"](V.SINGLEBOOKING_NO_PAYMENT);
  },

  "User Verifies Details Of Subvented Reservation After Admin Approval Without Payment": async () => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__content"]', "visible");
    await BuiltIn["Log"](
      "If the booking number comparison fails, verify that there are no duplicate times in the upcoming bookings list."
    );

    await quick_reservation["Check Booking Number"](V.BOOKING_NUM_ONLY);
    await quick_reservation["Check The Quick Reservation Time"](V.ADMIN_MODIFIES_TIME_OF_INFO_CARD);
    await quick_reservation["Check The Price Of Quick Reservation"](V.SINGLEBOOKING_NO_PAYMENT);
    await mybookings["Check Reservation Status"](V.MYBOOKINGS_STATUS_CONFIRMED);
    await mybookings["Check Reservation Number From H1 Text"](V.BOOKING_NUM_ONLY);
    await mybookings["Check Reservation Purpose"](V.PURPOSE_OF_THE_BOOKING);
    await mybookings["Check Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await mybookings["Check Reservation Age Group"](V.AGEGROUP_OF_PERSONS);
    await mybookings["Check Reservation Description"](V.SINGLEBOOKING_DESCRIPTION);
    await mybookings["Check Reservation Booker First Name"](V.CURRENT_USER_FIRST_NAME);
    await mybookings["Check Reservation Booker Last Name"](V.CURRENT_USER_LAST_NAME);
    await mybookings["Check Reservation Booker Phone"](V.CURRENT_USER_PHONE);
    await mybookings["Check Reservation Booker Email"](V.CURRENT_USER_EMAIL);
  },

  "User Checks The Rejected Reservation Info Is Right After Admin Handling": async () => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__content"]', "visible");
    await BuiltIn["Log"](
      "If the booking number comparison fails, verify that there are no duplicate times in the upcoming bookings list."
    );

    await quick_reservation["Check Booking Number"](V.BOOKING_NUM_ONLY);
    await quick_reservation["Check The Quick Reservation Time"](V.TIME_OF_QUICK_RESERVATION);
    await quick_reservation["Check The Price Of Quick Reservation"](V.ALWAYS_REQUESTED_UNIT_PAID_PRICE_VAT_INCL);
    await mybookings["Check Reservation Status"](V.MYBOOKINGS_STATUS_REJECTED);
    await mybookings["Check Reservation Number From H1 Text"](V.BOOKING_NUM_ONLY);
    await mybookings["Check Reservation Purpose"](V.PURPOSE_OF_THE_BOOKING);
    await mybookings["Check Number Of Participants"](V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await mybookings["Check Reservation Description"](V.SINGLEBOOKING_DESCRIPTION);
    await mybookings["Check Reservation Booker First Name"](V.CURRENT_USER_FIRST_NAME);
    await mybookings["Check Reservation Booker Last Name"](V.CURRENT_USER_LAST_NAME);
    await mybookings["Check Reservation Booker Phone"](V.CURRENT_USER_PHONE);
    await mybookings["Check Reservation Booker Email"](V.CURRENT_USER_EMAIL);
  },

  // Calendar usage
  /**
   * This formats example like Ti 1.10.2024 klo 10:30–11:30
   * to DTSTART;TZID=Europe/Helsinki:20241001T103000, DTEND;TZID=Europe/Helsinki:20241001T113000
   */
  "User Saves File And Formats Booking Time To ICS": async (file_path: string) => {
    let download_promise: RobotValue, file_obj: RobotValue, content: RobotValue, ICS_TEXT: RobotValue;
    // Ensure the directory exists
    await OperatingSystem["Create Directory"](file_path);
    await OperatingSystem["Directory Should Exist"](file_path);

    await custom_keywords["Convert Booking Time To ICS Format"](V.TIME_OF_QUICK_RESERVATION_MINUS_T);

    // Create a promise that waits for the download to complete, using the specified file path
    download_promise = await Browser["Promise To Wait For Download"](named({ wait_for_finished: "True" }));

    // Saves the calendar file
    await Browser["Click"]('[data-testid="reservation__button--calendar-link"]');

    // Wait for the file to be fully downloaded and retrieve file information
    file_obj = await Browser["Wait For"](download_promise);

    // Confirm that the file exists and is not empty
    await OperatingSystem["File Should Exist"](file_obj["saveAs"]);

    // Retrieves text content from the downloaded file and sets it as a suite variable
    content = await OperatingSystem["Get File"](file_obj["saveAs"]);
    ICS_TEXT = content;
    V.ICS_TEXT_FROM_FILE = ICS_TEXT;

    // Extracts the DTSTART and DTEND timestamps from an ICS file's text
    // example --> DTSTART;TZID=Europe/Helsinki:20241003T083000 and DTEND;TZID=Europe/Helsinki:20241003T093000
    await custom_keywords["Extract Start And End Time From ICS File"](V.ICS_TEXT_FROM_FILE);
    await BuiltIn["Log"](ICS_TEXT);
  },

  "User Checks That Calendar File Matches Booking Time": async () => {
    let start_times_equal: RobotValue, end_times_equal: RobotValue;
    // Log for verification
    await BuiltIn["Log"]("Checking if ICS times match with booking times...");
    await BuiltIn["Log"](`ICS Start Time: ${str(V.FORMATTED_START_TO_ICS)}`);
    await BuiltIn["Log"](`ICS End Time: ${str(V.FORMATTED_END_TO_ICS)}`);
    await BuiltIn["Log"](`Extracted Start Time: ${str(V.START_TIME_FROM_ICS)}`);
    await BuiltIn["Log"](`Extracted End Time: ${str(V.END_TIME_FROM_ICS)}`);

    // Comparisons
    // Assert Start Times
    start_times_equal = await BuiltIn["Run Keyword And Return Status"](
      BuiltIn["Should Be Equal"],
      V.START_TIME_FROM_ICS,
      V.FORMATTED_START_TO_ICS
    );
    if (!isTruthy(start_times_equal)) {
      await BuiltIn["Fail"](
        `The start times do not match: Expected ${str(V.START_TIME_FROM_ICS)}, but got ${str(V.FORMATTED_START_TO_ICS)}.`,
        "Additional info: Check custom_keywords.Convert booking time to ICS format if variables don't match"
      );
    }

    // Assert End Times
    end_times_equal = await BuiltIn["Run Keyword And Return Status"](
      BuiltIn["Should Be Equal"],
      V.END_TIME_FROM_ICS,
      V.FORMATTED_END_TO_ICS
    );
    if (!isTruthy(end_times_equal)) {
      await BuiltIn["Fail"](
        `The end times do not match: Expected ${str(V.END_TIME_FROM_ICS)}, but got ${str(V.FORMATTED_END_TO_ICS)}.`,
        "Additional info: Check custom_keywords.Convert booking time to ICS format if variables don't match"
      );
    }
  },

  // Recurring
  "User Fills In The Application Details For Recurring Application": async () => {
    await recurring_applications["User Selects The Default Time Period For The Recurring Reservation"]();
    await recurring_applications["User Fills The Recurring Reservation Name"](V.RECURRING_BOOKING_NAME);
    await recurring_applications["User Fills The Number Of People In The Recurring Reservation"](
      V.RECURRING_BOOKING_SIZE_OF_GROUP
    );
    await recurring_applications["User Fills The Age Group In The Recurring Reservation"](
      V.RECURRING_BOOKING_AGE_GROUP_TEXT
    );
    await recurring_applications["User Chooses The Purpose Of The Recurring Reservation"](
      V.RECURRING_BOOKING_PURPOSE_TEXT
    );
    await recurring_applications["User Selects The Minimum Length For The Recurring Reservation"](
      V.RECURRING_BOOKING_MIN_LENGTH_TEXT
    );
    await recurring_applications["User Selects The Maximum Length For The Recurring Reservation"](
      V.RECURRING_BOOKING_MAX_LENGTH_TEXT
    );
    await recurring_applications["User Selects The Amount Of Reservations Per Week"](
      V.RECURRING_BOOKING_RESERVATION_PER_WEEK
    );
    await recurring_applications["User Clicks Continue Button"]();
  },

  "User Selects Times For Recurring Application": async () => {
    await recurring_applications_page2["User Selects Type Of The Booking Request"](
      V.RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_PRIMARY
    );
    await recurring_applications_page2["User Clicks Available Seasonal Booking Times For"](
      V.RECURRING_BOOKING_UNIT_NAME_KESKUSTA
    );
    await recurring_applications_page2["User Selects The Times For Recurring Application"](V.RECURRING_THU_22_23_OTHER);
    await recurring_applications_page2["User Selects The Times For Recurring Application"](V.RECURRING_THU_23_24_OTHER);
    await recurring_applications_page2["User Clicks Available Seasonal Booking Times For"](
      V.RECURRING_BOOKING_UNIT_NAME_MALMI
    );
    await recurring_applications_page2["User Selects Type Of The Booking Request"](
      V.RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_SECONDARY
    );
    await recurring_applications_page2["User Selects The Times For Recurring Application"](
      V.RECURRING_THU_09_10_PREFERRED
    );
    await recurring_applications_page2["User Selects The Times For Recurring Application"](
      V.RECURRING_THU_10_11_PREFERRED
    );
    await recurring_applications_page2["User Clicks Continue Button"]();
  },

  "User Fills In The Application User Info Details": async () => {
    await recurring_applications_page3["User Selects Who Is The Application Created For"]("INDIVIDUAL");
    await recurring_applications_page3["User Types First Name"](V.RECURRING_BOOKING_FIRST_NAME);
    await recurring_applications_page3["User Types Last Name"](V.RECURRING_BOOKING_LAST_NAME);
    await recurring_applications_page3["User Types Street Address"](V.RECURRING_BOOKING_STREET_ADDRESS);
    await recurring_applications_page3["User Types Post Code"](V.RECURRING_BOOKING_POST_CODE);
    await recurring_applications_page3["User Types City"](V.RECURRING_BOOKING_CITY);
    await recurring_applications_page3["User Types Phone Number"](V.RECURRING_BOOKING_PHONE_NUMBER);
    await recurring_applications_page3["User Types Email"](V.RECURRING_BOOKING_EMAIL);
    await recurring_applications_page3["User Types Additional Information"](V.RECURRING_BOOKING_ADDITIONAL_INFO);
    await recurring_applications_page2["User Clicks Continue Button"]();
  },

  "User Accepts Terms Of Use And Clicks Submit": async () => {
    await recurring_applications_page_preview["User Clicks The Accept Terms Of Use Checkbox"]();
    await recurring_applications_page_preview["User Clicks The Specific Terms Of Use Checkbox"]();
    await recurring_applications_page_preview["User Clicks The Submit Button"]();
  },

  "User Checks The Sent Page": async () => {
    await recurring_applications_page_sent["User Checks H1 Of The Sent Page"]();
  },

  /**
   * This is a workaround to cancel the recurring reservation with given name in
   * [data-testid="card__heading"]
   * it cancels the last reservation in the list so they won't pile up
   */
  "User Checks The Recurring Reservation Is Sent State And Cancels It": async () => {
    await custom_keywords["Find And Click Button In Group With Matching Conditions"](
      '[data-testid="applications__group--wrapper"]',
      "Vastaanotettu",
      '[class*="Card__CardContent"]',
      '[data-testid="card__heading"]',
      "Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)",
      '[data-testid="card__tags"]',
      "Lähetetty",
      "Peru"
    );

    // The click waits until the modal's animation has ended
    await custom_keywords["Find And Click Element With Text"]("id=application-card-modal >> span", "Kyllä");
  },

  /**
   * Verifies that the recurring reservation with the given name is no longer found
   * in the applications list. Fails if the reservation is still present.
   */
  "User Verifies The Recurring Reservation Is Cancelled": async () => {
    await custom_keywords["Verify Card Not Found In Group With Matching Conditions"](
      V.EMPTY_STATE_MESSAGE_RECURRING_APPLICATIONS
    );
  },

  // MOBILE
  "User Navigates To Single Booking Page Mobile": async () => {
    await topnav["Navigate To Single Booking Page Mobile"]();
  },

  "User Checks Cancelled Booking Is Found Mobile": async (
    unitname_mybookings: string,
    time_of_quick_reservation_minusT: RobotValue
  ) => {
    await topnav["Click Tablist Scroll Button To Right Mobile"]();
    await mybookings["Check Unitname And Reservation Are Not Found"](
      unitname_mybookings,
      time_of_quick_reservation_minusT
    );
    await mybookings["Navigate To Cancelled Bookings"]();
    await mybookings["Check Unitname And Reservation Time And Click Show"](
      unitname_mybookings,
      time_of_quick_reservation_minusT
    );
  },

  // Misc
  "User Checks That Reservation Unit Picture Is Loaded": async (unit_name: string) => {
    let img_selector: RobotValue,
      src: RobotValue,
      complete: RobotValue,
      natural_width: RobotValue,
      natural_height: RobotValue,
      width: RobotValue,
      height: RobotValue;
    // Target the image by its alt text - this is the most reliable selector
    img_selector = `img[alt*="${unit_name}"]`;

    // Wait for the image element to be attached
    await Browser["Wait For Elements State"](
      chain(img_selector, "nth=0"),
      "attached",
      named({ timeout: "5s", message: `Reservation unit picture for ${unit_name} is not present` })
    );

    // Verify the src attribute is present
    src = await Browser["Get Attribute"](chain(img_selector, "nth=0"), "src");
    await BuiltIn["Should Not Be Empty"](src, named({ msg: "Image src attribute is empty" }));

    // Verify the image has actually loaded (not broken)
    // Check that image.complete is true, naturalWidth > 0, and naturalHeight > 0
    complete = await Browser["Get Property"](chain(img_selector, "nth=0"), "complete");
    await BuiltIn["Should Be True"](
      isTruthy(complete),
      named({ msg: "Image is not fully loaded (complete property is false)" })
    );

    natural_width = await Browser["Get Property"](chain(img_selector, "nth=0"), "naturalWidth");
    await BuiltIn["Should Be True"](
      Number(natural_width) > 0,
      named({ msg: "Image naturalWidth is 0 - image failed to load" })
    );

    natural_height = await Browser["Get Property"](chain(img_selector, "nth=0"), "naturalHeight");
    await BuiltIn["Should Be True"](
      Number(natural_height) > 0,
      named({ msg: "Image naturalHeight is 0 - image failed to load" })
    );

    // Get and log the image dimensions for debugging
    width = await Browser["Get Property"](chain(img_selector, "nth=0"), "naturalWidth");
    height = await Browser["Get Property"](chain(img_selector, "nth=0"), "naturalHeight");
    await BuiltIn["Log"](`Image loaded successfully with dimensions: ${str(width)}x${str(height)}`);
  },
});
