/** Iphone webkit tests */
import { V, log } from "../lib/robot";
import { test } from "./fixtures";
import "./Resources/variables";
import "./Resources/texts_FI";
import "./Resources/serial_users";
import "./Resources/parallel_test_data";
import "./Resources/suite_specific_units";
import "./Resources/devices";
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
    test.beforeEach(async ({ appCommon }) => {
      await appCommon.userOpensIphoneWebkitToLandingPage();
    });

    test.afterEach(async ({ commonSetupsTeardowns }) => {
      await commonSetupsTeardowns.completeTestTeardown();
    });

    test(
      "User logs in and out with suomi_fi",
      { tag: ["@mobile-iphone-data-set-0"] },
      async ({ appCommon, commonSetupsTeardowns }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();

        await log("User logs in with Suomi.fi");
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User logs out");
        await appCommon.userLogsOutMobile();
        await appCommon.userConfirmsLogOutMobile();
      }
    );

    test(
      "User can make free single booking and modifies it",
      { tag: ["@mobile-iphone-data-set-1"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, reservationLownav, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(V.CURRENT_ALWAYS_FREE_UNIT);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits();
        await appUser.userChecksTheReservationInfoIsRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksTheReservationInfoIsRightAfterSubmit();
        await topnav.navigateToMyBookingsMobile();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          V.CURRENT_ALWAYS_FREE_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );

        await log("User modifies reservation");
        await appUser.userModifiesBookingAndVerifiesTheChanges();
        await appUser.userChecksTheModifiedReservationInfoIsRightAndClicksContinue();

        await log("User cancels reservation");
        await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();
        await topnav.navigateToMyBookingsMobile();
        await appUser.userChecksCancelledBookingIsFoundMobile(
          V.CURRENT_ALWAYS_FREE_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T_MODIFIED
        );
        await appUser.userChecksBookingInfoInReservations(
          V.IN_RESERVATIONS_STATUS_CANCELED,
          V.SINGLEBOOKING_NO_PAYMENT,
          V.TIME_OF_QUICK_RESERVATION_MODIFIED
        );
      }
    );

    test(
      "User can make paid single booking",
      { tag: ["@mobile-iphone-data-set-2"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates paid reservation");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(V.CURRENT_ALWAYS_PAID_UNIT);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits();
        await appUser.userChecksThePaidReservationInfoIsRightAndSubmits();

        await log("User pays the reservation");
        await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking();
        await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout();

        await log("User verifies paid reservation in my bookings and paid status");
        await topnav.navigateToMyBookingsMobile();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await appUser.userChecksThePaidReservationInfoIsRightInReservations(
          V.MYBOOKINGS_STATUS_CONFIRMED,
          V.MYBOOKINGS_STATUS_PAID_CONFIRMED,
          V.SINGLEBOOKING_PAID_PRICE_VAT_INCL,
          V.TIME_OF_QUICK_RESERVATION,
          V.BOOKING_NUM_ONLY
        );

        await log("User cancels paid booking");
        await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();

        await log("User verifies cancellation and refund status");
        await topnav.navigateToMyBookingsMobile();
        await appUser.userChecksCancelledBookingIsFoundMobile(
          V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await appUser.userChecksThePaidReservationInfoIsRightInReservations(
          V.IN_RESERVATIONS_STATUS_CANCELED,
          V.MYBOOKINGS_STATUS_REFUNDED,
          V.SINGLEBOOKING_PAID_PRICE_VAT_INCL,
          V.TIME_OF_QUICK_RESERVATION,
          V.BOOKING_NUM_ONLY
        );
      }
    );

    test(
      "User can make paid single booking with interrupted checkout",
      { tag: ["@mobile-iphone-data-set-3"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(V.CURRENT_ALWAYS_PAID_UNIT);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits();
        await appUser.userChecksThePaidReservationInfoIsRightAndSubmits();

        await log("User pays the reservation");
        await appUser.userInterruptsPaidCheckout(V.URL_TEST);
        await appUser.userAcceptsPaymentToCheckout();
        await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking();
        await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout();

        await log("User verifies paid reservation in my bookings and paid status");
        await topnav.navigateToMyBookingsMobile();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await appUser.userChecksThePaidReservationInfoIsRightInReservations(
          V.MYBOOKINGS_STATUS_CONFIRMED,
          V.MYBOOKINGS_STATUS_PAID_CONFIRMED,
          V.SINGLEBOOKING_PAID_PRICE_VAT_INCL,
          V.TIME_OF_QUICK_RESERVATION,
          V.BOOKING_NUM_ONLY
        );

        await log("User cancels paid booking");
        await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();

        await log("User verifies cancelled booking is found");
        await topnav.navigateToMyBookingsMobile();
        await appUser.userChecksCancelledBookingIsFoundMobile(
          V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
      }
    );

    test(
      "User can make booking that requires handling",
      { tag: ["@mobile-iphone-data-set-4"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, reservationLownav, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates reservation that requires handling");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits();
        await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit();

        await log("User verifies reservation in my bookings and reservation status");
        await topnav.navigateToMyBookingsMobile();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await appUser.userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
          V.MYBOOKINGS_STATUS_PROCESSED,
          V.SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
          V.TIME_OF_QUICK_RESERVATION
        );
      }
    );

    test(
      "User can make subvented single booking that requires handling",
      { tag: ["@mobile-iphone-data-set-5"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates subvented reservation");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsSubventedBookingDetailsAsIndividualAndSubmits(V.JUSTIFICATION_FOR_SUBVENTION);
        await appUser.userChecksThePaidReservationThatRequiresHandlingInfoIsRightAndSubmits();

        await log("User verifies reservation in my bookings and reservation status");
        await topnav.navigateToMyBookingsMobile();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await appUser.userChecksBookingInfoInReservationsWithAllReservationInfo(
          V.MYBOOKINGS_STATUS_PROCESSED,
          V.SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
          V.TIME_OF_QUICK_RESERVATION
        );
      }
    );
  }
);
