/** Desktop browser tests */
import { log } from "../lib/runtime";
import { test } from "./fixtures";
import {
  JUSTIFICATION_FOR_SUBVENTION,
  MYBOOKINGS_STATUS_CONFIRMED,
  MYBOOKINGS_STATUS_PROCESSED,
  SINGLEBOOKING_NO_PAYMENT,
  SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
  SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
} from "./Resources/texts_FI";

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
    test.beforeEach(async ({ appCommon }) => {
      await appCommon.userOpensDesktopBrowserToLandingPage();
    });

    test.afterEach(async ({ commonSetupsTeardowns }) => {
      await commonSetupsTeardowns.completeTestTeardown();
    });

    test(
      "User creates and Admin accepts single booking that requires handling",
      { tag: ["@combined-test-data-set-0", "@accept-booking"] },
      async ({
        adminNavigationMenu,
        adminReservations,
        appAdmin,
        appCommon,
        appUser,
        commonSetupsTeardowns,
        dataModification,
        state,
        testData,
        topnav,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates subvented reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.alwaysPaidUnitSubvented);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsSubventedBookingDetailsAsIndividualAndSubmits(JUSTIFICATION_FOR_SUBVENTION);
        await appUser.userChecksTheSubventedReservationInfoIsRightAndSubmits();
        await appUser.userChecksTheSubventedReservationInfoIsRightAfterSubmitting();
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

        await log("Formats info of subvented reservation to admin side");
        await dataModification.formatsReservationNumberAndNameForAdminSide();
        await dataModification.formatsTaglineForAdminSide(
          state.timeOfQuickReservation,
          testData.units.alwaysPaidUnitSubventedWithLocation
        );
        await appCommon.userLogsOut();

        await log("Admin logs in and approves reservation");
        await appCommon.adminGoesToLandingPage();
        await appCommon.adminLogsInWithSuomiFi();
        await adminNavigationMenu.adminNavigatesToRequestedReservations();
        await adminReservations.adminSearchesReservationWithIdNumberAndClicksItFromName(
          state.bookingNumOnly,
          testData.user.fullName
        );
        await appAdmin.adminChecksTheInfoAndSetsReservationFreeAndApprovesIt();
        await appAdmin.adminEditsReservationTime();
        await appCommon.adminLogsOut();

        await log("User logs in and verifies approved reservation");
        await appCommon.userGoesToLandingPage();
        await appCommon.userLogsInWithSuomiFi();
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.alwaysPaidUnitSubventedWithLocation,
          state.adminModifiesTimeOfInfoCardMinusT
        );
        await appUser.userVerifiesDetailsOfSubventedReservationAfterAdminApprovalWithoutPayment();
      }
    );

    test(
      "User creates and Admin declines single booking that requires handling",
      { tag: ["@combined-test-data-set-1", "@decline-booking"] },
      async ({
        adminNavigationMenu,
        adminReservations,
        appAdmin,
        appCommon,
        appUser,
        commonSetupsTeardowns,
        dataModification,
        reservationLownav,
        state,
        testData,
        topnav,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates reservation that requires handling");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.unitRequiresAlwaysHandling);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits();
        await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit();
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.unitRequiresAlwaysHandlingWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
          MYBOOKINGS_STATUS_PROCESSED,
          SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
          state.timeOfQuickReservation
        );

        await log("Formats info of subvented reservation to admin side");
        await dataModification.formatsReservationNumberAndNameForAdminSide();
        await dataModification.formatsTaglineForAdminSide(
          state.timeOfQuickReservation,
          testData.units.unitRequiresAlwaysHandlingWithLocation
        );
        await appCommon.userLogsOut();

        await log("Admin logs in and rejects reservation");
        await appCommon.adminGoesToLandingPage();
        await appCommon.adminLogsInWithSuomiFi();
        await adminNavigationMenu.adminNavigatesToRequestedReservations();
        await adminReservations.adminSearchesReservationWithIdNumberAndClicksItFromName(
          state.bookingNumOnly,
          testData.user.fullName
        );
        await appAdmin.adminChecksTheInfoAndCancelsReservation();
        await appAdmin.adminReturnsReservationToHandlingStateFromRejectedState();
        await appAdmin.adminRejectsReservationAndChecksTheStatus();
        await appCommon.adminLogsOut();

        await log("User logs in and verifies rejected reservation");
        await appCommon.userGoesToLandingPage();
        await appCommon.userLogsInWithSuomiFi();
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.unitRequiresAlwaysHandlingWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userChecksTheRejectedReservationInfoIsRightAfterAdminHandling();
      }
    );

    test(
      "User can make reservation with access code and admin changes the code",
      { tag: ["@combined-test-data-set-2", "@access-code"] },
      async ({
        adminNavigationMenu,
        adminReservations,
        appAdmin,
        appCommon,
        appUser,
        commonSetupsTeardowns,
        reservationLownav,
        state,
        testData,
        topnav,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(testData.units.unitWithAccessCode);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsBookingDetailsAsIndividualForReservationWithAccessCodeAndSubmits();
        await appUser.userChecksTheReservationInfoIsRightBeforeSubmitWithAccessCode();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksTheReservationInfoIsRightAfterSubmitWithAccessCode();
        await appCommon.userLogsOut();

        await log("Admin logs in and changes access code");
        await appCommon.adminGoesToLandingPage();
        await appCommon.adminLogsInWithSuomiFi();
        await adminNavigationMenu.adminNavigatesToRequestedReservations();
        await adminReservations.adminSearchesReservationWithIdNumberAndClicksItFromName(
          state.bookingNumOnly,
          testData.user.fullName
        );

        await log("Changing access code");
        await appAdmin.adminOpensAccessCodeModal();
        await appAdmin.adminChecksAccessCodeMatches(state.accessCode);
        await appAdmin.adminChangesAccessCode();
        await appAdmin.adminChecksAccessCodeDoesNotMatch(state.accessCode);
        await appAdmin.adminSavesAccessCode();
        await appCommon.adminLogsOut();

        await log("User logs in and checks access code was changed");
        await appCommon.userGoesToLandingPage();
        await appCommon.userLogsInWithSuomiFi();
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          testData.units.unitWithAccessCodeWithLocation,
          state.timeOfQuickReservationMinusT
        );
        await appUser.userChecksBookingInfoInReservationsWithAccessCode(
          MYBOOKINGS_STATUS_CONFIRMED,
          SINGLEBOOKING_NO_PAYMENT,
          state.timeOfQuickReservation,
          state.accessCodeAdminside
        );
      }
    );
  }
);
