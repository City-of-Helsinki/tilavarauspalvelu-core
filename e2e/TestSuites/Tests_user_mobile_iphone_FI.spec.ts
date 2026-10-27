/** Iphone webkit tests */
import { BuiltIn } from "../lib/BuiltIn";
import { V } from "../lib/robot";
import { test } from "./fixtures";
import { app_common } from "./PO/App/app_common";
import { app_user } from "./PO/App/app_user";
import { topnav } from "./PO/Common/topnav";
import { reservation_lownav } from "./PO/User/reservation_lownav";
import { common_setups_teardowns } from "./Resources/common_setups_teardowns";
import "./Resources/variables";
import "./Resources/texts_FI";
import "./Resources/serial_users";
import "./Resources/parallel_test_data";
import "./Resources/suite_specific_units";
import "./Resources/devices";
import "./Resources/har_recording";
import "./Resources/create_data";

test.describe(
  "Tests user mobile iphone FI",
  {
    tag: ["@iphone-suite"],
    annotation: [
      { type: "Documentation", description: "Iphone webkit tests" },
      {
        type: "Suite Setup",
        description: "Run Only Once    create_data.Create Robot Test Data (the create_data setup project)",
      },
    ],
  },
  () => {
    test.beforeEach(async () => {
      await app_common["User Opens Iphone Webkit To Landing Page"]();
    });

    test.afterEach(async () => {
      await common_setups_teardowns["Complete Test Teardown"]();
    });

    test("User logs in and out with suomi_fi", { tag: ["@mobile-iphone-data-set-0"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();

      await BuiltIn["Log"]("User logs in with Suomi.fi");
      await app_common["User Logs In With Suomi Fi Mobile"]();

      await BuiltIn["Log"]("User logs out");
      await app_common["User Logs Out Mobile"]();
      await app_common["User Confirms Log Out Mobile"]();
    });

    test("User can make free single booking and modifies it", { tag: ["@mobile-iphone-data-set-1"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await app_common["User Logs In With Suomi Fi Mobile"]();

      await BuiltIn["Log"]("User creates reservation");
      await app_user["User Navigates To Single Booking Page Mobile"]();
      await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_FREE_UNIT);
      await app_user["User Reserves A Free Quick Reservation Slot"]();
      await app_user["User Fills The Reservation Info For Always Free Unit And Submits"]();
      await app_user["User Checks The Reservation Info Is Right Before Submit"]();
      await reservation_lownav["Click Submit Button Continue"]();
      await app_user["User Checks The Reservation Info Is Right After Submit"]();
      await topnav["Navigate To My Bookings Mobile"]();
      await app_user["User Can See Upcoming Booking In List And Clicks It"](
        V.CURRENT_ALWAYS_FREE_UNIT_WITH_LOCATION,
        V.TIME_OF_QUICK_RESERVATION_MINUS_T
      );

      await BuiltIn["Log"]("User modifies reservation");
      await app_user["User Modifies Booking And Verifies The Changes"]();
      await app_user["User Checks The Modified Reservation Info Is Right And Clicks Continue"]();

      await BuiltIn["Log"]("User cancels reservation");
      await app_user["User Cancel Booking In Reservations And Checks It Got Cancelled"]();
      await topnav["Navigate To My Bookings Mobile"]();
      await app_user["User Checks Cancelled Booking Is Found Mobile"](
        V.CURRENT_ALWAYS_FREE_UNIT_WITH_LOCATION,
        V.TIME_OF_QUICK_RESERVATION_MINUS_T_MODIFIED
      );
      await app_user["User Checks Booking Info In Reservations"](
        V.IN_RESERVATIONS_STATUS_CANCELED,
        V.SINGLEBOOKING_NO_PAYMENT,
        V.TIME_OF_QUICK_RESERVATION_MODIFIED
      );
    });

    test("User can make paid single booking", { tag: ["@mobile-iphone-data-set-2"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await app_common["User Logs In With Suomi Fi Mobile"]();

      await BuiltIn["Log"]("User creates paid reservation");
      await app_user["User Navigates To Single Booking Page Mobile"]();
      await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_PAID_UNIT);
      await app_user["User Reserves A Free Quick Reservation Slot"]();
      await app_user["User Fills The Reservation Info For Unit With Payment And Submits"]();
      await app_user["User Checks The Paid Reservation Info Is Right And Submits"]();

      await BuiltIn["Log"]("User pays the reservation");
      await app_user["User Checks Info In Paid Checkout And Confirms Booking"]();
      await app_user["User Checks The Paid Reservation Info Is Right After Checkout"]();

      await BuiltIn["Log"]("User verifies paid reservation in my bookings and paid status");
      await topnav["Navigate To My Bookings Mobile"]();
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

      await BuiltIn["Log"]("User verifies cancellation and refund status");
      await topnav["Navigate To My Bookings Mobile"]();
      await app_user["User Checks Cancelled Booking Is Found Mobile"](
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
      "User can make paid single booking with interrupted checkout",
      { tag: ["@mobile-iphone-data-set-3"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["User Logs In With Suomi Fi Mobile"]();

        await BuiltIn["Log"]("User creates reservation");
        await app_user["User Navigates To Single Booking Page Mobile"]();
        await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_PAID_UNIT);
        await app_user["User Reserves A Free Quick Reservation Slot"]();
        await app_user["User Fills The Reservation Info For Unit With Payment And Submits"]();
        await app_user["User Checks The Paid Reservation Info Is Right And Submits"]();

        await BuiltIn["Log"]("User pays the reservation");
        await app_user["User Interrupts Paid Checkout"](V.URL_TEST);
        await app_user["User Accepts Payment To Checkout"]();
        await app_user["User Checks Info In Paid Checkout And Confirms Booking"]();
        await app_user["User Checks The Paid Reservation Info Is Right After Checkout"]();

        await BuiltIn["Log"]("User verifies paid reservation in my bookings and paid status");
        await topnav["Navigate To My Bookings Mobile"]();
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

        await BuiltIn["Log"]("User verifies cancelled booking is found");
        await topnav["Navigate To My Bookings Mobile"]();
        await app_user["User Checks Cancelled Booking Is Found Mobile"](
          V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
      }
    );

    test("User can make booking that requires handling", { tag: ["@mobile-iphone-data-set-4"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await app_common["User Logs In With Suomi Fi Mobile"]();

      await BuiltIn["Log"]("User creates reservation that requires handling");
      await app_user["User Navigates To Single Booking Page Mobile"]();
      await app_user["User Uses Search To Find Right Unit"](V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING);
      await app_user["User Reserves A Free Quick Reservation Slot"]();
      await app_user["User Fills Info For Unit That Is Always Handled As Individual And Submits"]();
      await app_user["User Checks Unit That Is Always Handled Details Are Right Before Submit"]();
      await reservation_lownav["Click Submit Button Continue"]();
      await app_user["User Checks Unit That Is Always Handled Details Are Right After Submit"]();

      await BuiltIn["Log"]("User verifies reservation in my bookings and reservation status");
      await topnav["Navigate To My Bookings Mobile"]();
      await app_user["User Can See Upcoming Booking In List And Clicks It"](
        V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION,
        V.TIME_OF_QUICK_RESERVATION_MINUS_T
      );
      await app_user[
        "User Checks Booking Info In Reservations With Number Of Participants And Description And Purpose"
      ](
        V.MYBOOKINGS_STATUS_PROCESSED,
        V.SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
        V.TIME_OF_QUICK_RESERVATION
      );
    });

    test(
      "User can make subvented single booking that requires handling",
      { tag: ["@mobile-iphone-data-set-5"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["User Logs In With Suomi Fi Mobile"]();

        await BuiltIn["Log"]("User creates subvented reservation");
        await app_user["User Navigates To Single Booking Page Mobile"]();
        await app_user["User Uses Search To Find Right Unit"](V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED);
        await app_user["User Reserves A Free Quick Reservation Slot"]();
        await app_user["User Fills Subvented Booking Details As Individual And Submits"](
          V.JUSTIFICATION_FOR_SUBVENTION
        );
        await app_user["User Checks The Paid Reservation That Requires Handling Info Is Right And Submits"]();

        await BuiltIn["Log"]("User verifies reservation in my bookings and reservation status");
        await topnav["Navigate To My Bookings Mobile"]();
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
  }
);
