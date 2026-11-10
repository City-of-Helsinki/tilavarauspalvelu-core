/** Iphone webkit tests */
import { test } from "./fixtures";
import {
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

    test("User logs in and out with suomi_fi", { tag: ["@mobile-iphone-data-set-0"] }, async ({ appCommon }) => {
      await test.step("User logs in with Suomi.fi", async () => {
        await appCommon.userLogsInWithSuomiFiMobile();
      });

      await test.step("User logs out", async () => {
        await appCommon.userLogsOutMobile();
        await appCommon.userConfirmsLogOutMobile();
      });
    });

    test(
      "User can make free single booking and modifies it",
      { tag: ["@mobile-iphone-data-set-1"] },
      async ({ appCommon, appUser, reservationLownav, state, testData, topnav }) => {
        await appCommon.userLogsInWithSuomiFiMobile();

        await test.step("User creates reservation", async () => {
          await appUser.userFindsTheUnitMobile(testData.units.alwaysFreeUnit);
          await appUser.userReservesAFreeQuickReservationSlot();
          await appUser.userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits();
          await appUser.userChecksTheReservationInfoIsRightBeforeSubmit();
          await reservationLownav.clickSubmitButtonContinue();
          await appUser.userChecksTheReservationInfoIsRightAfterSubmit();
          await appUser.userOpensTheBookingInMyBookingsMobile(
            testData.units.alwaysFreeUnitWithLocation,
            state.timeOfQuickReservationMinusT
          );
        });

        await test.step("User modifies reservation", async () => {
          await appUser.userModifiesBookingAndVerifiesTheChanges();
          await appUser.userChecksTheModifiedReservationInfoIsRightAndClicksContinue();
        });

        await test.step("User cancels reservation", async () => {
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
        });
      }
    );

    test(
      "User can make paid single booking",
      { tag: ["@mobile-iphone-data-set-2"] },
      async ({ appCommon, appUser, mybookings, state, testData, topnav }) => {
        await appCommon.userLogsInWithSuomiFiMobile();

        await test.step("User creates paid reservation", async () => {
          await appUser.userFindsTheUnitMobile(testData.units.alwaysPaidUnit);
          await appUser.userReservesAFreeQuickReservationSlot();
          await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits();
          await appUser.userChecksThePaidReservationInfoIsRightAndSubmits();
        });

        await test.step("User pays the reservation", async () => {
          await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking();
          await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout();
        });

        await test.step("User verifies paid reservation in my bookings and paid status", async () => {
          await appUser.userOpensTheBookingInMyBookingsMobile(
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
        });

        await test.step("User cancels paid booking", async () => {
          await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();
          await mybookings.waitForPaymentStatus(MYBOOKINGS_STATUS_REFUNDED);
        });

        await test.step("User verifies cancellation and refund status", async () => {
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
        });
      }
    );

    test(
      "User can make paid single booking with interrupted checkout",
      { tag: ["@mobile-iphone-data-set-3"] },
      async ({ appCommon, appUser, state, testData, topnav }) => {
        await appCommon.userLogsInWithSuomiFiMobile();

        await test.step("User creates reservation", async () => {
          await appUser.userFindsTheUnitMobile(testData.units.alwaysPaidUnit);
          await appUser.userReservesAFreeQuickReservationSlot();
          await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits();
          await appUser.userChecksThePaidReservationInfoIsRightAndSubmits();
        });

        await test.step("User pays the reservation", async () => {
          await appUser.userInterruptsPaidCheckout(URL_TEST);
          await appUser.userAcceptsPaymentToCheckout();
          await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking();
          await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout();
        });

        await test.step("User verifies paid reservation in my bookings and paid status", async () => {
          await appUser.userOpensTheBookingInMyBookingsMobile(
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
        });

        await test.step("User cancels paid booking", async () => {
          await appUser.userCancelBookingInReservationsAndChecksItGotCancelled();
        });

        await test.step("User verifies cancelled booking is found", async () => {
          await topnav.navigateToMyBookingsMobile();
          await appUser.userChecksCancelledBookingIsFoundMobile(
            testData.units.alwaysPaidUnitWithLocation,
            state.timeOfQuickReservationMinusT
          );
        });
      }
    );

    test(
      "User can make booking that requires handling",
      { tag: ["@mobile-iphone-data-set-4"] },
      async ({ appCommon, appUser, reservationLownav, state, testData }) => {
        await appCommon.userLogsInWithSuomiFiMobile();

        await test.step("User creates reservation that requires handling", async () => {
          await appUser.userFindsTheUnitMobile(testData.units.unitRequiresAlwaysHandling);
          await appUser.userReservesAFreeQuickReservationSlot();
          await appUser.userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits();
          await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightBeforeSubmit();
          await reservationLownav.clickSubmitButtonContinue();
          await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit();
        });

        await test.step("User verifies reservation in my bookings and reservation status", async () => {
          await appUser.userOpensTheBookingInMyBookingsMobile(
            testData.units.unitRequiresAlwaysHandlingWithLocation,
            state.timeOfQuickReservationMinusT
          );
          await appUser.userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
            MYBOOKINGS_STATUS_PROCESSED,
            SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
            state.timeOfQuickReservation
          );
        });
      }
    );

    test(
      "User can make subvented single booking that requires handling",
      { tag: ["@mobile-iphone-data-set-5"] },
      async ({ appCommon, appUser, state, testData }) => {
        await appCommon.userLogsInWithSuomiFiMobile();

        await test.step("User creates subvented reservation", async () => {
          await appUser.userFindsTheUnitMobile(testData.units.alwaysPaidUnitSubvented);
          await appUser.userReservesAFreeQuickReservationSlot();
          await appUser.userFillsSubventedBookingDetailsAsIndividualAndSubmits(JUSTIFICATION_FOR_SUBVENTION);
          await appUser.userChecksThePaidReservationThatRequiresHandlingInfoIsRightAndSubmits();
        });

        await test.step("User verifies reservation in my bookings and reservation status", async () => {
          await appUser.userOpensTheBookingInMyBookingsMobile(
            testData.units.alwaysPaidUnitSubventedWithLocation,
            state.timeOfQuickReservationMinusT
          );
          await appUser.userChecksBookingInfoInReservationsWithAllReservationInfo(
            MYBOOKINGS_STATUS_PROCESSED,
            SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
            state.timeOfQuickReservation
          );
        });
      }
    );
  }
);
