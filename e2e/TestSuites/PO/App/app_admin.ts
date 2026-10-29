/** Port of PO/App/app_admin.robot */
import { Browser, loc } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, expect, keywords, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { admin_my_units } from "../../PO/Admin/admin_my_units";
import { admin_navigation_menu } from "../../PO/Admin/admin_navigation_menu";
import { admin_notifications } from "../../PO/Admin/admin_notifications";
import { admin_notifications_create_page } from "../../PO/Admin/admin_notifications_create_page";
import { admin_reservations } from "../../PO/Admin/admin_reservations";
import { custom_keywords } from "../../Resources/custom_keywords";
import { data_modification } from "../../Resources/data_modification";
import "../../Resources/parallel_test_data";
import "../../Resources/variables";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/devices";
import "../../Resources/create_data";

export const app_admin = keywords("app_admin", {
  "Admin Checks The Info And Sets Reservation Free And Approves It": async () => {
    await admin_reservations["Admin Checks Reservation H1"](V.BOOKING_NUM_ONLY_BOOKING_NAME_SUBVENTED);
    await admin_reservations["Admin Checks Reservation Title Tagline"](V.RESERVATION_TAGLINE);
    await admin_reservations["Admin Checks Reservation Info Before Handling"](
      V.SINGLEBOOKING_SUBVENTED_PRICE_ADMIN_SIDE,
      V.ADMIN_STATUS_PROCESSED,
      V.PURPOSE_OF_THE_BOOKING,
      V.SINGLEBOOKING_DESCRIPTION,
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      V.SINGLEBOOKING_SUBVENTED_ADMIN_SIDE_AGE_GROUP
    );
    await admin_reservations["Admin Clicks Button In Reservation Page"](
      '[data-testid="approval-buttons__approve-button"]'
    );
    // Waits for the approval dialog
    await admin_reservations["Admin Checks Reason For Subvention In Dialog"]();
    await admin_reservations["Admin Clicks Set Reservation To Free"]();
    await admin_reservations["Admin Clicks Button In Reservation Page"](
      '[data-testid="approval-dialog__accept-button"]'
    );
    // The checks wait until the payment status is updated
    await admin_reservations["Admin Checks Reservation Info After Handling"](
      V.SINGLEBOOKING_NO_PAYMENT_ADMIN_SIDE,
      V.MYBOOKINGS_STATUS_CONFIRMED,
      V.PURPOSE_OF_THE_BOOKING,
      V.SINGLEBOOKING_DESCRIPTION,
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      V.SINGLEBOOKING_SUBVENTED_ADMIN_SIDE_AGE_GROUP,
      null
    );
  },

  "Admin Checks The Info And Cancels Reservation": async () => {
    await admin_reservations["Admin Checks Reservation H1"](V.BOOKING_NUM_ONLY_BOOKING_NAME_SUBVENTED);
    await admin_reservations["Admin Checks Reservation Title Tagline"](V.RESERVATION_TAGLINE);
    await admin_reservations["Admin Checks Reservation Info Before Handling"](
      V.DEFAULT_PRICE_ALWAYS_REQUESTED_UNIT,
      V.ADMIN_STATUS_PROCESSED,
      V.PURPOSE_OF_THE_BOOKING,
      V.SINGLEBOOKING_DESCRIPTION,
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      null
    );
    await app_admin["Admin Rejects Reservation And Checks The Status"]();
    await admin_reservations["Admin Saves Reservation Number"]();
    await admin_reservations["Admin Checks Reservation Info After Handling"](
      V.DEFAULT_PRICE_ALWAYS_REQUESTED_UNIT,
      V.MYBOOKINGS_STATUS_REJECTED,
      V.PURPOSE_OF_THE_BOOKING,
      V.SINGLEBOOKING_DESCRIPTION,
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      null,
      V.ADMIN_REASON_REJECTED
    );
  },

  "Admin Returns Reservation To Handling State From Rejected State": async () => {
    // When UI is scrolled down, a sticky header appears with the same selector name
    // Using nth=-1 to target the last element
    await admin_reservations["Admin Clicks Button In Reservation Page"](
      '[data-testid="approval-buttons__return-to-handling-button"] >> nth=-1'
    );
    await custom_keywords["Find And Click Element With Text"]("id=info-dialog >> span", V.RESERVATION_STATUS_DIALOG);
    await admin_reservations["Admin Checks Reservation Status"](V.ADMIN_STATUS_PROCESSED);
  },

  "Admin Edits Reservation Time": async () => {
    let admin_modified_formatted_date: RobotValue, admin_modified_formatted_date_minus_t: RobotValue;
    await BuiltIn["Log"]("Reservation needs to be approved first in order to do this step");

    // This sets the variables for ${MODIFIED_HOUR_STARTTIME_SUBVENTED_RESERVATION}, ${MODIFIED_HOUR_ENDTIME_SUBVENTED_RESERVATION}, ${MODIFIED_DATE_SUBVENTED_RESERVATION}, ${MODIFIED_STARTTIME_SUBVENTED_RESERVATION}
    await admin_reservations["Admin Opens Calendar And Changes Reservation Time"]();
    await data_modification["Set Info Card Duration Time Info"](
      V.MODIFIED_STARTTIME_SUBVENTED_RESERVATION,
      V.MODIFIED_DATE_SUBVENTED_RESERVATION
    );
    [admin_modified_formatted_date, admin_modified_formatted_date_minus_t] = await data_modification[
      "Set Info Card Duration Time Info"
    ](V.MODIFIED_STARTTIME_SUBVENTED_RESERVATION, V.MODIFIED_DATE_SUBVENTED_RESERVATION);

    V.ADMIN_MODIFIES_TIME_OF_INFO_CARD = admin_modified_formatted_date;
    V.ADMIN_MODIFIES_TIME_OF_INFO_CARD_MINUS_T = admin_modified_formatted_date_minus_t;

    // This sets ${RESERVATION_TAGLINE} back to client side.
    await data_modification["Formats Tagline For Admin Side"](
      V.ADMIN_MODIFIES_TIME_OF_INFO_CARD,
      V.ALWAYS_PAID_UNIT_SUBVENTED_WITH_UNIT_LOCATION
    );
    await admin_reservations["Admin Checks Reservation H1"](V.BOOKING_NUM_ONLY_BOOKING_NAME_SUBVENTED);
    await admin_reservations["Admin Checks Reservation Title Tagline"](V.RESERVATION_TAGLINE);
    await admin_reservations["Admin Checks Reservation Status"](V.MYBOOKINGS_STATUS_CONFIRMED);
  },

  "Admin Navigates To Own Units And Selects Unit Group": async (unit_group_name: string) => {
    await admin_navigation_menu["Admin Navigates To My Units"]();
    await admin_my_units["Admin Searches Own Unit And Clicks It"](unit_group_name);
  },

  "Admin Opens Make Reservation Modal And Selects Unit": async (unit_name: string) => {
    await admin_my_units["Admin Clicks Make Reservation"]();
    await admin_my_units["Admin Selects Unit From Reservation Units Dropdown"](unit_name);
  },

  "Admin Checks That Reservation Cannot Be Made": async () => {
    await admin_my_units["Admin Checks Make Reservation Button Is Disabled"]();
  },

  // Access code
  "Admin Opens Access Code Modal": async () => {
    await admin_reservations["Admin Open Access Code Modal"]();
  },

  "Admin Changes Access Code": async () => {
    await admin_reservations["Admin Changes Access Code"]();
    await admin_reservations["Admin Clicks Confirm Access Code Button"]();
    // Admin Checks Access Code Does Not Match waits until the access code has changed
    await expect(loc('[data-testid="reservation__info--Ovikoodi"]')).toBeVisible({ timeout: 10_000 });
  },

  /** Verifies that the access code matches the expected value (extracts numbers only). */
  "Admin Checks Access Code Matches": async (access_code: RobotValue) => {
    await custom_keywords["Check Elements Text"]('[data-testid="reservation__info--Ovikoodi"]', access_code);
  },

  /** Verifies that the access code does NOT match the expected value (extracts numbers only). */
  "Admin Checks Access Code Does Not Match": async (access_code: RobotValue) => {
    await custom_keywords["Verify Element With Text Is Not Found"](
      '[data-testid="reservation__info--Ovikoodi"]',
      access_code
    );
  },

  "Admin Saves Access Code": async () => {
    let access_code: RobotValue;
    access_code = await Browser["Get Text"]('[data-testid="reservation__info--Ovikoodi"]');
    V.ACCESS_CODE_ADMINSIDE = access_code;
    await BuiltIn["Log"](V.ACCESS_CODE_ADMINSIDE);

    // Top navigation
  },

  // Basic permissions
  "Admin Checks Top Navigation For Notification Manager": async () => {
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservations/requested"]');
  },

  "Admin Checks Top Navigation For Reserver": async () => {
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/application-rounds"]');
  },

  "Admin Checks Top Navigation For Viewer": async () => {
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/application-rounds"]');
  },

  "Admin Checks Top Navigation For Handler": async () => {
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
  },

  "Admin Checks Top Navigation For Admin": async () => {
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/units"]');
  },

  // Unit permissions
  "Admin Checks Top Navigation For Notification Manager With Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
  },

  "Admin Checks Top Navigation For Viewer With Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
  },

  "Admin Checks Top Navigation For Reserver With Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
  },

  "Admin Checks Top Navigation For Handler With Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
  },

  "Admin Checks Top Navigation For Admin With Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
  },

  // Group unit permissions
  "Admin Checks Top Navigation For Notification Manager With Group Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
  },

  "Admin Checks Top Navigation For Viewer With Group Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
  },

  "Admin Checks Top Navigation For Reserver With Group Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
  },

  "Admin Checks Top Navigation For Handler With Group Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/units"]');
  },

  "Admin Checks Top Navigation For Admin With Group Unit Permissions": async () => {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/application-rounds"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservation-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/my-units"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations"]');
    await custom_keywords["Verify Element Is Found"]('[href="/kasittely/reservations/requested"]');
    await custom_keywords["Verify Element Is Not Found"]('[href="/kasittely/notifications"]');

    // Not currently in use
    // This was used to navigate to reservations through calendar view
    // Admin Navigates To Reservations By Units And Checks Reservation Info
    // ${ByUnitsElement}=  Browser.Get Element  css=[role="tablist"] >> span:text-is("${RESERVATIONS_BY_UNITS_FI}")
    // Click  ${ByUnitsElement}
    // admin_reservations.Admin Selects Reservation Unit  ${ALWAYS_FREE_UNIT}
    // admin_reservations.Admin Finds Reservation And Clicks It  ${CALENDAR_EVENT_NAME}
    // app_common.Switch To New Tab From Current Page
    // admin_reservations.Admin Checks Reservation Title Tagline  ${RESERVATION_TAGLINE}
    // admin_reservations.Admin Checks Reservation User Info
  },

  "Admin Clicks Make Reservation And Checks Dialog Opens": async () => {
    await admin_my_units["Admin Clicks Make Reservation"]();
    await expect(
      loc("id=info-dialog"),
      "Info dialog should be visible after clicking make reservation button"
    ).toBeVisible({ timeout: 10_000 });
  },

  "Admin Rejects Reservation And Checks The Status": async () => {
    // Click the last one to avoid strict mode violation that might happen when accordion is open
    await Browser["Click"]('[data-testid="approval-buttons__reject-button"] >> nth=-1');
    await admin_reservations["Admin Selects Reason For Rejection"](V.ADMIN_REASON_REJECTED);
    await Browser["Click"]('[data-testid="deny-dialog__deny-button"]');
    await admin_reservations["Admin Checks Reservation Status"](V.MYBOOKINGS_STATUS_REJECTED);
  },

  "Admin Makes Reservation For Behalf And Clicks Submit": async () => {
    let date_plus_x_days: RobotValue, start_hour: RobotValue, end_hour: RobotValue;
    await BuiltIn["Log"](
      "This sets variables for MODIFIED_HOUR_STARTTIME_SUBVENTED_RESERVATION, MODIFIED_HOUR_ENDTIME_SUBVENTED_RESERVATION, MODIFIED_DATE_SUBVENTED_RESERVATION and MODIFIED_STARTTIME_SUBVENTED_RESERVATION"
    );

    // Call the keyword and capture the returned values
    [date_plus_x_days, start_hour, end_hour] = await data_modification["Get Modified Date And Time"]();

    V.UNAVAILABLE_RESERVATION_DATE = date_plus_x_days;
    V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME = start_hour;
    V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME = end_hour;

    await admin_reservations["Admin Enters Reservation Time And Type Of Reservation"](
      "[for=BEHALF]",
      V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME,
      V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME,
      V.UNAVAILABLE_RESERVATION_DATE
    );
    await admin_reservations["Admin Fills Reservation Details Behalf"](); // this keyword generates the info for checking calendar content
    await admin_reservations["Admin Clicks Button In Reservation Page"](
      '[data-testid="CreateReservationModal__accept-reservation"]'
    );
    await admin_reservations["Admin Verifies Reservation Modal Is Closed"]();
  },

  "Admin Makes Reservation For Closed And Clicks Submit": async () => {
    let date_plus_x_days: RobotValue, start_hour: RobotValue, end_hour: RobotValue;
    // Call the keyword and capture the returned values
    [date_plus_x_days, start_hour, end_hour] = await data_modification["Get Modified Date And Time"]();

    V.UNAVAILABLE_RESERVATION_DATE = date_plus_x_days;
    V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME = start_hour;
    V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME = end_hour;

    await admin_reservations["Admin Enters Reservation Time And Type Of Reservation"](
      "[for=BLOCKED]",
      V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME,
      V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME,
      V.UNAVAILABLE_RESERVATION_DATE
    );
    await admin_reservations["Admin Clicks Button In Reservation Page"](
      '[data-testid="CreateReservationModal__accept-reservation"]'
    );
    await admin_reservations["Admin Verifies Reservation Modal Is Closed"]();
  },

  "Admin Makes Reservation For Staff And Clicks Submit": async () => {
    let date_plus_x_days: RobotValue, start_hour: RobotValue, end_hour: RobotValue;
    // Call the keyword and capture the returned values
    [date_plus_x_days, start_hour, end_hour] = await data_modification["Get Modified Date And Time"]();

    V.UNAVAILABLE_RESERVATION_DATE = date_plus_x_days;
    V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME = start_hour;
    V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME = end_hour;

    await admin_reservations["Admin Enters Reservation Time And Type Of Reservation"](
      "[for=STAFF]",
      V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME,
      V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME,
      V.UNAVAILABLE_RESERVATION_DATE
    );
    await admin_reservations["Admin Clicks Button In Reservation Page"](
      '[data-testid="CreateReservationModal__accept-reservation"]'
    );
    await admin_reservations["Admin Verifies Reservation Modal Is Closed"]();
  },

  "Admin Attempts To Make An Unavailable Reservation And Clicks Cancel": async () => {
    await admin_reservations["Admin Enters Reservation Time And Type Of Reservation"](
      '[for="BEHALF"]',
      V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME,
      V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME,
      V.UNAVAILABLE_RESERVATION_DATE
    );
    await Browser["Scroll To Element"]('[data-testid="CreateReservationModal__accept-reservation"]');
    await custom_keywords["Check Elements Text"](
      '[data-testid="CreateReservationModal__collision-warning"] >> [class*="Notification-module_body__"]',
      V.RESERVATION_TIME_NOT_FREE
    );
    await Browser["Click"]("data-testid=CreateReservationModal__cancel-reservation");
    await admin_reservations["Admin Verifies Reservation Modal Is Closed"]();
  },

  // Notifications
  "Admin Creates Normal Notification For User And Admin Side": async () => {
    let date_plus_60_days: RobotValue, randomvalue: RobotValue;
    await admin_notifications["Admin Clicks Create Notification Button"]();
    await admin_notifications_create_page["Admin Selects Immediate Validity Period"]();
    date_plus_60_days = await data_modification["Get Date Plus 60 Days"]();
    V.NOTIFICATION_ACTIVE_UNTIL = date_plus_60_days;
    await admin_notifications_create_page["Admin Selects Notification Active Until"](V.NOTIFICATION_ACTIVE_UNTIL);
    // if the notification name exist already we cannot publish the notification
    randomvalue = await data_modification["Generate Random Letter And Number"]();
    V.NOTIFICATION_BANNER_MESSAGE_NAME = `${V.NOTIFICATION_BANNER_MESSAGE_NORMAL} ${str(randomvalue)}`;
    await admin_notifications_create_page["Admin Fills Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME);
    await admin_notifications_create_page["Admin Selects Type Of Notification"](V.NOTIFICATION_BANNER_MESSAGE_NORMAL);
    await admin_notifications_create_page["Admin Selects Target Group All"]();

    randomvalue = await data_modification["Generate Random Letter And Number"]();
    V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI = `${V.NOTIFICATION_BANNER_MESSAGE_NORMAL} ${V.NOTIFICATION_BANNER_CLEANUP_PATTERN} ${str(randomvalue)}`;
    await admin_notifications_create_page["Admin Fills Notification Text Fi"](V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI);
    await admin_notifications_create_page["Admin Publishes Notification"]();
  },

  "Admin Creates Warning Notification For User And Admin Side": async () => {
    let date_plus_60_days: RobotValue, randomvalue: RobotValue;
    await admin_notifications["Admin Clicks Create Notification Button"]();
    await admin_notifications_create_page["Admin Selects Immediate Validity Period"]();
    date_plus_60_days = await data_modification["Get Date Plus 60 Days"]();
    V.NOTIFICATION_ACTIVE_UNTIL = date_plus_60_days;
    await admin_notifications_create_page["Admin Selects Notification Active Until"](V.NOTIFICATION_ACTIVE_UNTIL);
    // if the notification name exist already we cannot publish the notification
    randomvalue = await data_modification["Generate Random Letter And Number"]();
    V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING = `${V.NOTIFICATION_BANNER_MESSAGE_WARNING} ${str(randomvalue)}`;
    await admin_notifications_create_page["Admin Fills Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING);
    await admin_notifications_create_page["Admin Selects Type Of Notification"](V.NOTIFICATION_BANNER_MESSAGE_WARNING);
    await admin_notifications_create_page["Admin Selects Target Group All"]();
    randomvalue = await data_modification["Generate Random Letter And Number"]();
    V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI = `${V.NOTIFICATION_BANNER_MESSAGE_WARNING} ${V.NOTIFICATION_BANNER_CLEANUP_PATTERN} ${str(randomvalue)}`;
    await admin_notifications_create_page["Admin Fills Notification Text Fi"](V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI);
    await admin_notifications_create_page["Admin Publishes Notification"]();
  },

  "Admin Creates Error Notification For User And Admin Side": async () => {
    let date_plus_60_days: RobotValue, randomvalue: RobotValue;
    await admin_notifications["Admin Clicks Create Notification Button"]();
    await admin_notifications_create_page["Admin Selects Immediate Validity Period"]();
    date_plus_60_days = await data_modification["Get Date Plus 60 Days"]();
    V.NOTIFICATION_ACTIVE_UNTIL = date_plus_60_days;
    await admin_notifications_create_page["Admin Selects Notification Active Until"](V.NOTIFICATION_ACTIVE_UNTIL);
    // if the notification name exist already we cannot publish the notification
    randomvalue = await data_modification["Generate Random Letter And Number"]();
    V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR = `${V.NOTIFICATION_BANNER_MESSAGE_ERROR} ${str(randomvalue)}`;
    await admin_notifications_create_page["Admin Fills Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR);
    await admin_notifications_create_page["Admin Selects Type Of Notification"](V.NOTIFICATION_BANNER_MESSAGE_ERROR);
    await admin_notifications_create_page["Admin Selects Target Group All"]();

    randomvalue = await data_modification["Generate Random Letter And Number"]();
    V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI = `${V.NOTIFICATION_BANNER_MESSAGE_ERROR} ${V.NOTIFICATION_BANNER_CLEANUP_PATTERN} ${str(randomvalue)}`;
    await admin_notifications_create_page["Admin Fills Notification Text Fi"](V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI);
    await admin_notifications_create_page["Admin Publishes Notification"]();
  },
});
