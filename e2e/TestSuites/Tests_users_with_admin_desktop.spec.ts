/** Desktop browser tests */
import { BuiltIn } from "../lib/BuiltIn";
import { V } from "../lib/robot";
import { test } from "./fixtures";
import { admin_navigation_menu } from "./PO/Admin/admin_navigation_menu";
import { admin_reservations } from "./PO/Admin/admin_reservations";
import { app_admin } from "./PO/App/app_admin";
import { app_common } from "./PO/App/app_common";
import { app_user } from "./PO/App/app_user";
import { topnav } from "./PO/Common/topnav";
import { reservation_lownav } from "./PO/User/reservation_lownav";
import { common_setups_teardowns } from "./Resources/common_setups_teardowns";
import { data_modification } from "./Resources/data_modification";
import "./Resources/variables";
import "./Resources/texts_FI";
import "./Resources/serial_users";
import "./Resources/parallel_test_data";
import "./Resources/devices";
import "./Resources/create_data";
import "./Resources/suite_specific_units";

test.describe(
  "Tests users with admin desktop",
  {
    tag: ["@combined-suite"],
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

    test(
      "User creates and Admin accepts single booking that requires handling",
      { tag: ["@combined-test-data-set-0", "@accept-booking"] },
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
        await app_user["User Checks The Subvented Reservation Info Is Right And Submits"]();
        await app_user["User Checks The Subvented Reservation Info Is Right After Submitting"]();
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

        await BuiltIn["Log"]("Formats info of subvented reservation to admin side");
        await data_modification["Formats Reservation Number And Name For Admin Side"]();
        await data_modification["Formats Tagline For Admin Side"](
          V.TIME_OF_QUICK_RESERVATION,
          V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION
        );
        await app_common["User Logs Out"]();

        await BuiltIn["Log"]("Admin logs in and approves reservation");
        await app_common["Admin Goes To Landing Page"]();
        await app_common["Admin Logs In With Suomi Fi"]();
        await admin_navigation_menu["Admin Navigates To Requested Reservations"]();
        await admin_reservations["Admin Searches Reservation With Id Number And Clicks It From Name"](
          V.BOOKING_NUM_ONLY,
          V.CURRENT_USER_FULLNAME
        );
        await app_admin["Admin Checks The Info And Sets Reservation Free And Approves It"]();
        await app_admin["Admin Edits Reservation Time"]();
        await app_common["Admin Logs Out"]();

        await BuiltIn["Log"]("User logs in and verifies approved reservation");
        await app_common["User Goes To Landing Page"]();
        await app_common["User Logs In With Suomi Fi"]();
        await topnav["Navigate To My Bookings"]();
        await app_user["User Can See Upcoming Booking In List And Clicks It"](
          V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION,
          V.ADMIN_MODIFIES_TIME_OF_INFO_CARD_MINUS_T
        );
        await app_user["User Verifies Details Of Subvented Reservation After Admin Approval Without Payment"]();
      }
    );

    test(
      "User creates and Admin declines single booking that requires handling",
      { tag: ["@combined-test-data-set-1", "@decline-booking"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["User Logs In With Suomi Fi"]();

        await BuiltIn["Log"]("User creates reservation that requires handling");
        await app_user["User Navigates To Single Booking Page"]();
        await app_user["User Uses Search To Find Right Unit"](V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING);
        await app_user["User Reserves A Free Quick Reservation Slot"]();
        await app_user["User Fills Info For Unit That Is Always Handled As Individual And Submits"]();
        await app_user["User Checks Unit That Is Always Handled Details Are Right Before Submit"]();
        await reservation_lownav["Click Submit Button Continue"]();
        await app_user["User Checks Unit That Is Always Handled Details Are Right After Submit"]();
        await topnav["Navigate To My Bookings"]();
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

        await BuiltIn["Log"]("Formats info of subvented reservation to admin side");
        await data_modification["Formats Reservation Number And Name For Admin Side"]();
        await data_modification["Formats Tagline For Admin Side"](
          V.TIME_OF_QUICK_RESERVATION,
          V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION
        );
        await app_common["User Logs Out"]();

        await BuiltIn["Log"]("Admin logs in and rejects reservation");
        await app_common["Admin Goes To Landing Page"]();
        await app_common["Admin Logs In With Suomi Fi"]();
        await admin_navigation_menu["Admin Navigates To Requested Reservations"]();
        await admin_reservations["Admin Searches Reservation With Id Number And Clicks It From Name"](
          V.BOOKING_NUM_ONLY,
          V.CURRENT_USER_FULLNAME
        );
        await app_admin["Admin Checks The Info And Cancels Reservation"]();
        await app_admin["Admin Returns Reservation To Handling State From Rejected State"]();
        await app_admin["Admin Rejects Reservation And Checks The Status"]();
        await app_common["Admin Logs Out"]();

        await BuiltIn["Log"]("User logs in and verifies rejected reservation");
        await app_common["User Goes To Landing Page"]();
        await app_common["User Logs In With Suomi Fi"]();
        await topnav["Navigate To My Bookings"]();
        await app_user["User Can See Upcoming Booking In List And Clicks It"](
          V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await app_user["User Checks The Rejected Reservation Info Is Right After Admin Handling"]();
      }
    );

    test(
      "User can make reservation with access code and admin changes the code",
      { tag: ["@combined-test-data-set-2", "@access-code"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["User Logs In With Suomi Fi"]();

        await BuiltIn["Log"]("User creates reservation");
        await app_user["User Navigates To Single Booking Page"]();
        await app_user["User Uses Search To Find Right Unit"](V.CURRENT_UNIT_WITH_ACCESS_CODE);
        await app_user["User Reserves A Free Quick Reservation Slot"]();
        await app_user["User Fills Booking Details As Individual For Reservation With Access Code And Submits"]();
        await app_user["User Checks The Reservation Info Is Right Before Submit With Access Code"]();
        await reservation_lownav["Click Submit Button Continue"]();
        await app_user["User Checks The Reservation Info Is Right After Submit With Access Code"]();
        await app_common["User Logs Out"]();

        await BuiltIn["Log"]("Admin logs in and changes access code");
        await app_common["Admin Goes To Landing Page"]();
        await app_common["Admin Logs In With Suomi Fi"]();
        await admin_navigation_menu["Admin Navigates To Requested Reservations"]();
        await admin_reservations["Admin Searches Reservation With Id Number And Clicks It From Name"](
          V.BOOKING_NUM_ONLY,
          V.CURRENT_USER_FULLNAME
        );

        await BuiltIn["Log"]("Changing access code");
        await app_admin["Admin Opens Access Code Modal"]();
        await app_admin["Admin Checks Access Code Matches"](V.ACCESS_CODE);
        await app_admin["Admin Changes Access Code"]();
        await app_admin["Admin Checks Access Code Does Not Match"](V.ACCESS_CODE);
        await app_admin["Admin Saves Access Code"]();
        await app_common["Admin Logs Out"]();

        await BuiltIn["Log"]("User logs in and checks access code was changed");
        await app_common["User Goes To Landing Page"]();
        await app_common["User Logs In With Suomi Fi"]();
        await topnav["Navigate To My Bookings"]();
        await app_user["User Can See Upcoming Booking In List And Clicks It"](
          V.CURRENT_UNIT_WITH_ACCESS_CODE_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await app_user["User Checks Booking Info In Reservations With Access Code"](
          V.MYBOOKINGS_STATUS_CONFIRMED,
          V.SINGLEBOOKING_NO_PAYMENT,
          V.TIME_OF_QUICK_RESERVATION,
          V.ACCESS_CODE_ADMINSIDE
        );
      }
    );
  }
);
