/** Desktop browser tests */
import { BuiltIn } from "../lib/BuiltIn";
import { V } from "../lib/robot";
import { test } from "./fixtures";
import { app_common } from "./PO/App/app_common";
import { app_user } from "./PO/App/app_user";
import { mail } from "./PO/App/mail";
import { login } from "./PO/Common/login";
import { popups } from "./PO/Common/popups";
import { topnav } from "./PO/Common/topnav";
import { mybookings } from "./PO/User/mybookings";
import { recurring } from "./PO/User/recurring";
import { reservation_lownav } from "./PO/User/reservation_lownav";
import { user_landingpage } from "./PO/User/user_landingpage";
import { common_setups_teardowns } from "./Resources/common_setups_teardowns";
import "./Resources/parallel_test_data";
import "./Resources/devices";
import "./Resources/variables";
import "./Resources/serial_users";
import "./Resources/texts_FI";
import "./Resources/create_data";
import "./Resources/suite_specific_units";

test.describe(
  "Tests user desktop FI",
  {
    tag: ["@desktop-suite"],
    annotation: [
      { type: "Documentation", description: "Desktop browser tests" },
      {
        type: "Suite Setup",
        description: "Run Only Once    create_data.Create Robot Test Data (the create_data setup project)",
      },
    ],
  },
  () => {
    test.beforeEach(async () => {
      await app_common["User Opens Desktop Browser To Landing Page"]();
    });

    test.afterEach(async () => {
      await common_setups_teardowns["Complete Test Teardown"]();
    });

    test("User logs in and out with suomi_fi", { tag: ["@desktop-test-data-set-0", "@smoke"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();

      await BuiltIn["Log"]("User logs in with Suomi.fi");
      await app_common["User Logs In With Suomi Fi"]();

      await BuiltIn["Log"]("User logs out");
      await app_common["User Logs Out"]();
      await app_common["User Confirms Log Out"]();
    });

    test("User can make free single booking and modifies it", { tag: ["@desktop-test-data-set-1"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await app_common["User Logs In With Suomi Fi"]();

      await BuiltIn["Log"]("User navigates to reservation unit page");
      await app_user["User Navigates To Single Booking Page"]();
      await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_FREE_UNIT);

      await BuiltIn["Log"]("User checks that reservation unit picture is loaded");
      await app_user["User Checks That Reservation Unit Picture Is Loaded"](V.UNIT_NAME_FOR_PICTURE_TEST);

      await BuiltIn["Log"]("User creates reservation");
      await app_user["User Reserves A Free Quick Reservation Slot"]();
      await app_user["User Fills The Reservation Info For Always Free Unit And Submits"]();
      await app_user["User Checks The Reservation Info Is Right Before Submit"]();
      await reservation_lownav["Click Submit Button Continue"]();
      await app_user["User Checks The Reservation Info Is Right After Submit"]();
      await topnav["Navigate To My Bookings"]();
      await app_user["User Can See Upcoming Booking In List And Clicks It"](
        V.CURRENT_ALWAYS_FREE_UNIT_WITH_LOCATION,
        V.TIME_OF_QUICK_RESERVATION_MINUS_T
      );

      await BuiltIn["Log"]("User modifies reservation");
      await app_user["User Modifies Booking And Verifies The Changes"]();
      await app_user["User Checks The Modified Reservation Info Is Right And Clicks Continue"]();

      await BuiltIn["Log"]("User cancels reservation");
      await app_user["User Cancel Booking In Reservations And Checks It Got Cancelled"]();
      await topnav["Navigate To My Bookings"]();
      await app_user["User Checks Cancelled Booking Is Found"](
        V.CURRENT_ALWAYS_FREE_UNIT_WITH_LOCATION,
        V.TIME_OF_QUICK_RESERVATION_MINUS_T_MODIFIED
      );
      await app_user["User Checks Booking Info In Reservations"](
        V.IN_RESERVATIONS_STATUS_CANCELED,
        V.SINGLEBOOKING_NO_PAYMENT,
        V.TIME_OF_QUICK_RESERVATION_MODIFIED
      );
    });

    test("User can create non-cancelable booking", { tag: ["@desktop-test-data-set-2"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await topnav["Click Login"]();
      await login["Login Suomi Fi"](V.CURRENT_USER_HETU);
      await user_landingpage["Check The User Landing Page H1"](V.USER_LANDING_PAGE_H1_TEXT);
      await popups["User Accepts Cookies If Dialog Is Visible"](V.COOKIETEXT);

      await BuiltIn["Log"]("User creates reservation");
      await app_user["User Navigates To Single Booking Page"]();
      await app_user["User Uses Search To Find Right Unit"](V.CURRENT_FREE_UNIT_NO_CANCEL);
      await app_user["User Reserves A Free Quick Reservation Slot"]();
      await app_user["User Fills Noncancelable Booking Details As Individual And Submits"]();
      await app_user["User Checks The Noncancelable Reservation Info Is Right Before Submit"]();
      await reservation_lownav["Click Submit Button Continue"]();
      await app_user["User Checks The Noncancelable Reservation Info Is Right After Submit"]();

      await BuiltIn["Log"]("User checks reservation cannot be canceled");
      await topnav["Navigate To My Bookings"]();
      await app_user["User Can See Upcoming Noncancelable Booking In List And Clicks It"](
        V.CURRENT_FREE_UNIT_NO_CANCEL_WITH_LOCATION,
        V.TIME_OF_QUICK_RESERVATION_MINUS_T
      );
      await app_user["User Checks Booking Info In Reservations For Noncancelable Booking"]();
    });

    test(
      "User can make paid single booking with interrupted checkout",
      { tag: ["@desktop-test-data-set-3"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["User Logs In With Suomi Fi"]();

        await BuiltIn["Log"]("User creates reservation");
        await app_user["User Navigates To Single Booking Page"]();
        await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_PAID_UNIT);
        await app_user["User Reserves A Free Quick Reservation Slot"]();
        await app_user["User Fills The Reservation Info For Unit With Payment And Submits"]();
        await app_user["User Checks The Paid Reservation Info Is Right And Submits"]();

        await BuiltIn["Log"]("User pays the reservation");
        await app_user["User Interrupts Paid Checkout"](V.URL_TEST);
        await app_user["User Accepts Payment To Checkout"]();
        await app_user["User Checks Info In Paid Checkout And Confirms Booking"]();
        await app_user["User Checks The Paid Reservation Info Is Right After Checkout"]();

        await BuiltIn["Log"]("User checks that paid reservation is found");
        await topnav["Navigate To My Bookings"]();
        await app_user["User Can See Upcoming Booking In List And Clicks It"](
          V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await app_user["User Checks The Paid Reservation Info Is Right In Reservations"](
          V.MYBOOKINGS_STATUS_CONFIRMED,
          V.MYBOOKINGS_STATUS_PAID_CONFIRMED,
          V.SINGLEBOOKING_PAID_PRICE_VAT_INCL,
          V.TIME_OF_QUICK_RESERVATION,
          V.BOOKING_NUM_ONLY
        );

        await BuiltIn["Log"]("User cancel booking");
        await app_user["User Cancel Booking In Reservations And Checks It Got Cancelled"]();

        await BuiltIn["Log"]("User verifies cancelled booking is found");
        await topnav["Navigate To My Bookings"]();
        await app_user["User Checks Cancelled Booking Is Found"](
          V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
      }
    );

    test("User can make paid single booking", { tag: ["@desktop-test-data-set-4"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await app_common["User Logs In With Suomi Fi"]();

      await BuiltIn["Log"]("User creates paid reservation");
      await app_user["User Navigates To Single Booking Page"]();
      await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_PAID_UNIT);
      await app_user["User Reserves A Free Quick Reservation Slot"]();
      await app_user["User Fills The Reservation Info For Unit With Payment And Submits"]();
      await app_user["User Checks The Paid Reservation Info Is Right And Submits"]();

      await BuiltIn["Log"]("User pays the reservation");
      await app_user["User Checks Info In Paid Checkout And Confirms Booking"]();
      await app_user["User Checks The Paid Reservation Info Is Right After Checkout"]();

      await BuiltIn["Log"]("User verifies paid reservation in my bookings and paid status");
      await topnav["Navigate To My Bookings"]();
      await app_user["User Can See Upcoming Booking In List And Clicks It"](
        V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
        V.TIME_OF_QUICK_RESERVATION_MINUS_T
      );
      await app_user["User Checks The Paid Reservation Info Is Right In Reservations"](
        V.MYBOOKINGS_STATUS_CONFIRMED,
        V.MYBOOKINGS_STATUS_PAID_CONFIRMED,
        V.SINGLEBOOKING_PAID_PRICE_VAT_INCL,
        V.TIME_OF_QUICK_RESERVATION,
        V.BOOKING_NUM_ONLY
      );

      await BuiltIn["Log"]("User cancels paid booking");
      await app_user["User Cancel Booking In Reservations And Checks It Got Cancelled"]();
      await mybookings["Wait For Payment Status"](V.MYBOOKINGS_STATUS_REFUNDED);

      await BuiltIn["Log"]("User verifies cancellation and refund status");
      await topnav["Navigate To My Bookings"]();
      await app_user["User Checks Cancelled Booking Is Found"](
        V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
        V.TIME_OF_QUICK_RESERVATION_MINUS_T
      );
      await app_user["User Checks The Paid Reservation Info Is Right In Reservations"](
        V.IN_RESERVATIONS_STATUS_CANCELED,
        V.MYBOOKINGS_STATUS_REFUNDED,
        V.SINGLEBOOKING_PAID_PRICE_VAT_INCL,
        V.TIME_OF_QUICK_RESERVATION,
        V.BOOKING_NUM_ONLY
      );
    });

    test(
      "User can make subvented single booking that requires handling",
      { tag: ["@desktop-test-data-set-5"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["User Logs In With Suomi Fi"]();

        await BuiltIn["Log"]("User creates subvented reservation");
        await app_user["User Navigates To Single Booking Page"]();
        await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED);
        await app_user["User Reserves A Free Quick Reservation Slot"]();
        await app_user["User Fills Subvented Booking Details As Individual And Submits"](
          V.JUSTIFICATION_FOR_SUBVENTION
        );
        await app_user["User Checks The Paid Reservation That Requires Handling Info Is Right And Submits"]();

        await BuiltIn["Log"]("User verifies reservation requires handling");
        await topnav["Navigate To My Bookings"]();
        await app_user["User Can See Upcoming Booking In List And Clicks It"](
          V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await app_user["User Checks Booking Info In Reservations With All Reservation Info"](
          V.MYBOOKINGS_STATUS_PROCESSED,
          V.SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
          V.TIME_OF_QUICK_RESERVATION
        );
      }
    );

    test("User checks that reserved time is not available anymore", { tag: ["@desktop-test-data-set-7"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await app_common["User Logs In With Suomi Fi"]();

      await BuiltIn["Log"]("User creates reservation");
      await app_user["User Navigates To Single Booking Page"]();
      await app_user["User Uses Search To Find Right Unit"](V.CURRENT_UNAVAILABLE_UNIT);
      await app_user["User Reserves A Free Quick Reservation Slot"]();
      await app_user["User Fills The Reservation Info For Always Free Unit And Submits"]();
      await app_user["User Checks The Reservation Info Is Right Before Submit"]();
      await reservation_lownav["Click Submit Button Continue"]();
      await app_user["User Checks The Reservation Info Is Right After Submit"]();

      await BuiltIn["Log"]("User verifies reserved time is no longer available");
      await app_user["User Navigates To Single Booking Page"]();
      await app_user["User Uses Search To Find Right Unit"](V.CURRENT_UNAVAILABLE_UNIT);
      await app_user["User Checks That Quick Reservation Does Not Have Reserved Time"](
        V.TIME_OF_QUICK_RESERVATION_FREE_SLOT
      );
      await app_user["User Checks That Reservation Calendar Does Not Have Reserved Time Slot Available"]();
    });

    test(
      "User checks that there are not current dates in the past bookings",
      { tag: ["@desktop-test-data-set-8"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["User Logs In With Suomi Fi"]();

        await BuiltIn["Log"]("User verifies past bookings contain only past dates");
        await topnav["Navigate To My Bookings"]();
        await mybookings["Navigate To Past Bookings"]();
        await mybookings["Validate Reservations Are Not For Today Or Later"]();
      }
    );

    test(
      "User can make free single booking and check info from downloaded calendar file",
      { tag: ["@desktop-test-data-set-9"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["User Logs In With Suomi Fi"]();

        await BuiltIn["Log"]("User creates reservation");
        await app_user["User Navigates To Single Booking Page"]();
        await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_FREE_UNIT);
        await app_user["User Reserves A Free Quick Reservation Slot"]();
        await app_user["User Fills The Reservation Info For Always Free Unit And Submits"]();
        await app_user["User Checks The Reservation Info Is Right Before Submit"]();
        await reservation_lownav["Click Submit Button Continue"]();
        await app_user["User Checks The Reservation Info Is Right After Submit"]();

        await BuiltIn["Log"]("User downloads and verifies calendar file");
        await app_user["User Saves File And Formats Booking Time To ICS"](V.DOWNLOAD_ICS_FILE);
        await app_user["User Checks That Calendar File Matches Booking Time"]();
      }
    );

    test(
      "Check emails from reservations",
      {
        tag: ["@desktop-test-data-set-10"],
        annotation: {
          type: "Documentation",
          description:
            "Makes a paid booking, pays it and cancels it, then verifies the reservation confirmation and cancellation\nemails of that booking.",
        },
      },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["User Logs In With Suomi Fi"]();

        await BuiltIn["Log"]("User creates paid reservation");
        await app_user["User Navigates To Single Booking Page"]();
        await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_PAID_UNIT);
        await app_user["User Reserves A Free Quick Reservation Slot"]();
        await app_user["User Fills The Reservation Info For Unit With Payment And Submits"]();
        await app_user["User Checks The Paid Reservation Info Is Right And Submits"]();

        await BuiltIn["Log"]("User pays the reservation");
        await app_user["User Checks Info In Paid Checkout And Confirms Booking"]();
        await app_user["User Checks The Paid Reservation Info Is Right After Checkout"]();

        await BuiltIn["Log"]("User cancels paid booking");
        await topnav["Navigate To My Bookings"]();
        await app_user["User Can See Upcoming Booking In List And Clicks It"](
          V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await app_user["User Cancel Booking In Reservations And Checks It Got Cancelled"]();

        await BuiltIn["Log"]("Verifying reservation confirmation and cancellation emails");
        // Format reservation times for email verification
        await mail["Format Reservation Time For Email Texts And Receipts"](V.TIME_OF_QUICK_RESERVATION_MINUS_T);
        await mail["Verify Reservation Confirmation Email"](V.BOOKING_NUM_ONLY);
        await mail["Verify Reservation Cancellation Email"](V.BOOKING_NUM_ONLY);
      }
    );

    test("User makes recurring reservation", { tag: ["@desktop-test-data-set-11"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await app_common["User Logs In With Suomi Fi"]();

      await app_user["User Navigates To Recurring Booking Page"]();

      await BuiltIn["Log"]("User selects a recurring booking and units");
      await recurring["User Selects A Recurring Booking Round"](V.RECURRING_BOOKING_NAME);
      await recurring["User Selects The Units For Recurring Reservation"](V.RECURRING_UNIT_MALMI);
      await recurring["User Selects The Units For Recurring Reservation"](V.RECURRING_UNIT_KESKUSTA);
      await recurring["User Checks The Count Of Selected Units"](V.RECURRING_BOOKING_UNIT_COUNT_TEXT);
      await recurring["User Clicks Continue Button"]();

      await BuiltIn["Log"]("User fills the reservation info for recurring reservation");
      await app_user["User Fills In The Application Details For Recurring Application"]();
      await app_user["User Selects Times For Recurring Application"]();
      await app_user["User Fills In The Application User Info Details"]();
      await app_user["User Accepts Terms Of Use And Clicks Submit"]();

      await BuiltIn["Log"]("User verifies application was sent");
      await app_user["User Checks The Sent Page"]();

      await BuiltIn["Log"]("User cancels the recurring reservation");
      await topnav["Navigate To My Applications"]();
      await app_user["User Checks The Recurring Reservation Is Sent State And Cancels It"]();
      await app_common["Reload Page"]();
      await app_user["User Verifies The Recurring Reservation Is Cancelled"]();
    });
  }
);
