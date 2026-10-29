/** Android chrome tests */
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
  SINGLEBOOKING_NO_PAYMENT,
  SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
  SINGLEBOOKING_PAID_PRICE_VAT_INCL,
  SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
} from "./Resources/texts_FI";
import { URL_TEST } from "./Resources/variables";

test.describe(
  "Tests user mobile android FI",
  {
    tag: ["@android-suite"],
    annotation: [
      { type: "Documentation", description: "Android chrome tests" },
      {
        type: "Suite Setup",
        description: "Run Only Once    create_data.Create Robot Test Data (the create_data setup project)",
      },
    ],
  },
  () => {
    test.beforeEach(async ({ appCommon }) => {
      await appCommon.userOpensAndroidChromeToLandingPage();
    });

    test.afterEach(async ({ commonSetupsTeardowns }) => {
      await commonSetupsTeardowns.completeTestTeardown();
    });

    test(
      "User logs in and out with suomi_fi mobile",
      { tag: ["@mobile-android-data-set-0"] },
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
      "User can make a free single booking and modifies it mobile",
      { tag: ["@mobile-android-data-set-1"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, reservationLownav, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysFreeUnit);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits();
        await appUser.userChecksTheReservationInfoIsRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksTheReservationInfoIsRightAfterSubmit();
        await topnav.navigateToMyBookingsMobile();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.alwaysFreeUnitWithLocation,
          state.timeOfQuickReservationMinusT
        );

        await log("User modifies reservation");
        await appUser.userModifiesBookingAndVerifiesTheChanges();
        await appUser.userChecksTheModifiedReservationInfoIsRightAndClicksContinue();

        await log("User cancels reservation");
        await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();
        await topnav.navigateToMyBookingsMobile();
        await appUser.userChecksCancelledBookingIsFoundMobile(
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
      "User can make paid single booking mobile",
      { tag: ["@mobile-android-data-set-2"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, popups, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates paid reservation");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysPaidUnit);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits();
        await appUser.userChecksThePaidReservationInfoIsRightAndSubmits();

        await log("User pays the reservation");
        await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking();
        await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout();

        await log("User verifies paid reservation in my bookings and paid status");
        await topnav.navigateToMyBookingsMobile();
        await popups.userAcceptsCookiesIfDialogIsVisible(COOKIETEXT);
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

        await log("User verifies cancellation and refund status");
        await topnav.navigateToMyBookingsMobile();
        await appUser.userChecksCancelledBookingIsFoundMobile(
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
      "User can make paid single booking with interrupted checkout mobile",
      { tag: ["@mobile-android-data-set-3"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, popups, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysPaidUnit);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits();
        await appUser.userChecksThePaidReservationInfoIsRightAndSubmits();

        await log("User pays the reservation");
        await appUser.userInterruptsPaidCheckout(URL_TEST);
        await appUser.userAcceptsPaymentToCheckout();
        await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking();
        await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout();

        await log("User verifies paid reservation in my bookings and paid status");
        await topnav.navigateToMyBookingsMobile();
        await popups.userAcceptsCookiesIfDialogIsVisible(COOKIETEXT);
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

        await log("User verifies cancelled booking is found");
        await topnav.navigateToMyBookingsMobile();
        await appUser.userChecksCancelledBookingIsFoundMobile(
          testData.units.alwaysPaidUnitWithLocation,
          state.timeOfQuickReservationMinusT
        );
      }
    );

    test(
      "User can make single booking that requires handling mobile",
      { tag: ["@mobile-android-data-set-4"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, reservationLownav, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates reservation that requires handling");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(testData.units.unitRequiresAlwaysHandling);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits();
        await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit();

        await log("User verifies reservation in my bookings and reservation status");
        await topnav.navigateToMyBookingsMobile();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.unitRequiresAlwaysHandlingWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
          MYBOOKINGS_STATUS_PROCESSED,
          SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
          state.timeOfQuickReservation
        );
      }
    );

    test(
      "User can make subvented single booking that requires handling mobile",
      { tag: ["@mobile-android-data-set-5"] },
      async ({ appCommon, appUser, commonSetupsTeardowns, state, testData, topnav }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFiMobile();

        await log("User creates subvented reservation");
        await appUser.userNavigatesToSingleBookingPageMobile();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysPaidUnitSubvented);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsSubventedBookingDetailsAsIndividualAndSubmits(JUSTIFICATION_FOR_SUBVENTION);
        await appUser.userChecksThePaidReservationThatRequiresHandlingInfoIsRightAndSubmits();

        await log("User verifies reservation in my bookings and reservation status");
        await topnav.navigateToMyBookingsMobile();
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
  }
);
