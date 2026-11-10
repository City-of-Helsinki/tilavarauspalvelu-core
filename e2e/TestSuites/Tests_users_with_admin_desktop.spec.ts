/** Desktop browser tests */
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

    test(
      "User creates and Admin accepts single booking that requires handling",
      { tag: ["@combined-test-data-set-0", "@accept-booking"] },
      async ({
        adminNavigationMenu,
        adminReservations,
        appAdmin,
        appCommon,
        appUser,
        dataModification,
        session,
        state,
        testData,
      }) => {
        await appCommon.userLogsInWithSuomiFi();

        await test.step("User creates subvented reservation", async () => {
          await appUser.userFindsTheUnit(testData.units.alwaysPaidUnitSubvented);
          await appUser.userReservesAFreeQuickReservationSlot();
          await appUser.userFillsSubventedBookingDetailsAsIndividualAndSubmits(JUSTIFICATION_FOR_SUBVENTION);
          await appUser.userChecksTheSubventedReservationInfoIsRightAndSubmits();
          await appUser.userChecksTheSubventedReservationInfoIsRightAfterSubmitting();
          await appUser.userOpensTheBookingInMyBookings(
            testData.units.alwaysPaidUnitSubventedWithLocation,
            state.timeOfQuickReservationMinusT
          );
          await appUser.userChecksBookingInfoInReservationsWithAllReservationInfo(
            MYBOOKINGS_STATUS_PROCESSED,
            SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
            state.timeOfQuickReservation
          );
        });

        await test.step("Formats info of subvented reservation to admin side", async () => {
          await dataModification.formatsReservationNumberAndNameForAdminSide();
          await dataModification.formatsTaglineForAdminSide(
            state.timeOfQuickReservation,
            testData.units.alwaysPaidUnitSubventedWithLocation
          );
        });

        await test.step("Admin logs in and approves reservation", async () => {
          await appCommon.adminOpensOwnBrowserToLandingPage();
          await appCommon.adminLogsInWithSuomiFi();
          await adminNavigationMenu.adminNavigatesToRequestedReservations();
          await adminReservations.adminSearchesReservationWithIdNumberAndClicksItFromName(
            state.bookingNumOnly,
            testData.user.fullName
          );
          await appAdmin.adminChecksTheInfoAndSetsReservationFreeAndApprovesIt();
          await appAdmin.adminEditsReservationTime();
        });

        await test.step("User verifies approved reservation", async () => {
          await session.switchTo(state.pageUserSide);
          // A full page load, so the lists are fetched again
          await appCommon.userGoesToLandingPage();
          await appUser.userOpensTheBookingInMyBookings(
            testData.units.alwaysPaidUnitSubventedWithLocation,
            state.adminModifiesTimeOfInfoCardMinusT
          );
          await appUser.userVerifiesDetailsOfSubventedReservationAfterAdminApprovalWithoutPayment();
        });
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
        dataModification,
        reservationLownav,
        session,
        state,
        testData,
      }) => {
        await appCommon.userLogsInWithSuomiFi();

        await test.step("User creates reservation that requires handling", async () => {
          await appUser.userFindsTheUnit(testData.units.unitRequiresAlwaysHandling);
          await appUser.userReservesAFreeQuickReservationSlot();
          await appUser.userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits();
          await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightBeforeSubmit();
          await reservationLownav.clickSubmitButtonContinue();
          await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit();
          await appUser.userOpensTheBookingInMyBookings(
            testData.units.unitRequiresAlwaysHandlingWithLocation,
            state.timeOfQuickReservationMinusT
          );
          await appUser.userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
            MYBOOKINGS_STATUS_PROCESSED,
            SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
            state.timeOfQuickReservation
          );
        });

        await test.step("Formats info of reservation to admin side", async () => {
          await dataModification.formatsReservationNumberAndNameForAdminSide();
          await dataModification.formatsTaglineForAdminSide(
            state.timeOfQuickReservation,
            testData.units.unitRequiresAlwaysHandlingWithLocation
          );
        });

        await test.step("Admin logs in and rejects reservation", async () => {
          await appCommon.adminOpensOwnBrowserToLandingPage();
          await appCommon.adminLogsInWithSuomiFi();
          await adminNavigationMenu.adminNavigatesToRequestedReservations();
          await adminReservations.adminSearchesReservationWithIdNumberAndClicksItFromName(
            state.bookingNumOnly,
            testData.user.fullName
          );
          await appAdmin.adminChecksTheInfoAndCancelsReservation();
          await appAdmin.adminReturnsReservationToHandlingStateFromRejectedState();
          await appAdmin.adminRejectsReservationAndChecksTheStatus();
        });

        await test.step("User verifies rejected reservation", async () => {
          await session.switchTo(state.pageUserSide);
          // A full page load, so the lists are fetched again
          await appCommon.userGoesToLandingPage();
          await appUser.userOpensTheBookingInMyBookings(
            testData.units.unitRequiresAlwaysHandlingWithLocation,
            state.timeOfQuickReservationMinusT
          );
          await appUser.userChecksTheRejectedReservationInfoIsRightAfterAdminHandling();
        });
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
        reservationLownav,
        session,
        state,
        testData,
      }) => {
        await appCommon.userLogsInWithSuomiFi();

        await test.step("User creates reservation", async () => {
          await appUser.userFindsTheUnit(testData.units.unitWithAccessCode);
          await appUser.userReservesAFreeQuickReservationSlot();
          await appUser.userFillsBookingDetailsAsIndividualForReservationWithAccessCodeAndSubmits();
          await appUser.userChecksTheReservationInfoIsRightBeforeSubmitWithAccessCode();
          await reservationLownav.clickSubmitButtonContinue();
          await appUser.userChecksTheReservationInfoIsRightAfterSubmitWithAccessCode();
        });

        await test.step("Admin logs in and changes access code", async () => {
          await appCommon.adminOpensOwnBrowserToLandingPage();
          await appCommon.adminLogsInWithSuomiFi();
          await adminNavigationMenu.adminNavigatesToRequestedReservations();
          await adminReservations.adminSearchesReservationWithIdNumberAndClicksItFromName(
            state.bookingNumOnly,
            testData.user.fullName
          );
        });

        await test.step("Changing access code", async () => {
          await appAdmin.adminOpensAccessCodeModal();
          await appAdmin.adminChecksAccessCodeMatches(state.accessCode);
          await appAdmin.adminChangesAccessCode();
          await appAdmin.adminChecksAccessCodeDoesNotMatch(state.accessCode);
          await appAdmin.adminSavesAccessCode();
        });

        await test.step("User checks access code was changed", async () => {
          await session.switchTo(state.pageUserSide);
          // A full page load, so the lists are fetched again
          await appCommon.userGoesToLandingPage();
          await appUser.userOpensTheBookingInMyBookings(
            testData.units.unitWithAccessCodeWithLocation,
            state.timeOfQuickReservationMinusT
          );
          await appUser.userChecksBookingInfoInReservationsWithAccessCode(
            MYBOOKINGS_STATUS_CONFIRMED,
            SINGLEBOOKING_NO_PAYMENT,
            state.timeOfQuickReservation,
            state.accessCodeAdminside
          );
        });
      }
    );
  }
);
