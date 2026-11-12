import { test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { acquireLock, releaseLock } from "../../../lib/locks";
import { retry } from "../../../lib/retry";
import { step, expect, log } from "../../../lib/runtime";
import { Booking } from "../../booking";
import { PageObject } from "../../page-object";
import {
  AGEGROUP_OF_PERSONS,
  ALWAYS_REQUESTED_UNIT_PAID_PRICE_VAT_INCL,
  EMPTY_STATE_MESSAGE_RECURRING_APPLICATIONS,
  HOME_CITY,
  IN_RESERVATIONS_STATUS_CANCELED,
  MYBOOKINGS_FI,
  MYBOOKINGS_STATUS_CANCELED,
  MYBOOKINGS_STATUS_CONFIRMED,
  MYBOOKINGS_STATUS_REJECTED,
  PURPOSE_OF_THE_BOOKING,
  REASON_FOR_CANCELLATION,
  RECURRING_BOOKING_ADDITIONAL_INFO,
  RECURRING_BOOKING_AGE_GROUP_TEXT,
  RECURRING_BOOKING_CITY,
  RECURRING_BOOKING_EMAIL,
  RECURRING_BOOKING_FIRST_NAME,
  RECURRING_BOOKING_LAST_NAME,
  RECURRING_BOOKING_MAX_LENGTH_TEXT,
  RECURRING_BOOKING_MIN_LENGTH_TEXT,
  RECURRING_BOOKING_NAME,
  RECURRING_BOOKING_PHONE_NUMBER,
  RECURRING_BOOKING_POST_CODE,
  RECURRING_BOOKING_PURPOSE_TEXT,
  RECURRING_BOOKING_RESERVATION_PER_WEEK,
  RECURRING_BOOKING_SIZE_OF_GROUP,
  RECURRING_BOOKING_STREET_ADDRESS,
  RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_PRIMARY,
  RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_SECONDARY,
  RECURRING_BOOKING_UNIT_NAME_KESKUSTA,
  RECURRING_BOOKING_UNIT_NAME_MALMI,
  RESERVATION_STATUS_MSG_FI,
  RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI,
  SINGLEBOOKING_DESCRIPTION,
  SINGLEBOOKING_NAME,
  SINGLEBOOKING_NO_PAYMENT,
  SINGLEBOOKING_NUMBER_OF_PERSONS,
  SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
  SINGLEBOOKING_PAID_PRICE_VAT_INCL,
  SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL,
  USER_LANDING_PAGE_H1_TEXT,
} from "../../Resources/texts_FI";
import {
  QUICK_RESERVATION_DURATION,
  RECURRING_THU_09_11_SECONDARY,
  RECURRING_THU_19_21_PRIMARY,
  RESERVATION_INDIVIDUAL,
} from "../../Resources/variables";

/** The customer's workflow keywords: finding a unit, booking, paying, My bookings and applications. */
export class AppUser extends PageObject {
  /** The booking form's continue button */
  private get continueButton() {
    return this.page.getByTestId("reservation__button--continue");
  }

  // Front page
  @step("app_user.User Navigates To Single Booking Page")
  async userNavigatesToSingleBookingPage() {
    await this.pages.topnav.navigateToSingleBookingPage();
  }

  /** Goes to single booking and searches for the unit */
  @step("app_user.User Finds The Unit")
  async userFindsTheUnit(nameoftheunit: string) {
    await this.userNavigatesToSingleBookingPage();
    await this.userUsesSearchToFindRightUnit(nameoftheunit);
  }

  @step("app_user.User Navigates To My Bookings")
  async userNavigatesToMyBookings() {
    await this.pages.topnav.navigateToMyBookings();
  }

  @step("app_user.User Navigates To Recurring Booking Page")
  async userNavigatesToRecurringBookingPage() {
    await this.pages.topnav.navigateToRecurringBookingPage();
  }

  // Payment notification banner
  @step("app_user.User Accepts Payment To Checkout")
  async userAcceptsPaymentToCheckout() {
    await log("This clicks approve button from notification banner", { level: "DEBUG" });
    await this.pages.userLandingpage.approveInterruptedPayment();
  }

  // Checkout
  @step("app_user.User Checks Info In Paid Checkout And Confirms Booking")
  async userChecksInfoInPaidCheckoutAndConfirmsBooking(booking: Booking) {
    await log("This step gets the reservation number", { level: "DEBUG" });
    booking.number = await this.pages.checkout.checkTheInfoInCheckout();
  }

  @step("app_user.User Interrupts Paid Checkout")
  async userInterruptsPaidCheckout(input_URL: string) {
    await this.pages.checkout.interruptedCheckout(input_URL);
    await this.pages.userLandingpage.checkTheUserLandingPageH1(USER_LANDING_PAGE_H1_TEXT);
  }

  // Singlebooking
  @step("app_user.User Uses Search To Find Right Unit")
  async userUsesSearchToFindRightUnit(nameoftheunit: string) {
    // This checks if the search element is visible; if it isn’t, it clicks the "advanced search" toggle button to make it visible.
    await this.pages.singlebooking.clickAdvancedSearchIfSearchNotVisible();
    await this.pages.singlebooking.searchUnitsByName(nameoftheunit);

    // A click is lost if the result list is re-rendered at that moment, so click again until the unit page opens
    await retry(3, 1000, () => this.openUnitFromSearchResults(nameoftheunit));
  }

  @step("app_user.Open Unit From Search Results")
  async openUnitFromSearchResults(nameoftheunit: string) {
    const url = this.page.url();
    const unit_page_open = url.includes("/reservation-unit/");
    if (unit_page_open) {
      return;
    }

    // The first result card with this name: a card's heading has only the unit's name
    await this.page
      .getByTestId("list-with-pagination__list--container")
      .getByRole("heading", { name: nameoftheunit, exact: true })
      .first()
      .click();
    await this.pages.customKeywords.waitForUrlToContain("/reservation-unit/", /* timeout= */ 8000);
  }

  /** Selects a free slot in quick reservation and returns the booking of that slot, with its info card and list time */
  @step("app_user.User Selects The Time With Quick Reservation")
  async userSelectsTheTimeWithQuickReservation() {
    await this.page.locator("#quick-reservation").waitFor({ state: "visible" });
    await this.pages.quickReservation.selectDuration(QUICK_RESERVATION_DURATION);

    // Checks that calendar opens and has all the buttons inside
    await this.pages.quickReservation.confirmsDatePickerOpensFromQuickReservation();

    const quick_reservation_current_date_value = await this.pages.quickReservation.getTheValueFromDateInput();

    const slot = await this.pages.quickReservation.selectTheFreeSlotFromQuickReservation();

    const [formatted_date, formatted_date_minus_t] = await this.pages.dataModification.setInfoCardDurationTimeInfo(
      slot,
      quick_reservation_current_date_value
    );

    await log(formatted_date);
    await log(formatted_date_minus_t);
    return new Booking(slot, formatted_date, formatted_date_minus_t);
  }

  /**
   * Selects a free slot in quick reservation and submits it, and returns the booking of that slot.
   * A unit lock keeps parallel tests from picking overlapping slots.
   */
  @step("app_user.User Reserves A Free Quick Reservation Slot")
  async userReservesAFreeQuickReservationSlot() {
    const lock_name = await this.pages.quickReservation.getUnitLockName();
    // The unit page the slot is booked on: a submit that went through before a retry has left it
    const unit_page_url = this.page.url();
    await acquireLock(lock_name);
    try {
      return await retry(3, 2000, () => this.userSelectsAndSubmitsQuickReservationOnFreshPage(unit_page_url));
    } finally {
      await releaseLock(lock_name);
    }
  }

  @step("app_user.User Selects And Submits Quick Reservation On Fresh Page")
  async userSelectsAndSubmitsQuickReservationOnFreshPage(unit_page_url: string) {
    await this.pages.quickReservation.reloadReservationUnitPageAndWaitForReservations(unit_page_url);
    const booking = await this.userSelectsTheTimeWithQuickReservation();
    await this.pages.quickReservation.userClicksSubmitButtonInQuickReservation();
    return booking;
  }

  @step("app_user.User Checks That Quick Reservation Does Not Have Reserved Time")
  async userChecksThatQuickReservationDoesNotHaveReservedTime(reservationtime: string) {
    await this.pages.quickReservation.verifyTimeSlotNotAvailable(reservationtime);
  }

  /**
   * This keyword uses data_modification.Convert finnish short day to english and
   * data_modification.Compute reservation timeslot to set variables
   */
  @step("app_user.User Checks That Reservation Calendar Does Not Have Reserved Time Slot Available")
  async userChecksThatReservationCalendarDoesNotHaveReservedTimeSlotAvailable(booking: Booking) {
    await this.pages.dataModification.convertFinnishShortDayToEnglish(booking.infoCardTime);

    await this.pages.dataModification.computeReservationTimeSlot(booking.slot, QUICK_RESERVATION_DURATION);

    await this.pages.customKeywords.verifyReservationSlotExists(this.state.calendarTimeslot, this.state.englishDay);
  }

  /** The reserver's contact info on the booking details page: the user's first and last name, email and phone */
  @step("app_user.User Fills The Reserver Contact Info")
  async userFillsTheReserverContactInfo() {
    await this.pages.reservationUnitReserverInfo.enterFirstName(this.testData.user.firstName);
    await this.pages.reservationUnitReserverInfo.enterLastName(this.testData.user.lastName);
    await this.pages.reservationUnitReserverInfo.enterEmail(this.testData.user.email);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(this.testData.user.phone);
  }

  @step("app_user.User Fills The Reservation Info For Always Free Unit And Submits")
  async userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits(booking: Booking) {
    // Checks that "jatka" button has been loaded
    await expect(this.continueButton, "The booking details page shows its continue button").toBeVisible();
    await this.pages.reservationUnitReserverInfo.checkApplicationCannotBeMadeWithoutInfo();
    await this.userFillsTheReserverContactInfo();
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills The Reservation Info For Unit With Payment And Submits")
  async userFillsTheReservationInfoForUnitWithPaymentAndSubmits(booking: Booking) {
    // Checks that "jatka" button has been loaded
    // Verify we are on the correct booking details page where user info can be given
    await expect(this.continueButton, "The booking details page shows its continue button").toBeVisible();
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.userFillsTheReserverContactInfo();
    await this.pages.reservationUnitReserverInfo.selectHomeCity(HOME_CITY);
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Subvented Booking Details As Individual And Submits")
  async userFillsSubventedBookingDetailsAsIndividualAndSubmits(booking: Booking, justification_for_not_paying: string) {
    // Checks that "jatka" button has been loaded
    await expect(this.continueButton, "The booking details page shows its continue button").toBeVisible();
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.clickAndSelectAgeGroupButton(AGEGROUP_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitBookingDetails.clickToApplyForAFreeBooking();
    await this.pages.reservationUnitBookingDetails.typeJustificationForFreeOfCharge(justification_for_not_paying);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.userFillsTheReserverContactInfo();
    await this.pages.reservationUnitReserverInfo.selectHomeCity(HOME_CITY);
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Noncancelable Booking Details As Individual And Submits")
  async userFillsNoncancelableBookingDetailsAsIndividualAndSubmits(booking: Booking) {
    // Checks that "jatka" button has been loaded
    await expect(this.continueButton, "The booking details page shows its continue button").toBeVisible();
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.userFillsTheReserverContactInfo();
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Info For Unit That Is Always Handled As Individual And Submits")
  async userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits(booking: Booking) {
    // Checks that "jatka" button has been loaded
    await expect(this.continueButton, "The booking details page shows its continue button").toBeVisible();
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.userFillsTheReserverContactInfo();
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Booking Details As Individual For Reservation With Access Code And Submits")
  async userFillsBookingDetailsAsIndividualForReservationWithAccessCodeAndSubmits(booking: Booking) {
    // Checks that "jatka" button has been loaded
    await expect(this.continueButton, "The booking details page shows its continue button").toBeVisible();
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.clickAndSelectAgeGroupButton(AGEGROUP_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.userFillsTheReserverContactInfo();
    await this.pages.reservationUnitReserverInfo.selectHomeCity(HOME_CITY);
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Checks Unit That Is Always Handled Details Are Right Before Submit")
  async userChecksUnitThatIsAlwaysHandledDetailsAreRightBeforeSubmit() {
    await this.pages.reservationUnitReservationReceipt.checkSingleBookingInfo();
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.quickReservation.checkThePriceOfQuickReservation(SINGLEBOOKING_PAID_PRICE_VAT_INCL);
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
  }

  @step("app_user.User Checks Unit That Is Always Handled Details Are Right After Submit")
  async userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit(booking: Booking) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    booking.number = await this.pages.quickReservation.getBookingNumber();
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(
      RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
  }

  @step("app_user.User Checks The Free Single Booking Details Are Right")
  async userChecksTheFreeSingleBookingDetailsAreRight(booking: Booking) {
    await this.pages.reservationUnitReservationReceipt.checkFreeSingleBookingInfo();
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.reservationLownav.clickSubmitButtonContinue();
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    booking.number = await this.pages.quickReservation.getBookingNumber();
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(
      RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
  }

  @step("app_user.User Checks The Paid Reservation Info Is Right And Submits")
  async userChecksThePaidReservationInfoIsRightAndSubmits(booking: Booking) {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Checks The Subvented Reservation Info Is Right And Submits")
  async userChecksTheSubventedReservationInfoIsRightAndSubmits(booking: Booking) {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Checks The Subvented Reservation Info Is Right After Submitting")
  async userChecksTheSubventedReservationInfoIsRightAfterSubmitting(booking: Booking) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    booking.number = await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Paid Reservation That Requires Handling Info Is Right And Submits")
  async userChecksThePaidReservationThatRequiresHandlingInfoIsRightAndSubmits(booking: Booking) {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(
      RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
    booking.number = await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Paid Reservation Info Is Right After Checkout")
  async userChecksThePaidReservationInfoIsRightAfterCheckout(booking: Booking) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(RESERVATION_STATUS_MSG_FI);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(SINGLEBOOKING_PAID_PRICE_VAT_INCL);
    await this.pages.quickReservation.checkBookingNumber(booking.number);
  }

  @step("app_user.User Checks The Reservation Info Is Right Before Submit")
  async userChecksTheReservationInfoIsRightBeforeSubmit() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
  }

  @step("app_user.User Checks The Reservation Info Is Right After Submit")
  async userChecksTheReservationInfoIsRightAfterSubmit(booking: Booking) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(RESERVATION_STATUS_MSG_FI);
    booking.number = await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Reservation Info Is Right Before Submit With Access Code")
  async userChecksTheReservationInfoIsRightBeforeSubmitWithAccessCode() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
  }

  @step("app_user.User Checks The Reservation Info Is Right After Submit With Access Code")
  async userChecksTheReservationInfoIsRightAfterSubmitWithAccessCode(booking: Booking) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(RESERVATION_STATUS_MSG_FI);
    booking.number = await this.pages.quickReservation.getBookingNumber();
    await this.pages.quickReservation.getAccessCode();
  }

  @step("app_user.User Checks The Noncancelable Reservation Info Is Right Before Submit")
  async userChecksTheNoncancelableReservationInfoIsRightBeforeSubmit() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.checkNoncancelableBookingInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
  }

  @step("app_user.User Checks The Noncancelable Reservation Info Is Right After Submit")
  async userChecksTheNoncancelableReservationInfoIsRightAfterSubmit(booking: Booking) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(RESERVATION_STATUS_MSG_FI);
    booking.number = await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Modified Reservation Info Is Right And Clicks Continue")
  async userChecksTheModifiedReservationInfoIsRightAndClicksContinue(booking: Booking) {
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    // TODO: Separate the submit and the next page check into their own keywords
    await this.pages.reservationLownav.clickSubmitButtonContinue();
    // The edit page has the same time card, wait for the reservation page itself
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible", timeout: 15_000 });

    await log("This check is done in reservations page", { level: "DEBUG" });
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
  }

  @step("app_user.User Cancel Booking In Reservations And Checks It Got Cancelled")
  async userCancelBookingInReservationsAndChecksItGotCancelled(booking: Booking) {
    await this.pages.mybookings.userCancelBooking();
    await this.pages.mybookings.clickReasonForCancellation();
    await this.pages.mybookings.selectReasonForCancellation(REASON_FOR_CANCELLATION);
    await this.pages.mybookings.clickCancelButton();
    await this.pages.popups.checkAndCloseTheToast(MYBOOKINGS_STATUS_CANCELED);
    await this.pages.mybookings.checkReservationStatus(IN_RESERVATIONS_STATUS_CANCELED);
    await this.pages.quickReservation.checkBookingNumber(booking.number);
  }

  @step("app_user.User Modifies Booking And Verifies The Changes")
  async userModifiesBookingAndVerifiesTheChanges(booking: Booking) {
    await this.pages.mybookings.userClickChangeTime();
    // This opens calendar controls
    await this.pages.reservationCalendar.userClickReservationCalendarToggleButton();

    await this.pages.reservationCalendar.selectDurationCalendar(QUICK_RESERVATION_DURATION);

    // This sets ${CALENDAR_CONTROL_TIME_OF_FREE_SLOT}
    await this.pages.reservationCalendar.clickAndStoreFreeReservationTime();

    const date_value_from_calendar = await this.pages.reservationCalendar.getCurrentDateFromDatepicker();

    // Formats modified date from variables like 15.30 and 15.6.2024. formatting uses 1h duration
    const [formatted_date, formatted_date_minus_t] = await this.pages.dataModification.setInfoCardDurationTimeInfo(
      this.state.calendarControlTimeOfFreeSlot,
      date_value_from_calendar
    );

    // The booking after the change: the new slot and times, and the same number
    const modified = new Booking(
      this.state.calendarControlTimeOfFreeSlot,
      formatted_date,
      formatted_date_minus_t,
      booking.number
    );

    // Log  ${returned_formatted_values}
    await log(modified.infoCardTime);
    await log(modified.listTime);

    await expect(this.continueButton, "The continue button is enabled: the reservation time has changed").toBeEnabled();
    await this.pages.reservationCalendar.clickContinueButton();
    return modified;
  }

  @step("app_user.User Checks Cancelled Booking Is Found")
  async userChecksCancelledBookingIsFound(unitname_mybookings: string, time_of_quick_reservation_minusT: string) {
    await log("This checks the canceled booking is not found in upcoming reservations", { level: "DEBUG" });

    if (this.isMobile) {
      // The phone's tab list scrolls sideways: its button brings the tabs after the first ones into view
      await this.pages.topnav.clickTablistScrollButtonToRightMobile();
    }

    await this.pages.mybookings.checkUnitnameAndReservationAreNotFound(
      unitname_mybookings,
      time_of_quick_reservation_minusT
    );

    await this.pages.mybookings.navigateToCancelledBookings();

    await this.pages.mybookings.checkUnitnameAndReservationTimeAndClickShow(
      unitname_mybookings,
      time_of_quick_reservation_minusT
    );
  }

  /** Goes to My bookings and opens the upcoming booking of the unit at that time */
  @step("app_user.User Opens The Booking In My Bookings")
  async userOpensTheBookingInMyBookings(unitname: string, reservationtime: string) {
    await this.pages.topnav.navigateToMyBookings();
    await this.userCanSeeUpcomingBookingInListAndClicksIt(unitname, reservationtime);
  }

  @step("app_user.User Can See Upcoming Booking In List And Clicks It")
  async userCanSeeUpcomingBookingInListAndClicksIt(unitname: string, reservationtime: string) {
    // The list is fetched once when the page opens, so open it again if the booking is not in it. A slow "Näytä" can
    // leave the browser on the reservation page, so the list page is opened rather than the current page reloaded.
    await this.pages.customKeywords.retryWithRecovery(
      () => this.pages.mybookings.checkUnitnameAndReservationTimeAndClickShow(unitname, reservationtime),
      async () => {
        await this.page.goto("/reservations");
      }
    );
  }

  @step("app_user.User Can See Upcoming Noncancelable Booking In List And Clicks It")
  async userCanSeeUpcomingNoncancelableBookingInListAndClicksIt(unitname: string, reservationtime: string) {
    await this.pages.mybookings.checkMyBookingsH1(MYBOOKINGS_FI);
    // Opens the list page again if the booking is not in it, see User Can See Upcoming Booking In List And Clicks It
    await this.pages.customKeywords.retryWithRecovery(
      () => this.pages.mybookings.checkUnitnameAndReservationTimeAndVerifyNoCancelButton(unitname, reservationtime),
      async () => {
        await this.page.goto("/reservations");
      }
    );
    await this.pages.mybookings.checkUnitnameAndReservationTimeAndClickShow(unitname, reservationtime);
  }

  @step("app_user.User Navigates To Unit From Bookings List")
  async userNavigatesToUnitFromBookingsList() {
    await this.pages.topnav.navigateToMyBookings();
  }

  // Reservations
  /** The booker's contact info on the reservation's page: the user's email, first and last name and phone */
  @step("app_user.User Checks The Booker Info")
  async userChecksTheBookerInfo() {
    await this.pages.mybookings.checkReservationBookerEmail(this.testData.user.email);
    await this.pages.mybookings.checkReservationBookerFirstName(this.testData.user.firstName);
    await this.pages.mybookings.checkReservationBookerLastName(this.testData.user.lastName);
    await this.pages.mybookings.checkReservationBookerPhone(this.testData.user.phone);
  }

  @step("app_user.User Checks The Paid Reservation Info Is Right In Reservations")
  async userChecksThePaidReservationInfoIsRightInReservations(
    booking: Booking,
    booking_status: string,
    payment_status: string,
    booking_price: string
  ) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationsPaymentStatus(payment_status);
    await this.userChecksTheBookerInfo();
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkReservationNumberFromH1Text(booking.number);
  }

  @step("app_user.User Checks Booking Info In Reservations With Number Of Participants And Description And Purpose")
  async userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
    booking: Booking,
    booking_status: string,
    booking_price: string
  ) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkBookingNumber(booking.number);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(booking.number);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.userChecksTheBookerInfo();
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
  }

  @step("app_user.User Checks Booking Info In Reservations")
  async userChecksBookingInfoInReservations(booking: Booking, booking_status: string, booking_price: string) {
    await this.page.getByTestId("reservation__reservation-info-card__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkBookingNumber(booking.number);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(booking.number);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.userChecksTheBookerInfo();
  }

  @step("app_user.User Checks Booking Info In Reservations With Access Code")
  async userChecksBookingInfoInReservationsWithAccessCode(
    booking: Booking,
    booking_status: string,
    booking_price: string,
    access_code: string
  ) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkBookingNumber(booking.number);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(booking.number);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.userChecksTheBookerInfo();
    await this.pages.mybookings.checkReservationAccessCode(access_code);
  }

  @step("app_user.User Checks Booking Info In Reservations With All Reservation Info")
  async userChecksBookingInfoInReservationsWithAllReservationInfo(
    booking: Booking,
    booking_status: string,
    booking_price: string
  ) {
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkBookingNumber(booking.number);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(booking.number);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.userChecksTheBookerInfo();
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkReservationAgeGroup(AGEGROUP_OF_PERSONS);
  }

  @step("app_user.User Checks Booking Info In Reservations For Noncancelable Booking")
  async userChecksBookingInfoInReservationsForNoncancelableBooking(booking: Booking) {
    await this.pages.mybookings.checkReservationNumberFromH1Text(booking.number);
    await this.pages.mybookings.checkReservationStatus(MYBOOKINGS_STATUS_CONFIRMED);
    await this.userChecksTheBookerInfo();
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkCancelButtonIsNotFoundInReservations();
    await this.pages.quickReservation.checkThePriceOfQuickReservation(SINGLEBOOKING_NO_PAYMENT);
  }

  @step("app_user.User Verifies Details Of Subvented Reservation After Admin Approval Without Payment")
  async userVerifiesDetailsOfSubventedReservationAfterAdminApprovalWithoutPayment(booking: Booking) {
    await log(
      "If the booking number comparison fails, verify that there are no duplicate times in the upcoming bookings list."
    );

    await this.pages.quickReservation.checkBookingNumber(booking.number);
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.adminModifiesTimeOfInfoCard);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(SINGLEBOOKING_NO_PAYMENT);
    await this.pages.mybookings.checkReservationStatus(MYBOOKINGS_STATUS_CONFIRMED);
    await this.pages.mybookings.checkReservationNumberFromH1Text(booking.number);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationAgeGroup(AGEGROUP_OF_PERSONS);
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.userChecksTheBookerInfo();
  }

  @step("app_user.User Checks The Rejected Reservation Info Is Right After Admin Handling")
  async userChecksTheRejectedReservationInfoIsRightAfterAdminHandling(booking: Booking) {
    await log(
      "If the booking number comparison fails, verify that there are no duplicate times in the upcoming bookings list."
    );

    await this.pages.quickReservation.checkBookingNumber(booking.number);
    await this.pages.quickReservation.checkTheQuickReservationTime(booking.infoCardTime);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(ALWAYS_REQUESTED_UNIT_PAID_PRICE_VAT_INCL);
    await this.pages.mybookings.checkReservationStatus(MYBOOKINGS_STATUS_REJECTED);
    await this.pages.mybookings.checkReservationNumberFromH1Text(booking.number);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.userChecksTheBookerInfo();
  }

  // Calendar usage
  /**
   * This formats example like Ti 1.10.2024 klo 10:30–11:30
   * to DTSTART;TZID=Europe/Helsinki:20241001T103000, DTEND;TZID=Europe/Helsinki:20241001T113000
   */
  @step("app_user.User Saves File And Formats Booking Time To ICS")
  // oxlint-disable-next-line eslint/no-unused-vars -- the file is saved into the test's results folder
  async userSavesFileAndFormatsBookingTimeToIcs(booking: Booking, file_path: string) {
    await this.pages.customKeywords.convertBookingTimeToIcsFormat(booking.listTime);

    // Create a promise that waits for the download
    const download_promise = this.page.waitForEvent("download");

    // Saves the calendar file
    await this.page.getByTestId("reservation__button--calendar-link").click();

    // Wait for the file to be fully downloaded, and save it into the test's results folder
    const download = await download_promise;
    const saved_path = test.info().outputPath(download.suggestedFilename());
    // Fails if the download failed
    await download.saveAs(saved_path);

    // Retrieves text content from the downloaded file and saves it for the next keywords
    const ICS_TEXT = await readFile(saved_path, "utf8");
    this.state.icsTextFromFile = ICS_TEXT;

    // Extracts the DTSTART and DTEND timestamps from an ICS file's text
    // example --> DTSTART;TZID=Europe/Helsinki:20241003T083000 and DTEND;TZID=Europe/Helsinki:20241003T093000
    await this.pages.customKeywords.extractStartAndEndTimeFromIcsFile(this.state.icsTextFromFile);
    await log(ICS_TEXT, { level: "DEBUG" });
  }

  @step("app_user.User Checks That Calendar File Matches Booking Time")
  async userChecksThatCalendarFileMatchesBookingTime() {
    // Log for verification
    await log("Checking if ICS times match with booking times...", { level: "DEBUG" });
    await log(`ICS Start Time: ${this.state.formattedStartToIcs}`, { level: "DEBUG" });
    await log(`ICS End Time: ${this.state.formattedEndToIcs}`, { level: "DEBUG" });
    await log(`Extracted Start Time: ${this.state.startTimeFromIcs}`, { level: "DEBUG" });
    await log(`Extracted End Time: ${this.state.endTimeFromIcs}`, { level: "DEBUG" });

    // Comparisons
    // Additional info: Check custom_keywords.Convert booking time to ICS format if the times don't match
    // Assert Start Times
    expect(this.state.startTimeFromIcs, "The calendar file has the booking's start time").toBe(
      this.state.formattedStartToIcs
    );

    // Assert End Times
    expect(this.state.endTimeFromIcs, "The calendar file has the booking's end time").toBe(
      this.state.formattedEndToIcs
    );
  }

  // Recurring
  @step("app_user.User Fills In The Application Details For Recurring Application")
  async userFillsInTheApplicationDetailsForRecurringApplication() {
    await this.pages.recurringApplications.userSelectsTheDefaultTimePeriodForTheRecurringReservation();
    await this.pages.recurringApplications.userFillsTheRecurringReservationName(RECURRING_BOOKING_NAME);
    await this.pages.recurringApplications.userFillsTheNumberOfPeopleInTheRecurringReservation(
      RECURRING_BOOKING_SIZE_OF_GROUP
    );
    await this.pages.recurringApplications.userFillsTheAgeGroupInTheRecurringReservation(
      RECURRING_BOOKING_AGE_GROUP_TEXT
    );
    await this.pages.recurringApplications.userChoosesThePurposeOfTheRecurringReservation(
      RECURRING_BOOKING_PURPOSE_TEXT
    );
    await this.pages.recurringApplications.userSelectsTheMinimumLengthForTheRecurringReservation(
      RECURRING_BOOKING_MIN_LENGTH_TEXT
    );
    await this.pages.recurringApplications.userSelectsTheMaximumLengthForTheRecurringReservation(
      RECURRING_BOOKING_MAX_LENGTH_TEXT
    );
    await this.pages.recurringApplications.userSelectsTheAmountOfReservationsPerWeek(
      RECURRING_BOOKING_RESERVATION_PER_WEEK
    );
    await this.pages.recurringApplications.userClicksContinueButton();
  }

  @step("app_user.User Selects Times For Recurring Application")
  async userSelectsTimesForRecurringApplication() {
    await this.pages.recurringApplicationsPage2.userSelectsTypeOfTheBookingRequest(
      RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_PRIMARY
    );
    await this.pages.recurringApplicationsPage2.userClicksAvailableSeasonalBookingTimesFor(
      RECURRING_BOOKING_UNIT_NAME_KESKUSTA
    );
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(
      ...RECURRING_THU_19_21_PRIMARY
    );
    await this.pages.recurringApplicationsPage2.userClicksAvailableSeasonalBookingTimesFor(
      RECURRING_BOOKING_UNIT_NAME_MALMI
    );
    await this.pages.recurringApplicationsPage2.userSelectsTypeOfTheBookingRequest(
      RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_SECONDARY
    );
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(
      ...RECURRING_THU_09_11_SECONDARY
    );
    await this.pages.recurringApplicationsPage2.userClicksContinueButton();
  }

  @step("app_user.User Fills In The Application User Info Details")
  async userFillsInTheApplicationUserInfoDetails() {
    await this.pages.recurringApplicationsPage3.userSelectsWhoIsTheApplicationCreatedFor("INDIVIDUAL");
    await this.pages.recurringApplicationsPage3.userTypesFirstName(RECURRING_BOOKING_FIRST_NAME);
    await this.pages.recurringApplicationsPage3.userTypesLastName(RECURRING_BOOKING_LAST_NAME);
    await this.pages.recurringApplicationsPage3.userTypesStreetAddress(RECURRING_BOOKING_STREET_ADDRESS);
    await this.pages.recurringApplicationsPage3.userTypesPostCode(RECURRING_BOOKING_POST_CODE);
    await this.pages.recurringApplicationsPage3.userTypesCity(RECURRING_BOOKING_CITY);
    await this.pages.recurringApplicationsPage3.userTypesPhoneNumber(RECURRING_BOOKING_PHONE_NUMBER);
    await this.pages.recurringApplicationsPage3.userTypesEmail(RECURRING_BOOKING_EMAIL);
    await this.pages.recurringApplicationsPage3.userTypesAdditionalInformation(RECURRING_BOOKING_ADDITIONAL_INFO);
    await this.pages.recurringApplicationsPage2.userClicksContinueButton();
  }

  @step("app_user.User Accepts Terms Of Use And Clicks Submit")
  async userAcceptsTermsOfUseAndClicksSubmit() {
    await this.pages.recurringApplicationsPagePreview.userClicksTheAcceptTermsOfUseCheckbox();
    await this.pages.recurringApplicationsPagePreview.userClicksTheSpecificTermsOfUseCheckbox();
    await this.pages.recurringApplicationsPagePreview.userClicksTheSubmitButton();
  }

  @step("app_user.User Checks The Sent Page")
  async userChecksTheSentPage() {
    await this.pages.recurringApplicationsPageSent.userChecksH1OfTheSentPage();
  }

  /**
   * This is a workaround to cancel the recurring reservation with given name in
   * [data-testid="card__heading"]
   * it cancels the last reservation in the list so they won't pile up
   */
  @step("app_user.User Checks The Recurring Reservation Is Sent State And Cancels It")
  async userChecksTheRecurringReservationIsSentStateAndCancelsIt() {
    // In the received applications ("Vastaanotettu", the group's heading), the last card of the round that is sent
    // ("Lähetetty", its status tag)
    const application_card = this.page
      .getByTestId("applications__group--wrapper")
      .filter({ has: this.page.getByRole("heading", { level: 2, name: "Vastaanotettu", exact: true }) })
      .locator(".card--default")
      .filter({ has: this.page.getByRole("heading", { name: "Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)" }) })
      .filter({ has: this.page.getByTestId("card__tags").filter({ hasText: "Lähetetty" }) })
      .last();
    await application_card.getByRole("button", { name: "Peru", exact: true }).click();

    // The click waits until the modal's animation has ended
    await this.page.locator("#application-card-modal").getByRole("button", { name: "Kyllä", exact: true }).click();
  }

  /**
   * Cancels the applications that an earlier attempt of the test left, like a draft whose send failed, because the test
   * checks at the end that the user has no applications. Does nothing when there are none.
   */
  @step("app_user.User Cancels Leftover Applications")
  async userCancelsLeftoverApplications() {
    await this.pages.topnav.navigateToMyApplications();
    const cancel_buttons = this.page
      .getByTestId("applications__group--wrapper")
      .getByRole("button", { name: "Peru", exact: true, disabled: false });
    // The list of applications, or the empty state
    await expect(
      cancel_buttons
        .first()
        .or(this.page.locator("#main").getByText(EMPTY_STATE_MESSAGE_RECURRING_APPLICATIONS, { exact: true })),
      "The applications page shows applications to cancel or its empty state"
    ).toBeVisible();
    for (let left = await cancel_buttons.count(); left > 0; left = await cancel_buttons.count()) {
      await log(`Cancelling a leftover application, ${left} left`);
      await cancel_buttons.first().click();
      // The click waits until the modal's animation has ended
      await this.page.locator("#application-card-modal").getByRole("button", { name: "Kyllä", exact: true }).click();
      // The list is fetched again after the cancellation
      await expect(cancel_buttons).toHaveCount(left - 1);
    }
  }

  /**
   * Verifies that the recurring reservation with the given name is no longer found
   * in the applications list. Fails if the reservation is still present.
   */
  @step("app_user.User Verifies The Recurring Reservation Is Cancelled")
  async userVerifiesTheRecurringReservationIsCancelled() {
    await this.pages.customKeywords.verifyCardNotFoundInGroupWithMatchingConditions(
      EMPTY_STATE_MESSAGE_RECURRING_APPLICATIONS
    );
  }

  // Misc
  @step("app_user.User Checks That Reservation Unit Picture Is Loaded")
  async userChecksThatReservationUnitPictureIsLoaded(unit_name: string) {
    // Target the image by its alt text - this is the most reliable selector
    const image = this.page.locator(`img[alt*="${unit_name}"]`).first();

    // Wait for the image element to be attached
    await expect(image, `The unit page has a picture of ${unit_name}`).toBeAttached({ timeout: 5000 });

    // Verify the src attribute is present
    await expect(image, "The picture has a source").toHaveAttribute("src", /.+/);

    // Verify the image has actually loaded (not broken): complete is true, naturalWidth > 0 and naturalHeight > 0.
    // Waits for the image to load
    await expect
      .poll(
        () =>
          image.evaluate((element) => {
            const img = element as HTMLImageElement;
            return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
          }),
        { message: "The picture has loaded, with a width and a height" }
      )
      .toBe(true);

    // Get and log the image dimensions for debugging
    const { width, height } = await image.evaluate((element) => ({
      width: (element as HTMLImageElement).naturalWidth,
      height: (element as HTMLImageElement).naturalHeight,
    }));
    await log(`Image loaded successfully with dimensions: ${width}x${height}`, { level: "DEBUG" });
  }
}
