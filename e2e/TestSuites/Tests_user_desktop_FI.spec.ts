/** Desktop browser tests */
import { log } from "../lib/runtime";
import { test } from "./fixtures";
import {
  COOKIETEXT,
  IN_RESERVATIONS_STATUS_CANCELED,
  JUSTIFICATION_FOR_SUBVENTION,
  MYBOOKINGS_STATUS_CONFIRMED,
  MYBOOKINGS_STATUS_PAID_CONFIRMED,
  MYBOOKINGS_STATUS_PROCESSED,
  MYBOOKINGS_STATUS_REFUNDED,
  RECURRING_BOOKING_NAME,
  RECURRING_BOOKING_UNIT_COUNT_TEXT,
  SINGLEBOOKING_NO_PAYMENT,
  SINGLEBOOKING_PAID_PRICE_VAT_INCL,
  SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
  USER_LANDING_PAGE_H1_TEXT,
} from "./Resources/texts_FI";
import {
  DOWNLOAD_ICS_FILE,
  RECURRING_UNIT_KESKUSTA,
  RECURRING_UNIT_MALMI,
  UNIT_NAME_FOR_PICTURE_TEST,
  URL_TEST,
} from "./Resources/variables";

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
    test.beforeEach(async ({ appCommon }) => {
      await appCommon.userOpensDesktopBrowserToLandingPage();
    });

    test.afterEach(async ({ commonSetupsTeardowns }) => {
      await commonSetupsTeardowns.completeTestTeardown();
    });

    test(
      "User logs in and out with suomi_fi",
      { tag: ["@desktop-test-data-set-0", "@smoke"] },
      async ({ appCommon, commonSetupsTeardowns }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();

        await log("User logs in with Suomi.fi");
        await appCommon.userLogsInWithSuomiFi();

        await log("User logs out");
        await appCommon.userLogsOut();
        await appCommon.userConfirmsLogOut();
      }
    );

    test(
      "User can make free single booking and modifies it",
      { tag: ["@desktop-test-data-set-1"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, reservationLownav, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User navigates to reservation unit page");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysFreeUnit);

        await log("User checks that reservation unit picture is loaded");
        await appUser.userChecksThatReservationUnitPictureIsLoaded(UNIT_NAME_FOR_PICTURE_TEST);

        await log("User creates reservation");
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits();
        await appUser.userChecksTheReservationInfoIsRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksTheReservationInfoIsRightAfterSubmit();
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.alwaysFreeUnitWithLocation,
          state.timeOfQuickReservationMinusT
        );

        await log("User modifies reservation");
        await appUser.userModifiesBookingAndVerifiesTheChanges();
        await appUser.userChecksTheModifiedReservationInfoIsRightAndClicksContinue();

        await log("User cancels reservation");
        await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();
        await topnav.navigateToMyBookings();
        await appUser.userChecksCancelledBookingIsFound(
          testData.units.alwaysFreeUnitWithLocation,
          state.timeOfQuickReservationMinusTModified
        );
        await appUser.userChecksBookingInfoInReservations(
          IN_RESERVATIONS_STATUS_CANCELED,
          SINGLEBOOKING_NO_PAYMENT,
          state.timeOfQuickReservationModified
        );
      }
    );

    test(
      "User can create non-cancelable booking",
      { tag: ["@desktop-test-data-set-2"] },
      async ({
        appUser,
        commonSetupsTeardowns,
        login,
        popups,
        reservationLownav,
        state,
        testData,
        topnav,
        userLandingpage,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await topnav.clickLogin();
        await login.loginSuomiFi(testData.user.hetu);
        await userLandingpage.checkTheUserLandingPageH1(USER_LANDING_PAGE_H1_TEXT);
        await popups.userAcceptsCookiesIfDialogIsVisible(COOKIETEXT);

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.freeUnitNoCancel);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsNoncancelableBookingDetailsAsIndividualAndSubmits();
        await appUser.userChecksTheNoncancelableReservationInfoIsRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksTheNoncancelableReservationInfoIsRightAfterSubmit();

        await log("User checks reservation cannot be canceled");
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingNoncancelableBookingInListAndClicksIt(
          testData.units.freeUnitNoCancelWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userChecksBookingInfoInReservationsForNoncancelableBooking();
      }
    );

    test(
      "User can make paid single booking with interrupted checkout",
      { tag: ["@desktop-test-data-set-3"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysPaidUnit);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits();
        await appUser.userChecksThePaidReservationInfoIsRightAndSubmits();

        await log("User pays the reservation");
        await appUser.userInterruptsPaidCheckout(URL_TEST);
        await appUser.userAcceptsPaymentToCheckout();
        await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking();
        await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout();

        await log("User checks that paid reservation is found");
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.alwaysPaidUnitWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userChecksThePaidReservationInfoIsRightInReservations(
          MYBOOKINGS_STATUS_CONFIRMED,
          MYBOOKINGS_STATUS_PAID_CONFIRMED,
          SINGLEBOOKING_PAID_PRICE_VAT_INCL,
          state.timeOfQuickReservation,
          state.bookingNumOnly
        );

        await log("User cancel booking");
        await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();

        await log("User verifies cancelled booking is found");
        await topnav.navigateToMyBookings();
        await appUser.userChecksCancelledBookingIsFound(
          testData.units.alwaysPaidUnitWithLocation,
          state.timeOfQuickReservationMinusT
        );
      }
    );

    test(
      "User can make paid single booking",
      { tag: ["@desktop-test-data-set-4"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, mybookings, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates paid reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysPaidUnit);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits();
        await appUser.userChecksThePaidReservationInfoIsRightAndSubmits();

        await log("User pays the reservation");
        await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking();
        await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout();

        await log("User verifies paid reservation in my bookings and paid status");
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.alwaysPaidUnitWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userChecksThePaidReservationInfoIsRightInReservations(
          MYBOOKINGS_STATUS_CONFIRMED,
          MYBOOKINGS_STATUS_PAID_CONFIRMED,
          SINGLEBOOKING_PAID_PRICE_VAT_INCL,
          state.timeOfQuickReservation,
          state.bookingNumOnly
        );

        await log("User cancels paid booking");
        await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();
        await mybookings.waitForPaymentStatus(MYBOOKINGS_STATUS_REFUNDED);

        await log("User verifies cancellation and refund status");
        await topnav.navigateToMyBookings();
        await appUser.userChecksCancelledBookingIsFound(
          testData.units.alwaysPaidUnitWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userChecksThePaidReservationInfoIsRightInReservations(
          IN_RESERVATIONS_STATUS_CANCELED,
          MYBOOKINGS_STATUS_REFUNDED,
          SINGLEBOOKING_PAID_PRICE_VAT_INCL,
          state.timeOfQuickReservation,
          state.bookingNumOnly
        );
      }
    );

    test(
      "User can make subvented single booking that requires handling",
      { tag: ["@desktop-test-data-set-5"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates subvented reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysPaidUnitSubvented);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsSubventedBookingDetailsAsIndividualAndSubmits(JUSTIFICATION_FOR_SUBVENTION);
        await appUser.userChecksThePaidReservationThatRequiresHandlingInfoIsRightAndSubmits();

        await log("User verifies reservation requires handling");
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.alwaysPaidUnitSubventedWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userChecksBookingInfoInReservationsWithAllReservationInfo(
          MYBOOKINGS_STATUS_PROCESSED,
          SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
          state.timeOfQuickReservation
        );
      }
    );

    test(
      "User checks that reserved time is not available anymore",
      { tag: ["@desktop-test-data-set-7"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, reservationLownav, state, testData }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.unavailableUnit);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits();
        await appUser.userChecksTheReservationInfoIsRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksTheReservationInfoIsRightAfterSubmit();

        await log("User verifies reserved time is no longer available");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.unavailableUnit);
        await appUser.userChecksThatQuickReservationDoesNotHaveReservedTime(state.timeOfQuickReservationFreeSlot);
        await appUser.userChecksThatReservationCalendarDoesNotHaveReservedTimeSlotAvailable();
      }
    );

    test(
      "User checks that there are not current dates in the past bookings",
      { tag: ["@desktop-test-data-set-8"] },
      async ({ appCommon, commonSetupsTeardowns, mybookings, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User verifies past bookings contain only past dates");
        await topnav.navigateToMyBookings();
        await mybookings.navigateToPastBookings();
        await mybookings.validateReservationsAreNotForTodayOrLater();
      }
    );

    test(
      "User can make free single booking and check info from downloaded calendar file",
      { tag: ["@desktop-test-data-set-9"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, reservationLownav, testData }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysFreeUnit);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits();
        await appUser.userChecksTheReservationInfoIsRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksTheReservationInfoIsRightAfterSubmit();

        await log("User downloads and verifies calendar file");
        await appUser.userSavesFileAndFormatsBookingTimeToIcs(DOWNLOAD_ICS_FILE);
        await appUser.userChecksThatCalendarFileMatchesBookingTime();
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
      async ({ appCommon, appUser, commonSetupsTeardowns, mail, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates paid reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysPaidUnit);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits();
        await appUser.userChecksThePaidReservationInfoIsRightAndSubmits();

        await log("User pays the reservation");
        await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking();
        await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout();

        await log("User cancels paid booking");
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.alwaysPaidUnitWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();

        await log("Verifying reservation confirmation and cancellation emails");
        // Format reservation times for email verification
        await mail.formatReservationTimeForEmailTextsAndReceipts(state.timeOfQuickReservationMinusT);
        await mail.verifyReservationConfirmationEmail(state.bookingNumOnly);
        await mail.verifyReservationCancellationEmail(state.bookingNumOnly);
      }
    );

    test(
      "User makes recurring reservation",
      { tag: ["@desktop-test-data-set-11"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, recurring, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await appUser.userNavigatesToRecurringBookingPage();

        await log("User selects a recurring booking and units");
        await recurring.userSelectsARecurringBookingRound(RECURRING_BOOKING_NAME);
        await recurring.userSelectsTheUnitsForRecurringReservation(RECURRING_UNIT_MALMI);
        await recurring.userSelectsTheUnitsForRecurringReservation(RECURRING_UNIT_KESKUSTA);
        await recurring.userChecksTheCountOfSelectedUnits(RECURRING_BOOKING_UNIT_COUNT_TEXT);
        await recurring.userClicksContinueButton();

        await log("User fills the reservation info for recurring reservation");
        await appUser.userFillsInTheApplicationDetailsForRecurringApplication();
        await appUser.userSelectsTimesForRecurringApplication();
        await appUser.userFillsInTheApplicationUserInfoDetails();
        await appUser.userAcceptsTermsOfUseAndClicksSubmit();

        await log("User verifies application was sent");
        await appUser.userChecksTheSentPage();

        await log("User cancels the recurring reservation");
        await topnav.navigateToMyApplications();
        await appUser.userChecksTheRecurringReservationIsSentStateAndCancelsIt();
        await appCommon.reloadPage();
        await appUser.userVerifiesTheRecurringReservationIsCancelled();
      }
    );
  }
);
