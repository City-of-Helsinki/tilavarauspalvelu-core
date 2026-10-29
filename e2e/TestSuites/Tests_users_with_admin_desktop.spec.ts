/** Desktop browser tests */
import { V, log } from "../lib/robot";
import { test } from "./fixtures";
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
        topnav,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates subvented reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsSubventedBookingDetailsAsIndividualAndSubmits(V.JUSTIFICATION_FOR_SUBVENTION);
        await appUser.userChecksTheSubventedReservationInfoIsRightAndSubmits();
        await appUser.userChecksTheSubventedReservationInfoIsRightAfterSubmitting();
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await appUser.userChecksBookingInfoInReservationsWithAllReservationInfo(
          V.MYBOOKINGS_STATUS_PROCESSED,
          V.SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
          V.TIME_OF_QUICK_RESERVATION
        );

        await log("Formats info of subvented reservation to admin side");
        await dataModification.formatsReservationNumberAndNameForAdminSide();
        await dataModification.formatsTaglineForAdminSide(
          V.TIME_OF_QUICK_RESERVATION,
          V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION
        );
        await appCommon.userLogsOut();

        await log("Admin logs in and approves reservation");
        await appCommon.adminGoesToLandingPage();
        await appCommon.adminLogsInWithSuomiFi();
        await adminNavigationMenu.adminNavigatesToRequestedReservations();
        await adminReservations.adminSearchesReservationWithIdNumberAndClicksItFromName(
          V.BOOKING_NUM_ONLY,
          V.CURRENT_USER_FULLNAME
        );
        await appAdmin.adminChecksTheInfoAndSetsReservationFreeAndApprovesIt();
        await appAdmin.adminEditsReservationTime();
        await appCommon.adminLogsOut();

        await log("User logs in and verifies approved reservation");
        await appCommon.userGoesToLandingPage();
        await appCommon.userLogsInWithSuomiFi();
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION,
          V.ADMIN_MODIFIES_TIME_OF_INFO_CARD_MINUS_T
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
        topnav,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates reservation that requires handling");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING);
        await appUser.userReservesAFreeQuickReservationSlot();
        await appUser.userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits();
        await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightBeforeSubmit();
        await reservationLownav.clickSubmitButtonContinue();
        await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit();
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await appUser.userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
          V.MYBOOKINGS_STATUS_PROCESSED,
          V.SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
          V.TIME_OF_QUICK_RESERVATION
        );

        await log("Formats info of subvented reservation to admin side");
        await dataModification.formatsReservationNumberAndNameForAdminSide();
        await dataModification.formatsTaglineForAdminSide(
          V.TIME_OF_QUICK_RESERVATION,
          V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION
        );
        await appCommon.userLogsOut();

        await log("Admin logs in and rejects reservation");
        await appCommon.adminGoesToLandingPage();
        await appCommon.adminLogsInWithSuomiFi();
        await adminNavigationMenu.adminNavigatesToRequestedReservations();
        await adminReservations.adminSearchesReservationWithIdNumberAndClicksItFromName(
          V.BOOKING_NUM_ONLY,
          V.CURRENT_USER_FULLNAME
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
          V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
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
        topnav,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.userLogsInWithSuomiFi();

        await log("User creates reservation");
        await appUser.userNavigatesToSingleBookingPage();
        await appUser.userUsesSearchToFindRightUnit(V.CURRENT_UNIT_WITH_ACCESS_CODE);
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
          V.BOOKING_NUM_ONLY,
          V.CURRENT_USER_FULLNAME
        );

        await log("Changing access code");
        await appAdmin.adminOpensAccessCodeModal();
        await appAdmin.adminChecksAccessCodeMatches(V.ACCESS_CODE);
        await appAdmin.adminChangesAccessCode();
        await appAdmin.adminChecksAccessCodeDoesNotMatch(V.ACCESS_CODE);
        await appAdmin.adminSavesAccessCode();
        await appCommon.adminLogsOut();

        await log("User logs in and checks access code was changed");
        await appCommon.userGoesToLandingPage();
        await appCommon.userLogsInWithSuomiFi();
        await topnav.navigateToMyBookings();
        await appUser.userCanSeeUpcomingBookingInListAndClicksIt(
          V.CURRENT_UNIT_WITH_ACCESS_CODE_WITH_LOCATION,
          V.TIME_OF_QUICK_RESERVATION_MINUS_T
        );
        await appUser.userChecksBookingInfoInReservationsWithAccessCode(
          V.MYBOOKINGS_STATUS_CONFIRMED,
          V.SINGLEBOOKING_NO_PAYMENT,
          V.TIME_OF_QUICK_RESERVATION,
          V.ACCESS_CODE_ADMINSIDE
        );
      }
    );
  }
);
