import { test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { acquireLock, releaseLock } from "../../../lib/locks";
/** Port of PO/App/app_user.robot */
import { retry } from "../../../lib/retry";
import { step, expect, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import {
  AGEGROUP_OF_PERSONS,
  ALWAYS_REQUESTED_UNIT_PAID_PRICE_VAT_INCL,
  EMPTY_STATE_MESSAGE_RECURRING_APPLICATIONS,
  HOME_CITY,
  IN_RESERVATIONS_STATUS_CANCELED,
  MYBOOKINGS_FI,
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
  RECURRING_THU_09_10_PREFERRED,
  RECURRING_THU_10_11_PREFERRED,
  RECURRING_THU_22_23_OTHER,
  RECURRING_THU_23_24_OTHER,
  RESERVATION_INDIVIDUAL,
} from "../../Resources/variables";

export class AppUser extends PageObject {
  // Front page
  @step("app_user.User Navigates To Single Booking Page")
  async userNavigatesToSingleBookingPage() {
    await this.pages.topnav.navigateToSingleBookingPage();
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
    await log("This clicks approve button from notification banner");
    await this.pages.userLandingpage.approveInterruptedPayment();
  }

  // Checkout
  @step("app_user.User Checks Info In Paid Checkout And Confirms Booking")
  async userChecksInfoInPaidCheckoutAndConfirmsBooking() {
    await log("This step gets the reservation number");
    await this.pages.checkout.checkTheInfoInCheckout();
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

  /**
   * here is keyword --> data_modification.Set info card duration time info
   * that sets $TIME_OF_QUICK_RESERVATION and $TIME_OF_QUICK_RESERVATION_MINUS_T
   */
  @step("app_user.User Selects The Time With Quick Reservation And Sets Time Variables")
  async userSelectsTheTimeWithQuickReservationAndSetsTimeVariables() {
    await this.page.locator("#quick-reservation").waitFor({ state: "visible" });
    await this.pages.quickReservation.selectDuration(QUICK_RESERVATION_DURATION);

    // Checks that calendar opens and has all the buttons inside
    await this.pages.quickReservation.confirmsDatePickerOpensFromQuickReservation();

    const quick_reservation_current_date_value = await this.pages.quickReservation.getTheValueFromDateInput();

    // This sets ${TIME_OF_QUICK_RESERVATION_FREE_SLOT}
    await this.pages.quickReservation.selectTheFreeSlotFromQuickReservation();

    const [formatted_date, formatted_date_minus_t] = await this.pages.dataModification.setInfoCardDurationTimeInfo(
      this.state.timeOfQuickReservationFreeSlot,
      quick_reservation_current_date_value
    );

    this.state.timeOfQuickReservation = formatted_date;
    this.state.timeOfQuickReservationMinusT = formatted_date_minus_t;

    await log(this.state.timeOfQuickReservation);
    await log(this.state.timeOfQuickReservationMinusT);
  }

  /**
   * Selects a free slot in quick reservation and submits it.
   * A unit lock keeps parallel tests from picking overlapping slots.
   */
  @step("app_user.User Reserves A Free Quick Reservation Slot")
  async userReservesAFreeQuickReservationSlot() {
    const lock_name = await this.pages.quickReservation.getUnitLockName();
    // The unit page the slot is booked on: a submit that went through before a retry has left it
    const unit_page_url = this.page.url();
    await acquireLock(lock_name);
    try {
      await retry(3, 2000, () => this.userSelectsAndSubmitsQuickReservationOnFreshPage(unit_page_url));
    } finally {
      await releaseLock(lock_name);
    }
  }

  @step("app_user.User Selects And Submits Quick Reservation On Fresh Page")
  async userSelectsAndSubmitsQuickReservationOnFreshPage(unit_page_url: string) {
    await this.pages.quickReservation.reloadReservationUnitPageAndWaitForReservations(unit_page_url);
    await this.userSelectsTheTimeWithQuickReservationAndSetsTimeVariables();
    await this.pages.quickReservation.userClicksSubmitButtonInQuickReservation();
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
  async userChecksThatReservationCalendarDoesNotHaveReservedTimeSlotAvailable() {
    await this.pages.dataModification.convertFinnishShortDayToEnglish(this.state.timeOfQuickReservation);

    await this.pages.dataModification.computeReservationTimeSlot(
      this.state.timeOfQuickReservationFreeSlot,
      QUICK_RESERVATION_DURATION
    );

    await this.pages.customKeywords.verifyReservationSlotExists(this.state.calendarTimeslot, this.state.englishDay);
  }

  @step("app_user.User Fills The Reservation Info For Always Free Unit And Submits")
  async userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits() {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible();
    await this.pages.reservationUnitReserverInfo.checkApplicationCannotBeMadeWithoutInfo();
    await this.pages.reservationUnitReserverInfo.enterFirstName(this.testData.user.firstName);
    await this.pages.reservationUnitReserverInfo.enterLastName(this.testData.user.lastName);
    await this.pages.reservationUnitReserverInfo.enterEmail(this.testData.user.email);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(this.testData.user.phone);
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills The Reservation Info For Unit With Payment And Submits")
  async userFillsTheReservationInfoForUnitWithPaymentAndSubmits() {
    // Checks that "jatka" button has been loaded
    // Verify we are on the correct booking details page where user info can be given
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible();
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(this.testData.user.firstName);
    await this.pages.reservationUnitReserverInfo.enterLastName(this.testData.user.lastName);
    await this.pages.reservationUnitReserverInfo.enterEmail(this.testData.user.email);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(this.testData.user.phone);
    await this.pages.reservationUnitReserverInfo.selectHomeCity(HOME_CITY);
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Subvented Booking Details As Individual And Submits")
  async userFillsSubventedBookingDetailsAsIndividualAndSubmits(justification_for_not_paying: string) {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible();
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.clickAndSelectAgeGroupButton(AGEGROUP_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitBookingDetails.clickToApplyForAFreeBooking();
    await this.pages.reservationUnitBookingDetails.typeJustificationForFreeOfCharge(justification_for_not_paying);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(this.testData.user.firstName);
    await this.pages.reservationUnitReserverInfo.enterLastName(this.testData.user.lastName);
    await this.pages.reservationUnitReserverInfo.enterEmail(this.testData.user.email);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(this.testData.user.phone);
    await this.pages.reservationUnitReserverInfo.selectHomeCity(HOME_CITY);
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Noncancelable Booking Details As Individual And Submits")
  async userFillsNoncancelableBookingDetailsAsIndividualAndSubmits() {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible();
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(this.testData.user.firstName);
    await this.pages.reservationUnitReserverInfo.enterLastName(this.testData.user.lastName);
    await this.pages.reservationUnitReserverInfo.enterEmail(this.testData.user.email);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(this.testData.user.phone);
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Info For Unit That Is Always Handled As Individual And Submits")
  async userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits() {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible();
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(this.testData.user.firstName);
    await this.pages.reservationUnitReserverInfo.enterLastName(this.testData.user.lastName);
    await this.pages.reservationUnitReserverInfo.enterEmail(this.testData.user.email);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(this.testData.user.phone);
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Booking Details As Individual For Reservation With Access Code And Submits")
  async userFillsBookingDetailsAsIndividualForReservationWithAccessCodeAndSubmits() {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible();
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.clickAndSelectAgeGroupButton(AGEGROUP_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(this.testData.user.firstName);
    await this.pages.reservationUnitReserverInfo.enterLastName(this.testData.user.lastName);
    await this.pages.reservationUnitReserverInfo.enterEmail(this.testData.user.email);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(this.testData.user.phone);
    await this.pages.reservationUnitReserverInfo.selectHomeCity(HOME_CITY);
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
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
  async userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit() {
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.quickReservation.getBookingNumber();
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(
      RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
  }

  @step("app_user.User Checks The Free Single Booking Details Are Right")
  async userChecksTheFreeSingleBookingDetailsAreRight() {
    await this.pages.reservationUnitReservationReceipt.checkFreeSingleBookingInfo();
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.reservationLownav.clickSubmitButtonContinue();
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.quickReservation.getBookingNumber();
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(
      RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
  }

  @step("app_user.User Checks The Paid Reservation Info Is Right And Submits")
  async userChecksThePaidReservationInfoIsRightAndSubmits() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Checks The Subvented Reservation Info Is Right And Submits")
  async userChecksTheSubventedReservationInfoIsRightAndSubmits() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Checks The Subvented Reservation Info Is Right After Submitting")
  async userChecksTheSubventedReservationInfoIsRightAfterSubmitting() {
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Paid Reservation That Requires Handling Info Is Right And Submits")
  async userChecksThePaidReservationThatRequiresHandlingInfoIsRightAndSubmits() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(
      RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
    await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Paid Reservation Info Is Right After Checkout")
  async userChecksThePaidReservationInfoIsRightAfterCheckout() {
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(RESERVATION_STATUS_MSG_FI);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(SINGLEBOOKING_PAID_PRICE_VAT_INCL);
    await this.pages.quickReservation.checkBookingNumber(this.state.bookingNumOnly);
  }

  @step("app_user.User Checks The Reservation Info Is Right Before Submit")
  async userChecksTheReservationInfoIsRightBeforeSubmit() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
  }

  @step("app_user.User Checks The Reservation Info Is Right After Submit")
  async userChecksTheReservationInfoIsRightAfterSubmit() {
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(RESERVATION_STATUS_MSG_FI);
    await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Reservation Info Is Right Before Submit With Access Code")
  async userChecksTheReservationInfoIsRightBeforeSubmitWithAccessCode() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
  }

  @step("app_user.User Checks The Reservation Info Is Right After Submit With Access Code")
  async userChecksTheReservationInfoIsRightAfterSubmitWithAccessCode() {
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(RESERVATION_STATUS_MSG_FI);
    await this.pages.quickReservation.getBookingNumber();
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
  async userChecksTheNoncancelableReservationInfoIsRightAfterSubmit() {
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(RESERVATION_STATUS_MSG_FI);
    await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Modified Reservation Info Is Right And Clicks Continue")
  async userChecksTheModifiedReservationInfoIsRightAndClicksContinue() {
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservationModified);
    // TODO: Separate the submit and the next page check into their own keywords
    await this.pages.reservationLownav.clickSubmitButtonContinue();
    // The edit page has the same time card, wait for the reservation page itself
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible", timeout: 15_000 });

    await log("This check is done in reservations page");
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservationModified);
  }

  @step("app_user.User Cancel Booking In Reservations And Checks It Got Cancelled")
  async userCancelBookingInReservationsAndChecksItGotCancelled() {
    await this.pages.mybookings.userCancelBooking();
    await this.pages.mybookings.clickReasonForCancellation();
    await this.pages.mybookings.selectReasonForCancellation(REASON_FOR_CANCELLATION);
    await this.pages.mybookings.clickCancelButton();
    await this.pages.mybookings.checkReservationStatus(IN_RESERVATIONS_STATUS_CANCELED);
    await this.pages.quickReservation.checkBookingNumber(this.state.bookingNumOnly);
  }

  @step("app_user.User Modifies Booking And Verifies The Changes")
  async userModifiesBookingAndVerifiesTheChanges() {
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

    this.state.timeOfQuickReservationModified = formatted_date;
    this.state.timeOfQuickReservationMinusTModified = formatted_date_minus_t;

    // Log  ${returned_formatted_values}
    await log(this.state.timeOfQuickReservationModified);
    await log(this.state.timeOfQuickReservationMinusTModified);

    await log("If the continue button is not enabled, verify that the reservation time was actually modified");
    await expect(this.page.getByTestId("reservation__button--continue")).toBeEnabled();
    await this.pages.reservationCalendar.clickContinueButton();
  }

  @step("app_user.User Checks Cancelled Booking Is Found")
  async userChecksCancelledBookingIsFound(unitname_mybookings: string, time_of_quick_reservation_minusT: string) {
    await log("This checks the canceled booking is not found in upcoming reservations");

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
  @step("app_user.User Checks The Paid Reservation Info Is Right In Reservations")
  async userChecksThePaidReservationInfoIsRightInReservations(
    booking_status: string,
    payment_status: string,
    booking_price: string,
    time_in_quickreservations: string,
    reservation_number: string
  ) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationsPaymentStatus(payment_status);
    await this.pages.mybookings.checkReservationBookerEmail(this.testData.user.email);
    await this.pages.mybookings.checkReservationBookerFirstName(this.testData.user.firstName);
    await this.pages.mybookings.checkReservationBookerLastName(this.testData.user.lastName);
    await this.pages.mybookings.checkReservationBookerPhone(this.testData.user.phone);
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkReservationNumberFromH1Text(reservation_number);
  }

  @step("app_user.User Checks Booking Info In Reservations With Number Of Participants And Description And Purpose")
  async userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: string
  ) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkBookingNumber(this.state.bookingNumOnly);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(this.state.bookingNumOnly);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationBookerEmail(this.testData.user.email);
    await this.pages.mybookings.checkReservationBookerFirstName(this.testData.user.firstName);
    await this.pages.mybookings.checkReservationBookerLastName(this.testData.user.lastName);
    await this.pages.mybookings.checkReservationBookerPhone(this.testData.user.phone);
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
  }

  @step("app_user.User Checks Booking Info In Reservations")
  async userChecksBookingInfoInReservations(
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: string
  ) {
    await this.page.getByTestId("reservation__reservation-info-card__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkBookingNumber(this.state.bookingNumOnly);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(this.state.bookingNumOnly);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationBookerEmail(this.testData.user.email);
    await this.pages.mybookings.checkReservationBookerFirstName(this.testData.user.firstName);
    await this.pages.mybookings.checkReservationBookerLastName(this.testData.user.lastName);
    await this.pages.mybookings.checkReservationBookerPhone(this.testData.user.phone);
  }

  @step("app_user.User Checks Booking Info In Reservations With Access Code")
  async userChecksBookingInfoInReservationsWithAccessCode(
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: string,
    access_code: string
  ) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkBookingNumber(this.state.bookingNumOnly);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(this.state.bookingNumOnly);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationBookerEmail(this.testData.user.email);
    await this.pages.mybookings.checkReservationBookerFirstName(this.testData.user.firstName);
    await this.pages.mybookings.checkReservationBookerLastName(this.testData.user.lastName);
    await this.pages.mybookings.checkReservationBookerPhone(this.testData.user.phone);
    await this.pages.mybookings.checkReservationAccessCode(access_code);
  }

  @step("app_user.User Checks Booking Info In Reservations With All Reservation Info")
  async userChecksBookingInfoInReservationsWithAllReservationInfo(
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: string
  ) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkBookingNumber(this.state.bookingNumOnly);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(this.state.bookingNumOnly);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationNumberFromH1Text(this.state.bookingNumOnly);
    await this.pages.mybookings.checkReservationBookerEmail(this.testData.user.email);
    await this.pages.mybookings.checkReservationBookerFirstName(this.testData.user.firstName);
    await this.pages.mybookings.checkReservationBookerLastName(this.testData.user.lastName);
    await this.pages.mybookings.checkReservationBookerPhone(this.testData.user.phone);
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkReservationAgeGroup(AGEGROUP_OF_PERSONS);
  }

  @step("app_user.User Checks Booking Info In Reservations For Noncancelable Booking")
  async userChecksBookingInfoInReservationsForNoncancelableBooking() {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });

    await this.pages.mybookings.checkReservationNumberFromH1Text(this.state.bookingNumOnly);
    await this.pages.mybookings.checkReservationStatus(MYBOOKINGS_STATUS_CONFIRMED);
    await this.pages.mybookings.checkReservationBookerEmail(this.testData.user.email);
    await this.pages.mybookings.checkReservationBookerFirstName(this.testData.user.firstName);
    await this.pages.mybookings.checkReservationBookerLastName(this.testData.user.lastName);
    await this.pages.mybookings.checkReservationBookerPhone(this.testData.user.phone);
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkCancelButtonIsNotFoundInReservations();
    await this.pages.quickReservation.checkThePriceOfQuickReservation(SINGLEBOOKING_NO_PAYMENT);
  }

  @step("app_user.User Verifies Details Of Subvented Reservation After Admin Approval Without Payment")
  async userVerifiesDetailsOfSubventedReservationAfterAdminApprovalWithoutPayment() {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await log(
      "If the booking number comparison fails, verify that there are no duplicate times in the upcoming bookings list."
    );

    await this.pages.quickReservation.checkBookingNumber(this.state.bookingNumOnly);
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.adminModifiesTimeOfInfoCard);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(SINGLEBOOKING_NO_PAYMENT);
    await this.pages.mybookings.checkReservationStatus(MYBOOKINGS_STATUS_CONFIRMED);
    await this.pages.mybookings.checkReservationNumberFromH1Text(this.state.bookingNumOnly);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationAgeGroup(AGEGROUP_OF_PERSONS);
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkReservationBookerFirstName(this.testData.user.firstName);
    await this.pages.mybookings.checkReservationBookerLastName(this.testData.user.lastName);
    await this.pages.mybookings.checkReservationBookerPhone(this.testData.user.phone);
    await this.pages.mybookings.checkReservationBookerEmail(this.testData.user.email);
  }

  @step("app_user.User Checks The Rejected Reservation Info Is Right After Admin Handling")
  async userChecksTheRejectedReservationInfoIsRightAfterAdminHandling() {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await log(
      "If the booking number comparison fails, verify that there are no duplicate times in the upcoming bookings list."
    );

    await this.pages.quickReservation.checkBookingNumber(this.state.bookingNumOnly);
    await this.pages.quickReservation.checkTheQuickReservationTime(this.state.timeOfQuickReservation);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(ALWAYS_REQUESTED_UNIT_PAID_PRICE_VAT_INCL);
    await this.pages.mybookings.checkReservationStatus(MYBOOKINGS_STATUS_REJECTED);
    await this.pages.mybookings.checkReservationNumberFromH1Text(this.state.bookingNumOnly);
    await this.pages.mybookings.checkReservationPurpose(PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkNumberOfParticipants(SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationDescription(SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkReservationBookerFirstName(this.testData.user.firstName);
    await this.pages.mybookings.checkReservationBookerLastName(this.testData.user.lastName);
    await this.pages.mybookings.checkReservationBookerPhone(this.testData.user.phone);
    await this.pages.mybookings.checkReservationBookerEmail(this.testData.user.email);
  }

  // Calendar usage
  /**
   * This formats example like Ti 1.10.2024 klo 10:30–11:30
   * to DTSTART;TZID=Europe/Helsinki:20241001T103000, DTEND;TZID=Europe/Helsinki:20241001T113000
   */
  @step("app_user.User Saves File And Formats Booking Time To ICS")
  // oxlint-disable-next-line eslint/no-unused-vars -- the file is saved into the test's results folder
  async userSavesFileAndFormatsBookingTimeToIcs(file_path: string) {
    await this.pages.customKeywords.convertBookingTimeToIcsFormat(this.state.timeOfQuickReservationMinusT);

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
    await log(ICS_TEXT);
  }

  @step("app_user.User Checks That Calendar File Matches Booking Time")
  async userChecksThatCalendarFileMatchesBookingTime() {
    // Log for verification
    await log("Checking if ICS times match with booking times...");
    await log(`ICS Start Time: ${this.state.formattedStartToIcs}`);
    await log(`ICS End Time: ${this.state.formattedEndToIcs}`);
    await log(`Extracted Start Time: ${this.state.startTimeFromIcs}`);
    await log(`Extracted End Time: ${this.state.endTimeFromIcs}`);

    // Comparisons
    // Additional info: Check custom_keywords.Convert booking time to ICS format if the times don't match
    // Assert Start Times
    expect(this.state.startTimeFromIcs, "The start time in the calendar file").toBe(this.state.formattedStartToIcs);

    // Assert End Times
    expect(this.state.endTimeFromIcs, "The end time in the calendar file").toBe(this.state.formattedEndToIcs);
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
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(RECURRING_THU_22_23_OTHER);
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(RECURRING_THU_23_24_OTHER);
    await this.pages.recurringApplicationsPage2.userClicksAvailableSeasonalBookingTimesFor(
      RECURRING_BOOKING_UNIT_NAME_MALMI
    );
    await this.pages.recurringApplicationsPage2.userSelectsTypeOfTheBookingRequest(
      RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_SECONDARY
    );
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(
      RECURRING_THU_09_10_PREFERRED
    );
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(
      RECURRING_THU_10_11_PREFERRED
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
   * Verifies that the recurring reservation with the given name is no longer found
   * in the applications list. Fails if the reservation is still present.
   */
  @step("app_user.User Verifies The Recurring Reservation Is Cancelled")
  async userVerifiesTheRecurringReservationIsCancelled() {
    await this.pages.customKeywords.verifyCardNotFoundInGroupWithMatchingConditions(
      EMPTY_STATE_MESSAGE_RECURRING_APPLICATIONS
    );
  }

  // MOBILE
  @step("app_user.User Navigates To Single Booking Page Mobile")
  async userNavigatesToSingleBookingPageMobile() {
    await this.pages.topnav.navigateToSingleBookingPageMobile();
  }

  @step("app_user.User Checks Cancelled Booking Is Found Mobile")
  async userChecksCancelledBookingIsFoundMobile(unitname_mybookings: string, time_of_quick_reservation_minusT: string) {
    await this.pages.topnav.clickTablistScrollButtonToRightMobile();
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

  // Misc
  @step("app_user.User Checks That Reservation Unit Picture Is Loaded")
  async userChecksThatReservationUnitPictureIsLoaded(unit_name: string) {
    // Target the image by its alt text - this is the most reliable selector
    const image = this.page.locator(`img[alt*="${unit_name}"]`).first();

    // Wait for the image element to be attached
    await expect(image, `Reservation unit picture for ${unit_name} is not present`).toBeAttached({ timeout: 5000 });

    // Verify the src attribute is present
    await expect(image, "Image src attribute is empty").toHaveAttribute("src", /.+/);

    // Verify the image has actually loaded (not broken): complete is true, naturalWidth > 0 and naturalHeight > 0.
    // Port: expect.poll waits for the image to load, instead of checking once.
    await expect
      .poll(
        () =>
          image.evaluate((element) => {
            const img = element as HTMLImageElement;
            return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
          }),
        { message: "Image is not loaded: complete is false, or naturalWidth or naturalHeight is 0" }
      )
      .toBe(true);

    // Get and log the image dimensions for debugging
    const { width, height } = await image.evaluate((element) => ({
      width: (element as HTMLImageElement).naturalWidth,
      height: (element as HTMLImageElement).naturalHeight,
    }));
    await log(`Image loaded successfully with dimensions: ${width}x${height}`);
  }
}
