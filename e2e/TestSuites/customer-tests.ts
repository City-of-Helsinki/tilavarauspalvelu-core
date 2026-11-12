/**
 * The customer tests, written once for the desktop, Android and iPhone projects. Each project's small spec file calls
 * `customerTests` with its own title, so the report groups the tests by device. playwright.config.ts picks a project's
 * tests by tag: the desktop runs all but `@phone-only`, the phones run `@also-on-phones` and `@phone-only`. The
 * project's platform picks the user of a `@user-data-set-N` tag and the unit copies (TestSuites/test-data.ts).
 */
import type { Booking } from "./booking";
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
  SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
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

export function customerTests(title: string, device: string): void {
  test.describe(
    title,
    {
      annotation: [
        { type: "Documentation", description: `Customer tests on ${device}` },
        {
          type: "Suite Setup",
          description: "Run Only Once    create_data.Create Robot Test Data (the create_data setup project)",
        },
      ],
    },
    () => {
      test.beforeEach(async ({ appCommon }) => {
        await appCommon.userOpensBrowserToLandingPage();
      });

      test(
        "User logs in and out with suomi_fi",
        { tag: ["@user-data-set-0", "@smoke", "@also-on-phones"] },
        async ({ appCommon }) => {
          await test.step("User logs in with Suomi.fi", async () => {
            await appCommon.userLogsInWithSuomiFi();
          });

          await test.step("User logs out", async () => {
            await appCommon.userLogsOut();
            await appCommon.userConfirmsLogOut();
          });
        }
      );

      test(
        "User can make free single booking and modifies it",
        { tag: ["@user-data-set-1", "@also-on-phones"] },
        async ({ appCommon, appUser, reservationLownav, testData, topnav }) => {
          await appCommon.userLogsInWithSuomiFi();

          await test.step("User navigates to reservation unit page", async () => {
            await appUser.userFindsTheUnit(testData.units.alwaysFreeUnit);
          });

          await test.step("User checks that reservation unit picture is loaded", async () => {
            await appUser.userChecksThatReservationUnitPictureIsLoaded(UNIT_NAME_FOR_PICTURE_TEST);
          });

          let booking: Booking;
          await test.step("User creates reservation", async () => {
            booking = await appUser.userReservesAFreeQuickReservationSlot();
            await appUser.userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits(booking);
            await appUser.userChecksTheReservationInfoIsRightBeforeSubmit();
            await reservationLownav.clickSubmitButtonContinue();
            await appUser.userChecksTheReservationInfoIsRightAfterSubmit(booking);
            await appUser.userOpensTheBookingInMyBookings(testData.units.alwaysFreeUnitWithLocation, booking.listTime);
          });

          let modified: Booking;
          await test.step("User modifies reservation", async () => {
            modified = await appUser.userModifiesBookingAndVerifiesTheChanges(booking);
            await appUser.userChecksTheModifiedReservationInfoIsRightAndClicksContinue(modified);
          });

          await test.step("User cancels reservation", async () => {
            await appUser.userCancelBookingInReservationsAndChecksItGotCancelled(modified);
            await topnav.navigateToMyBookings();
            await appUser.userChecksCancelledBookingIsFound(
              testData.units.alwaysFreeUnitWithLocation,
              modified.listTime
            );
            await appUser.userChecksBookingInfoInReservations(
              modified,
              IN_RESERVATIONS_STATUS_CANCELED,
              SINGLEBOOKING_NO_PAYMENT
            );
          });
        }
      );

      test(
        "User can create non-cancelable booking",
        { tag: ["@user-data-set-2"] },
        async ({ appUser, login, popups, reservationLownav, testData, topnav, userLandingpage }) => {
          await topnav.clickLogin();
          await login.loginSuomiFi(testData.user.hetu);
          await userLandingpage.checkTheUserLandingPageH1(USER_LANDING_PAGE_H1_TEXT);
          await popups.userAcceptsCookiesIfDialogIsVisible(COOKIETEXT);

          let booking: Booking;
          await test.step("User creates reservation", async () => {
            await appUser.userFindsTheUnit(testData.units.freeUnitNoCancel);
            booking = await appUser.userReservesAFreeQuickReservationSlot();
            await appUser.userFillsNoncancelableBookingDetailsAsIndividualAndSubmits(booking);
            await appUser.userChecksTheNoncancelableReservationInfoIsRightBeforeSubmit();
            await reservationLownav.clickSubmitButtonContinue();
            await appUser.userChecksTheNoncancelableReservationInfoIsRightAfterSubmit(booking);
          });

          await test.step("User checks reservation cannot be canceled", async () => {
            await topnav.navigateToMyBookings();
            await appUser.userCanSeeUpcomingNoncancelableBookingInListAndClicksIt(
              testData.units.freeUnitNoCancelWithLocation,
              booking.listTime
            );
            await appUser.userChecksBookingInfoInReservationsForNoncancelableBooking(booking);
          });
        }
      );

      test(
        "User can make paid single booking with interrupted checkout",
        { tag: ["@user-data-set-3", "@also-on-phones"] },
        async ({ appCommon, appUser, popups, testData, topnav }) => {
          await appCommon.userLogsInWithSuomiFi();

          let booking: Booking;
          await test.step("User creates reservation", async () => {
            await appUser.userFindsTheUnit(testData.units.alwaysPaidUnit);
            booking = await appUser.userReservesAFreeQuickReservationSlot();
            await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits(booking);
            await appUser.userChecksThePaidReservationInfoIsRightAndSubmits(booking);
          });

          await test.step("User pays the reservation", async () => {
            await appUser.userInterruptsPaidCheckout(URL_TEST);
            await appUser.userAcceptsPaymentToCheckout();
            await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking(booking);
            await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout(booking);
          });

          await test.step("User checks that paid reservation is found", async () => {
            await popups.userAcceptsCookiesIfDialogIsVisible(COOKIETEXT);
            await appUser.userOpensTheBookingInMyBookings(testData.units.alwaysPaidUnitWithLocation, booking.listTime);
            await appUser.userChecksThePaidReservationInfoIsRightInReservations(
              booking,
              MYBOOKINGS_STATUS_CONFIRMED,
              MYBOOKINGS_STATUS_PAID_CONFIRMED,
              SINGLEBOOKING_PAID_PRICE_VAT_INCL
            );
          });

          await test.step("User cancel booking", async () => {
            await appUser.userCancelBookingInReservationsAndChecksItGotCancelled(booking);
          });

          await test.step("User verifies cancelled booking is found", async () => {
            await topnav.navigateToMyBookings();
            await appUser.userChecksCancelledBookingIsFound(
              testData.units.alwaysPaidUnitWithLocation,
              booking.listTime
            );
          });
        }
      );

      test(
        "User can make paid single booking",
        { tag: ["@user-data-set-4", "@also-on-phones"] },
        async ({ appCommon, appUser, mybookings, popups, testData, topnav }) => {
          await appCommon.userLogsInWithSuomiFi();

          let booking: Booking;
          await test.step("User creates paid reservation", async () => {
            await appUser.userFindsTheUnit(testData.units.alwaysPaidUnit);
            booking = await appUser.userReservesAFreeQuickReservationSlot();
            await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits(booking);
            await appUser.userChecksThePaidReservationInfoIsRightAndSubmits(booking);
          });

          await test.step("User pays the reservation", async () => {
            await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking(booking);
            await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout(booking);
          });

          await test.step("User verifies paid reservation in my bookings and paid status", async () => {
            await popups.userAcceptsCookiesIfDialogIsVisible(COOKIETEXT);
            await appUser.userOpensTheBookingInMyBookings(testData.units.alwaysPaidUnitWithLocation, booking.listTime);
            await appUser.userChecksThePaidReservationInfoIsRightInReservations(
              booking,
              MYBOOKINGS_STATUS_CONFIRMED,
              MYBOOKINGS_STATUS_PAID_CONFIRMED,
              SINGLEBOOKING_PAID_PRICE_VAT_INCL
            );
          });

          await test.step("User cancels paid booking", async () => {
            await appUser.userCancelBookingInReservationsAndChecksItGotCancelled(booking);
            await mybookings.waitForPaymentStatus(MYBOOKINGS_STATUS_REFUNDED);
          });

          await test.step("User verifies cancellation and refund status", async () => {
            await topnav.navigateToMyBookings();
            await appUser.userChecksCancelledBookingIsFound(
              testData.units.alwaysPaidUnitWithLocation,
              booking.listTime
            );
            await appUser.userChecksThePaidReservationInfoIsRightInReservations(
              booking,
              IN_RESERVATIONS_STATUS_CANCELED,
              MYBOOKINGS_STATUS_REFUNDED,
              SINGLEBOOKING_PAID_PRICE_VAT_INCL
            );
          });
        }
      );

      test(
        "User can make subvented single booking that requires handling",
        { tag: ["@user-data-set-5", "@also-on-phones"] },
        async ({ appCommon, appUser, testData }) => {
          await appCommon.userLogsInWithSuomiFi();

          let booking: Booking;
          await test.step("User creates subvented reservation", async () => {
            await appUser.userFindsTheUnit(testData.units.alwaysPaidUnitSubvented);
            booking = await appUser.userReservesAFreeQuickReservationSlot();
            await appUser.userFillsSubventedBookingDetailsAsIndividualAndSubmits(booking, JUSTIFICATION_FOR_SUBVENTION);
            await appUser.userChecksThePaidReservationThatRequiresHandlingInfoIsRightAndSubmits(booking);
          });

          await test.step("User verifies reservation requires handling", async () => {
            await appUser.userOpensTheBookingInMyBookings(
              testData.units.alwaysPaidUnitSubventedWithLocation,
              booking.listTime
            );
            await appUser.userChecksBookingInfoInReservationsWithAllReservationInfo(
              booking,
              MYBOOKINGS_STATUS_PROCESSED,
              SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
            );
          });
        }
      );

      test(
        "User can make booking that requires handling",
        { tag: ["@user-data-set-6", "@phone-only"] },
        async ({ appCommon, appUser, reservationLownav, testData }) => {
          await appCommon.userLogsInWithSuomiFi();

          let booking: Booking;
          await test.step("User creates reservation that requires handling", async () => {
            await appUser.userFindsTheUnit(testData.units.unitRequiresAlwaysHandling);
            booking = await appUser.userReservesAFreeQuickReservationSlot();
            await appUser.userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits(booking);
            await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightBeforeSubmit();
            await reservationLownav.clickSubmitButtonContinue();
            await appUser.userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit(booking);
          });

          await test.step("User verifies reservation in my bookings and reservation status", async () => {
            await appUser.userOpensTheBookingInMyBookings(
              testData.units.unitRequiresAlwaysHandlingWithLocation,
              booking.listTime
            );
            await appUser.userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
              booking,
              MYBOOKINGS_STATUS_PROCESSED,
              SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
            );
          });
        }
      );

      test(
        "User checks that reserved time is not available anymore",
        { tag: ["@user-data-set-7"] },
        async ({ appCommon, appUser, reservationLownav, testData }) => {
          await appCommon.userLogsInWithSuomiFi();

          let booking: Booking;
          await test.step("User creates reservation", async () => {
            await appUser.userFindsTheUnit(testData.units.unavailableUnit);
            booking = await appUser.userReservesAFreeQuickReservationSlot();
            await appUser.userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits(booking);
            await appUser.userChecksTheReservationInfoIsRightBeforeSubmit();
            await reservationLownav.clickSubmitButtonContinue();
            await appUser.userChecksTheReservationInfoIsRightAfterSubmit(booking);
          });

          await test.step("User verifies reserved time is no longer available", async () => {
            await appUser.userFindsTheUnit(testData.units.unavailableUnit);
            await appUser.userChecksThatQuickReservationDoesNotHaveReservedTime(booking.slot);
            await appUser.userChecksThatReservationCalendarDoesNotHaveReservedTimeSlotAvailable(booking);
          });
        }
      );

      test(
        "User checks that there are not current dates in the past bookings",
        { tag: ["@user-data-set-8"] },
        async ({ appCommon, mybookings, topnav }) => {
          await appCommon.userLogsInWithSuomiFi();

          await test.step("User verifies past bookings contain only past dates", async () => {
            await topnav.navigateToMyBookings();
            await mybookings.navigateToPastBookings();
            await mybookings.validateReservationsAreNotForTodayOrLater();
          });
        }
      );

      test(
        "User can make free single booking and check info from downloaded calendar file",
        { tag: ["@user-data-set-9"] },
        async ({ appCommon, appUser, reservationLownav, testData }) => {
          await appCommon.userLogsInWithSuomiFi();

          let booking: Booking;
          await test.step("User creates reservation", async () => {
            await appUser.userFindsTheUnit(testData.units.alwaysFreeUnit);
            booking = await appUser.userReservesAFreeQuickReservationSlot();
            await appUser.userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits(booking);
            await appUser.userChecksTheReservationInfoIsRightBeforeSubmit();
            await reservationLownav.clickSubmitButtonContinue();
            await appUser.userChecksTheReservationInfoIsRightAfterSubmit(booking);
          });

          await test.step("User downloads and verifies calendar file", async () => {
            await appUser.userSavesFileAndFormatsBookingTimeToIcs(booking, DOWNLOAD_ICS_FILE);
            await appUser.userChecksThatCalendarFileMatchesBookingTime();
          });
        }
      );

      test(
        "Check emails from reservations",
        {
          tag: ["@user-data-set-10"],
          annotation: {
            type: "Documentation",
            description:
              "Makes a paid booking, pays it and cancels it, then verifies the reservation confirmation and cancellation\nemails of that booking.",
          },
        },
        async ({ appCommon, appUser, mail, testData }) => {
          await appCommon.userLogsInWithSuomiFi();

          let booking: Booking;
          await test.step("User creates paid reservation", async () => {
            await appUser.userFindsTheUnit(testData.units.alwaysPaidUnit);
            booking = await appUser.userReservesAFreeQuickReservationSlot();
            await appUser.userFillsTheReservationInfoForUnitWithPaymentAndSubmits(booking);
            await appUser.userChecksThePaidReservationInfoIsRightAndSubmits(booking);
          });

          await test.step("User pays the reservation", async () => {
            await appUser.userChecksInfoInPaidCheckoutAndConfirmsBooking(booking);
            await appUser.userChecksThePaidReservationInfoIsRightAfterCheckout(booking);
          });

          await test.step("User cancels paid booking", async () => {
            await appUser.userOpensTheBookingInMyBookings(testData.units.alwaysPaidUnitWithLocation, booking.listTime);
            await appUser.userCancelBookingInReservationsAndChecksItGotCancelled(booking);
          });

          await test.step("Verifying reservation confirmation and cancellation emails", async () => {
            // Format reservation times for email verification
            await mail.formatReservationTimeForEmailTextsAndReceipts(booking.listTime);
            await mail.verifyReservationConfirmationEmail(booking.number);
            await mail.verifyReservationCancellationEmail(booking.number);
          });
        }
      );

      test(
        "User makes recurring reservation",
        { tag: ["@user-data-set-11"] },
        async ({ appCommon, appUser, recurring, topnav }) => {
          await appCommon.userLogsInWithSuomiFi();
          await appUser.userCancelsLeftoverApplications();

          await appUser.userNavigatesToRecurringBookingPage();

          await test.step("User selects a recurring booking and units", async () => {
            await recurring.userSelectsARecurringBookingRound(RECURRING_BOOKING_NAME);
            await recurring.userSelectsTheUnitsForRecurringReservation(RECURRING_UNIT_MALMI);
            await recurring.userSelectsTheUnitsForRecurringReservation(RECURRING_UNIT_KESKUSTA);
            await recurring.userChecksTheCountOfSelectedUnits(RECURRING_BOOKING_UNIT_COUNT_TEXT);
            await recurring.userClicksContinueButton();
          });

          await test.step("User fills the reservation info for recurring reservation", async () => {
            await appUser.userFillsInTheApplicationDetailsForRecurringApplication();
            await appUser.userSelectsTimesForRecurringApplication();
            await appUser.userFillsInTheApplicationUserInfoDetails();
            await appUser.userAcceptsTermsOfUseAndClicksSubmit();
          });

          await test.step("User verifies application was sent", async () => {
            await appUser.userChecksTheSentPage();
          });

          await test.step("User cancels the recurring reservation", async () => {
            await topnav.navigateToMyApplications();
            await appUser.userChecksTheRecurringReservationIsSentStateAndCancelsIt();
            await appCommon.reloadPage();
            await appUser.userVerifiesTheRecurringReservationIsCancelled();
          });
        }
      );
    }
  );
}
