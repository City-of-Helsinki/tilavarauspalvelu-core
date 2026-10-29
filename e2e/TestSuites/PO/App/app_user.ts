import { test } from "@playwright/test";
/** Port of PO/App/app_user.robot */
import { OperatingSystem } from "../../../lib/OperatingSystem";
import { PabotLib } from "../../../lib/PabotLib";
import { retry } from "../../../lib/retry";
import "../../Resources/parallel_test_data";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import { V, isTruthy, str, step, expect, log } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { PageObject } from "../../page-object";

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
    await this.pages.userLandingpage.checkTheUserLandingPageH1(V.USER_LANDING_PAGE_H1_TEXT);
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
  async openUnitFromSearchResults(nameoftheunit: RobotValue) {
    let url: RobotValue, unit_page_open: RobotValue;
    url = this.page.url();
    unit_page_open = str(url).includes("/reservation-unit/");
    if (isTruthy(unit_page_open)) {
      return;
    }

    await this.pages.customKeywords.findAndClickElementWithText(
      '[data-testid="list-with-pagination__list--container"] >> [data-testid="card__heading"]',
      nameoftheunit
    );
    await this.pages.customKeywords.waitForUrlToContain("/reservation-unit/", /* timeout= */ "8s");
  }

  /**
   * here is keyword --> data_modification.Set info card duration time info
   * that sets $TIME_OF_QUICK_RESERVATION and $TIME_OF_QUICK_RESERVATION_MINUS_T
   */
  @step("app_user.User Selects The Time With Quick Reservation And Sets Time Variables")
  async userSelectsTheTimeWithQuickReservationAndSetsTimeVariables() {
    let quick_reservation_current_date_value: RobotValue,
      formatted_date: RobotValue,
      formatted_date_minus_t: RobotValue;
    await this.page.locator("#quick-reservation").waitFor({ state: "visible" });
    await this.pages.quickReservation.selectDuration(V.QUICK_RESERVATION_DURATION);

    // Checks that calendar opens and has all the buttons inside
    await this.pages.quickReservation.confirmsDatePickerOpensFromQuickReservation();

    quick_reservation_current_date_value = await this.pages.quickReservation.getTheValueFromDateInput();

    // This sets ${TIME_OF_QUICK_RESERVATION_FREE_SLOT}
    await this.pages.quickReservation.selectTheFreeSlotFromQuickReservation();

    await log(V.TIME_OF_QUICK_RESERVATION_FREE_SLOT);

    [formatted_date, formatted_date_minus_t] = await this.pages.dataModification.setInfoCardDurationTimeInfo(
      V.TIME_OF_QUICK_RESERVATION_FREE_SLOT,
      quick_reservation_current_date_value
    );

    V.TIME_OF_QUICK_RESERVATION = formatted_date;
    V.TIME_OF_QUICK_RESERVATION_MINUS_T = formatted_date_minus_t;

    await log(V.TIME_OF_QUICK_RESERVATION);
    await log(V.TIME_OF_QUICK_RESERVATION_MINUS_T);
  }

  /**
   * Selects a free slot in quick reservation and submits it.
   * A unit lock keeps parallel tests from picking overlapping slots.
   */
  @step("app_user.User Reserves A Free Quick Reservation Slot")
  async userReservesAFreeQuickReservationSlot() {
    let lock_name: RobotValue;
    lock_name = await this.pages.quickReservation.getUnitLockName();
    await PabotLib["Acquire Lock"](lock_name);
    try {
      await retry(3, 2000, () => this.userSelectsAndSubmitsQuickReservationOnFreshPage());
    } finally {
      await PabotLib["Release Lock"](lock_name);
    }
  }

  @step("app_user.User Selects And Submits Quick Reservation On Fresh Page")
  async userSelectsAndSubmitsQuickReservationOnFreshPage() {
    await this.pages.quickReservation.reloadReservationUnitPageAndWaitForReservations();
    await this.userSelectsTheTimeWithQuickReservationAndSetsTimeVariables();
    await this.pages.quickReservation.userClicksSubmitButtonInQuickReservation();
  }

  @step("app_user.User Checks That Quick Reservation Does Not Have Reserved Time")
  async userChecksThatQuickReservationDoesNotHaveReservedTime(reservationtime: RobotValue) {
    await log(reservationtime);
    await this.pages.quickReservation.verifyTimeSlotNotAvailable(reservationtime);
  }

  /**
   * This keyword uses data_modification.Convert finnish short day to english and
   * data_modification.Compute reservation timeslot to set variables
   */
  @step("app_user.User Checks That Reservation Calendar Does Not Have Reserved Time Slot Available")
  async userChecksThatReservationCalendarDoesNotHaveReservedTimeSlotAvailable() {
    await log(`This keyword sets the variable '${str(V.ENGLISH_DAY)}'`);
    await this.pages.dataModification.convertFinnishShortDayToEnglish(V.TIME_OF_QUICK_RESERVATION);

    await log(`This keyword sets the variable '${str(V.CALENDAR_TIMESLOT)}'`);
    await this.pages.dataModification.computeReservationTimeSlot(
      V.TIME_OF_QUICK_RESERVATION_FREE_SLOT,
      V.QUICK_RESERVATION_DURATION
    );

    await this.pages.customKeywords.verifyReservationSlotExists(V.CALENDAR_TIMESLOT, V.ENGLISH_DAY);
  }

  @step("app_user.User Fills The Reservation Info For Always Free Unit And Submits")
  async userFillsTheReservationInfoForAlwaysFreeUnitAndSubmits() {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible({ timeout: 10_000 });
    await this.pages.reservationUnitReserverInfo.checkApplicationCannotBeMadeWithoutInfo();
    await this.pages.reservationUnitReserverInfo.enterFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.reservationUnitReserverInfo.enterLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.reservationUnitReserverInfo.enterEmail(V.CURRENT_USER_EMAIL);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(V.CURRENT_USER_PHONE);
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills The Reservation Info For Unit With Payment And Submits")
  async userFillsTheReservationInfoForUnitWithPaymentAndSubmits() {
    // Checks that "jatka" button has been loaded
    // Verify we are on the correct booking details page where user info can be given
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible({ timeout: 10_000 });
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(V.SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(V.PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(V.RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.reservationUnitReserverInfo.enterLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.reservationUnitReserverInfo.enterEmail(V.CURRENT_USER_EMAIL);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(V.CURRENT_USER_PHONE);
    await this.pages.reservationUnitReserverInfo.selectHomeCity(V.HOME_CITY);
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Subvented Booking Details As Individual And Submits")
  async userFillsSubventedBookingDetailsAsIndividualAndSubmits(justification_for_not_paying: string) {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible({ timeout: 10_000 });
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(V.SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(V.PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.clickAndSelectAgeGroupButton(V.AGEGROUP_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitBookingDetails.clickToApplyForAFreeBooking();
    await this.pages.reservationUnitBookingDetails.typeJustificationForFreeOfCharge(justification_for_not_paying);
    await this.pages.reservationUnitReserverTypes.selectReserverType(V.RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.reservationUnitReserverInfo.enterLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.reservationUnitReserverInfo.enterEmail(V.CURRENT_USER_EMAIL);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(V.CURRENT_USER_PHONE);
    await this.pages.reservationUnitReserverInfo.selectHomeCity(V.HOME_CITY);
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Noncancelable Booking Details As Individual And Submits")
  async userFillsNoncancelableBookingDetailsAsIndividualAndSubmits() {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible({ timeout: 10_000 });
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(V.RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.reservationUnitReserverInfo.enterLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.reservationUnitReserverInfo.enterEmail(V.CURRENT_USER_EMAIL);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(V.CURRENT_USER_PHONE);
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Info For Unit That Is Always Handled As Individual And Submits")
  async userFillsInfoForUnitThatIsAlwaysHandledAsIndividualAndSubmits() {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible({ timeout: 10_000 });
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(V.SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(V.PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(V.RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.reservationUnitReserverInfo.enterLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.reservationUnitReserverInfo.enterEmail(V.CURRENT_USER_EMAIL);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(V.CURRENT_USER_PHONE);
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Fills Booking Details As Individual For Reservation With Access Code And Submits")
  async userFillsBookingDetailsAsIndividualForReservationWithAccessCodeAndSubmits() {
    // Checks that "jatka" button has been loaded
    await expect(
      this.page.getByTestId("reservation__button--continue"),
      "ERROR: Continue button not found on the booking details page. Check from screenshot that we are on the page where user information should be entered."
    ).toBeVisible({ timeout: 10_000 });
    await this.pages.reservationUnitBookingDetails.typeTheNameOfTheBooking(V.SINGLEBOOKING_NAME);
    await this.pages.reservationUnitBookingDetails.selectThePurposeOfTheBooking(V.PURPOSE_OF_THE_BOOKING);
    await this.pages.reservationUnitBookingDetails.selectTheNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.clickAndSelectAgeGroupButton(V.AGEGROUP_OF_PERSONS);
    await this.pages.reservationUnitBookingDetails.typeTheDescriptionOfTheBooking(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.reservationUnitReserverTypes.selectReserverType(V.RESERVATION_INDIVIDUAL);
    await this.pages.reservationUnitReserverInfo.enterFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.reservationUnitReserverInfo.enterLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.reservationUnitReserverInfo.enterEmail(V.CURRENT_USER_EMAIL);
    await this.pages.reservationUnitReserverInfo.enterPhoneNumber(V.CURRENT_USER_PHONE);
    await this.pages.reservationUnitReserverInfo.selectHomeCity(V.HOME_CITY);
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Checks Unit That Is Always Handled Details Are Right Before Submit")
  async userChecksUnitThatIsAlwaysHandledDetailsAreRightBeforeSubmit() {
    await this.pages.reservationUnitReservationReceipt.checkSingleBookingInfo();
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.quickReservation.checkThePriceOfQuickReservation(V.SINGLEBOOKING_PAID_PRICE_VAT_INCL);
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
  }

  @step("app_user.User Checks Unit That Is Always Handled Details Are Right After Submit")
  async userChecksUnitThatIsAlwaysHandledDetailsAreRightAfterSubmit() {
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      V.SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.quickReservation.getBookingNumber();
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(
      V.RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
  }

  @step("app_user.User Checks The Free Single Booking Details Are Right")
  async userChecksTheFreeSingleBookingDetailsAreRight() {
    await this.pages.reservationUnitReservationReceipt.checkFreeSingleBookingInfo();
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      V.SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.reservationLownav.clickSubmitButtonContinue();
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      V.SINGLEBOOKING_PAID_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.quickReservation.getBookingNumber();
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(
      V.RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
  }

  @step("app_user.User Checks The Paid Reservation Info Is Right And Submits")
  async userChecksThePaidReservationInfoIsRightAndSubmits() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Checks The Subvented Reservation Info Is Right And Submits")
  async userChecksTheSubventedReservationInfoIsRightAndSubmits() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      V.SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.reservationLownav.clickSubmitButtonContinue();
  }

  @step("app_user.User Checks The Subvented Reservation Info Is Right After Submitting")
  async userChecksTheSubventedReservationInfoIsRightAfterSubmitting() {
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(
      V.SINGLEBOOKING_SUBVENTED_PRICE_NEEDS_TO_BE_HANDLED_VAT_INCL
    );
    await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Paid Reservation That Requires Handling Info Is Right And Submits")
  async userChecksThePaidReservationThatRequiresHandlingInfoIsRightAndSubmits() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationLownav.clickSubmitButtonContinue();
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(
      V.RESERVATION_STATUS_REQUIRESHANDLING_MSG_FI
    );
    await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Paid Reservation Info Is Right After Checkout")
  async userChecksThePaidReservationInfoIsRightAfterCheckout() {
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(V.RESERVATION_STATUS_MSG_FI);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(V.SINGLEBOOKING_PAID_PRICE_VAT_INCL);
    await this.pages.quickReservation.checkBookingNumber(V.BOOKING_NUM_ONLY);
  }

  @step("app_user.User Checks The Reservation Info Is Right Before Submit")
  async userChecksTheReservationInfoIsRightBeforeSubmit() {
    await this.pages.reservationUnitReservationReceipt.checkReservationUserInfo();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
  }

  @step("app_user.User Checks The Reservation Info Is Right After Submit")
  async userChecksTheReservationInfoIsRightAfterSubmit() {
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(V.RESERVATION_STATUS_MSG_FI);
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
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(V.RESERVATION_STATUS_MSG_FI);
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
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.reservationUnitReservationReceipt.checkTheReservationStatusMessage(V.RESERVATION_STATUS_MSG_FI);
    await this.pages.quickReservation.getBookingNumber();
  }

  @step("app_user.User Checks The Modified Reservation Info Is Right And Clicks Continue")
  async userChecksTheModifiedReservationInfoIsRightAndClicksContinue() {
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxAcceptedTerms();
    await this.pages.reservationUnitReservationReceipt.clickTheCheckboxGenericTerms();
    await log(V.TIME_OF_QUICK_RESERVATION_MODIFIED);
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION_MODIFIED);
    // TODO: Separate the submit and the next page check into their own keywords
    await this.pages.reservationLownav.clickSubmitButtonContinue();
    // The edit page has the same time card, wait for the reservation page itself
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible", timeout: 15_000 });

    await log("This check is done in reservations page");
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION_MODIFIED);
  }

  @step("app_user.User Cancel Booking In Reservations And Checks It Got Cancelled")
  async userCancelBookingInReservationsAndChecksItGotCancelled() {
    await this.pages.mybookings.userCancelBooking();
    await this.pages.mybookings.clickReasonForCancellation();
    await this.pages.mybookings.selectReasonForCancellation(V.REASON_FOR_CANCELLATION);
    await this.pages.mybookings.clickCancelButton();
    await this.pages.mybookings.checkReservationStatus(V.IN_RESERVATIONS_STATUS_CANCELED);
    await this.pages.quickReservation.checkBookingNumber(V.BOOKING_NUM_ONLY);
  }

  @step("app_user.User Modifies Booking And Verifies The Changes")
  async userModifiesBookingAndVerifiesTheChanges() {
    let date_value_from_calendar: RobotValue, formatted_date: RobotValue, formatted_date_minus_t: RobotValue;
    await this.pages.mybookings.userClickChangeTime();
    // This opens calendar controls
    await this.pages.reservationCalendar.userClickReservationCalendarToggleButton();

    await this.pages.reservationCalendar.selectDurationCalendar(V.QUICK_RESERVATION_DURATION);

    // This sets ${CALENDAR_CONTROL_TIME_OF_FREE_SLOT}
    await this.pages.reservationCalendar.clickAndStoreFreeReservationTime();

    date_value_from_calendar = await this.pages.reservationCalendar.getCurrentDateFromDatepicker();

    // Formats modified date from variables like 15.30 and 15.6.2024. formatting uses 1h duration
    [formatted_date, formatted_date_minus_t] = await this.pages.dataModification.setInfoCardDurationTimeInfo(
      V.CALENDAR_CONTROL_TIME_OF_FREE_SLOT,
      date_value_from_calendar
    );

    V.TIME_OF_QUICK_RESERVATION_MODIFIED = formatted_date;
    V.TIME_OF_QUICK_RESERVATION_MINUS_T_MODIFIED = formatted_date_minus_t;

    // Log  ${returned_formatted_values}
    await log(V.TIME_OF_QUICK_RESERVATION_MODIFIED);
    await log(V.TIME_OF_QUICK_RESERVATION_MINUS_T_MODIFIED);

    await log("If the continue button is not enabled, verify that the reservation time was actually modified");
    await expect(this.page.getByTestId("reservation__button--continue")).toBeEnabled({ timeout: 10_000 });
    await this.pages.reservationCalendar.clickContinueButton();
  }

  @step("app_user.User Checks Cancelled Booking Is Found")
  async userChecksCancelledBookingIsFound(unitname_mybookings: string, time_of_quick_reservation_minusT: RobotValue) {
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
  async userCanSeeUpcomingBookingInListAndClicksIt(unitname: string, reservationtime: RobotValue) {
    await log(unitname);
    await log(reservationtime);
    // The list is fetched once when the page opens, so reload it if the booking is not in it
    await this.pages.customKeywords.retryWithRecovery(
      (...args: Parameters<typeof this.pages.mybookings.checkUnitnameAndReservationTimeAndClickShow>) =>
        this.pages.mybookings.checkUnitnameAndReservationTimeAndClickShow(...args),
      async () => {
        await this.page.reload();
      },
      unitname,
      reservationtime
    );
  }

  @step("app_user.User Can See Upcoming Noncancelable Booking In List And Clicks It")
  async userCanSeeUpcomingNoncancelableBookingInListAndClicksIt(unitname: string, reservationtime: RobotValue) {
    await log(unitname);
    await log(reservationtime);
    await this.pages.mybookings.checkMyBookingsH1(V.MYBOOKINGS_FI);
    await this.pages.customKeywords.retryWithRecovery(
      (...args: Parameters<typeof this.pages.mybookings.checkUnitnameAndReservationTimeAndVerifyNoCancelButton>) =>
        this.pages.mybookings.checkUnitnameAndReservationTimeAndVerifyNoCancelButton(...args),
      async () => {
        await this.page.reload();
      },
      unitname,
      reservationtime
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
    time_in_quickreservations: RobotValue,
    reservation_number: RobotValue
  ) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationsPaymentStatus(payment_status);
    await this.pages.mybookings.checkReservationBookerEmail(V.CURRENT_USER_EMAIL);
    await this.pages.mybookings.checkReservationBookerFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.mybookings.checkReservationBookerLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.mybookings.checkReservationBookerPhone(V.CURRENT_USER_PHONE);
    await this.pages.mybookings.checkReservationDescription(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationPurpose(V.PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkReservationNumberFromH1Text(reservation_number);
  }

  @step("app_user.User Checks Booking Info In Reservations With Number Of Participants And Description And Purpose")
  async userChecksBookingInfoInReservationsWithNumberOfParticipantsAndDescriptionAndPurpose(
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: RobotValue
  ) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkBookingNumber(V.BOOKING_NUM_ONLY);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(V.BOOKING_NUM_ONLY);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationBookerEmail(V.CURRENT_USER_EMAIL);
    await this.pages.mybookings.checkReservationBookerFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.mybookings.checkReservationBookerLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.mybookings.checkReservationBookerPhone(V.CURRENT_USER_PHONE);
    await this.pages.mybookings.checkReservationDescription(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationPurpose(V.PURPOSE_OF_THE_BOOKING);
  }

  @step("app_user.User Checks Booking Info In Reservations")
  async userChecksBookingInfoInReservations(
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: RobotValue
  ) {
    await this.page.getByTestId("reservation__reservation-info-card__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkBookingNumber(V.BOOKING_NUM_ONLY);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(V.BOOKING_NUM_ONLY);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationBookerEmail(V.CURRENT_USER_EMAIL);
    await this.pages.mybookings.checkReservationBookerFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.mybookings.checkReservationBookerLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.mybookings.checkReservationBookerPhone(V.CURRENT_USER_PHONE);
  }

  @step("app_user.User Checks Booking Info In Reservations With Access Code")
  async userChecksBookingInfoInReservationsWithAccessCode(
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: RobotValue,
    access_code: RobotValue
  ) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkBookingNumber(V.BOOKING_NUM_ONLY);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(V.BOOKING_NUM_ONLY);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationBookerEmail(V.CURRENT_USER_EMAIL);
    await this.pages.mybookings.checkReservationBookerFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.mybookings.checkReservationBookerLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.mybookings.checkReservationBookerPhone(V.CURRENT_USER_PHONE);
    await this.pages.mybookings.checkReservationAccessCode(access_code);
  }

  @step("app_user.User Checks Booking Info In Reservations With All Reservation Info")
  async userChecksBookingInfoInReservationsWithAllReservationInfo(
    booking_status: string,
    booking_price: string,
    time_in_quickreservations: RobotValue
  ) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.quickReservation.checkTheQuickReservationTime(time_in_quickreservations);
    await this.pages.quickReservation.checkBookingNumber(V.BOOKING_NUM_ONLY);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(booking_price);

    await this.pages.mybookings.checkReservationNumberFromH1Text(V.BOOKING_NUM_ONLY);
    await this.pages.mybookings.checkReservationStatus(booking_status);
    await this.pages.mybookings.checkReservationNumberFromH1Text(V.BOOKING_NUM_ONLY);
    await this.pages.mybookings.checkReservationBookerEmail(V.CURRENT_USER_EMAIL);
    await this.pages.mybookings.checkReservationBookerFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.mybookings.checkReservationBookerLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.mybookings.checkReservationBookerPhone(V.CURRENT_USER_PHONE);
    await this.pages.mybookings.checkReservationDescription(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationPurpose(V.PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkReservationAgeGroup(V.AGEGROUP_OF_PERSONS);
  }

  @step("app_user.User Checks Booking Info In Reservations For Noncancelable Booking")
  async userChecksBookingInfoInReservationsForNoncancelableBooking() {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });

    await this.pages.mybookings.checkReservationNumberFromH1Text(V.BOOKING_NUM_ONLY);
    await this.pages.mybookings.checkReservationStatus(V.MYBOOKINGS_STATUS_CONFIRMED);
    await this.pages.mybookings.checkReservationBookerEmail(V.CURRENT_USER_EMAIL);
    await this.pages.mybookings.checkReservationBookerFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.mybookings.checkReservationBookerLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.mybookings.checkReservationBookerPhone(V.CURRENT_USER_PHONE);
    await this.pages.mybookings.checkReservationDescription(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkCancelButtonIsNotFoundInReservations();
    await this.pages.quickReservation.checkThePriceOfQuickReservation(V.SINGLEBOOKING_NO_PAYMENT);
  }

  @step("app_user.User Verifies Details Of Subvented Reservation After Admin Approval Without Payment")
  async userVerifiesDetailsOfSubventedReservationAfterAdminApprovalWithoutPayment() {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await log(
      "If the booking number comparison fails, verify that there are no duplicate times in the upcoming bookings list."
    );

    await this.pages.quickReservation.checkBookingNumber(V.BOOKING_NUM_ONLY);
    await this.pages.quickReservation.checkTheQuickReservationTime(V.ADMIN_MODIFIES_TIME_OF_INFO_CARD);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(V.SINGLEBOOKING_NO_PAYMENT);
    await this.pages.mybookings.checkReservationStatus(V.MYBOOKINGS_STATUS_CONFIRMED);
    await this.pages.mybookings.checkReservationNumberFromH1Text(V.BOOKING_NUM_ONLY);
    await this.pages.mybookings.checkReservationPurpose(V.PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationAgeGroup(V.AGEGROUP_OF_PERSONS);
    await this.pages.mybookings.checkReservationDescription(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkReservationBookerFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.mybookings.checkReservationBookerLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.mybookings.checkReservationBookerPhone(V.CURRENT_USER_PHONE);
    await this.pages.mybookings.checkReservationBookerEmail(V.CURRENT_USER_EMAIL);
  }

  @step("app_user.User Checks The Rejected Reservation Info Is Right After Admin Handling")
  async userChecksTheRejectedReservationInfoIsRightAfterAdminHandling() {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await log(
      "If the booking number comparison fails, verify that there are no duplicate times in the upcoming bookings list."
    );

    await this.pages.quickReservation.checkBookingNumber(V.BOOKING_NUM_ONLY);
    await this.pages.quickReservation.checkTheQuickReservationTime(V.TIME_OF_QUICK_RESERVATION);
    await this.pages.quickReservation.checkThePriceOfQuickReservation(V.ALWAYS_REQUESTED_UNIT_PAID_PRICE_VAT_INCL);
    await this.pages.mybookings.checkReservationStatus(V.MYBOOKINGS_STATUS_REJECTED);
    await this.pages.mybookings.checkReservationNumberFromH1Text(V.BOOKING_NUM_ONLY);
    await this.pages.mybookings.checkReservationPurpose(V.PURPOSE_OF_THE_BOOKING);
    await this.pages.mybookings.checkNumberOfParticipants(V.SINGLEBOOKING_NUMBER_OF_PERSONS);
    await this.pages.mybookings.checkReservationDescription(V.SINGLEBOOKING_DESCRIPTION);
    await this.pages.mybookings.checkReservationBookerFirstName(V.CURRENT_USER_FIRST_NAME);
    await this.pages.mybookings.checkReservationBookerLastName(V.CURRENT_USER_LAST_NAME);
    await this.pages.mybookings.checkReservationBookerPhone(V.CURRENT_USER_PHONE);
    await this.pages.mybookings.checkReservationBookerEmail(V.CURRENT_USER_EMAIL);
  }

  // Calendar usage
  /**
   * This formats example like Ti 1.10.2024 klo 10:30–11:30
   * to DTSTART;TZID=Europe/Helsinki:20241001T103000, DTEND;TZID=Europe/Helsinki:20241001T113000
   */
  @step("app_user.User Saves File And Formats Booking Time To ICS")
  async userSavesFileAndFormatsBookingTimeToIcs(file_path: string) {
    let saved_path: string, content: RobotValue, ICS_TEXT: RobotValue;
    // Ensure the directory exists
    await OperatingSystem["Create Directory"](file_path);
    await OperatingSystem["Directory Should Exist"](file_path);

    await this.pages.customKeywords.convertBookingTimeToIcsFormat(V.TIME_OF_QUICK_RESERVATION_MINUS_T);

    // Create a promise that waits for the download
    const download_promise = this.page.waitForEvent("download");

    // Saves the calendar file
    await this.page.getByTestId("reservation__button--calendar-link").click();

    // Wait for the file to be fully downloaded, and save it into the test's results folder
    const download = await download_promise;
    saved_path = test.info().outputPath(download.suggestedFilename());
    await download.saveAs(saved_path);

    // Confirm that the file exists and is not empty
    await OperatingSystem["File Should Exist"](saved_path);

    // Retrieves text content from the downloaded file and sets it as a suite variable
    content = await OperatingSystem["Get File"](saved_path);
    ICS_TEXT = content;
    V.ICS_TEXT_FROM_FILE = ICS_TEXT;

    // Extracts the DTSTART and DTEND timestamps from an ICS file's text
    // example --> DTSTART;TZID=Europe/Helsinki:20241003T083000 and DTEND;TZID=Europe/Helsinki:20241003T093000
    await this.pages.customKeywords.extractStartAndEndTimeFromIcsFile(V.ICS_TEXT_FROM_FILE);
    await log(ICS_TEXT);
  }

  @step("app_user.User Checks That Calendar File Matches Booking Time")
  async userChecksThatCalendarFileMatchesBookingTime() {
    let start_times_equal: RobotValue, end_times_equal: RobotValue;
    // Log for verification
    await log("Checking if ICS times match with booking times...");
    await log(`ICS Start Time: ${str(V.FORMATTED_START_TO_ICS)}`);
    await log(`ICS End Time: ${str(V.FORMATTED_END_TO_ICS)}`);
    await log(`Extracted Start Time: ${str(V.START_TIME_FROM_ICS)}`);
    await log(`Extracted End Time: ${str(V.END_TIME_FROM_ICS)}`);

    // Comparisons
    // Assert Start Times
    start_times_equal = V.START_TIME_FROM_ICS === V.FORMATTED_START_TO_ICS;
    if (!isTruthy(start_times_equal)) {
      // Additional info: Check custom_keywords.Convert booking time to ICS format if variables don't match
      throw new Error(
        `The start times do not match: Expected ${str(V.START_TIME_FROM_ICS)}, but got ${str(V.FORMATTED_START_TO_ICS)}.`
      );
    }

    // Assert End Times
    end_times_equal = V.END_TIME_FROM_ICS === V.FORMATTED_END_TO_ICS;
    if (!isTruthy(end_times_equal)) {
      // Additional info: Check custom_keywords.Convert booking time to ICS format if variables don't match
      throw new Error(
        `The end times do not match: Expected ${str(V.END_TIME_FROM_ICS)}, but got ${str(V.FORMATTED_END_TO_ICS)}.`
      );
    }
  }

  // Recurring
  @step("app_user.User Fills In The Application Details For Recurring Application")
  async userFillsInTheApplicationDetailsForRecurringApplication() {
    await this.pages.recurringApplications.userSelectsTheDefaultTimePeriodForTheRecurringReservation();
    await this.pages.recurringApplications.userFillsTheRecurringReservationName(V.RECURRING_BOOKING_NAME);
    await this.pages.recurringApplications.userFillsTheNumberOfPeopleInTheRecurringReservation(
      V.RECURRING_BOOKING_SIZE_OF_GROUP
    );
    await this.pages.recurringApplications.userFillsTheAgeGroupInTheRecurringReservation(
      V.RECURRING_BOOKING_AGE_GROUP_TEXT
    );
    await this.pages.recurringApplications.userChoosesThePurposeOfTheRecurringReservation(
      V.RECURRING_BOOKING_PURPOSE_TEXT
    );
    await this.pages.recurringApplications.userSelectsTheMinimumLengthForTheRecurringReservation(
      V.RECURRING_BOOKING_MIN_LENGTH_TEXT
    );
    await this.pages.recurringApplications.userSelectsTheMaximumLengthForTheRecurringReservation(
      V.RECURRING_BOOKING_MAX_LENGTH_TEXT
    );
    await this.pages.recurringApplications.userSelectsTheAmountOfReservationsPerWeek(
      V.RECURRING_BOOKING_RESERVATION_PER_WEEK
    );
    await this.pages.recurringApplications.userClicksContinueButton();
  }

  @step("app_user.User Selects Times For Recurring Application")
  async userSelectsTimesForRecurringApplication() {
    await this.pages.recurringApplicationsPage2.userSelectsTypeOfTheBookingRequest(
      V.RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_PRIMARY
    );
    await this.pages.recurringApplicationsPage2.userClicksAvailableSeasonalBookingTimesFor(
      V.RECURRING_BOOKING_UNIT_NAME_KESKUSTA
    );
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(V.RECURRING_THU_22_23_OTHER);
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(V.RECURRING_THU_23_24_OTHER);
    await this.pages.recurringApplicationsPage2.userClicksAvailableSeasonalBookingTimesFor(
      V.RECURRING_BOOKING_UNIT_NAME_MALMI
    );
    await this.pages.recurringApplicationsPage2.userSelectsTypeOfTheBookingRequest(
      V.RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_SECONDARY
    );
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(
      V.RECURRING_THU_09_10_PREFERRED
    );
    await this.pages.recurringApplicationsPage2.userSelectsTheTimesForRecurringApplication(
      V.RECURRING_THU_10_11_PREFERRED
    );
    await this.pages.recurringApplicationsPage2.userClicksContinueButton();
  }

  @step("app_user.User Fills In The Application User Info Details")
  async userFillsInTheApplicationUserInfoDetails() {
    await this.pages.recurringApplicationsPage3.userSelectsWhoIsTheApplicationCreatedFor("INDIVIDUAL");
    await this.pages.recurringApplicationsPage3.userTypesFirstName(V.RECURRING_BOOKING_FIRST_NAME);
    await this.pages.recurringApplicationsPage3.userTypesLastName(V.RECURRING_BOOKING_LAST_NAME);
    await this.pages.recurringApplicationsPage3.userTypesStreetAddress(V.RECURRING_BOOKING_STREET_ADDRESS);
    await this.pages.recurringApplicationsPage3.userTypesPostCode(V.RECURRING_BOOKING_POST_CODE);
    await this.pages.recurringApplicationsPage3.userTypesCity(V.RECURRING_BOOKING_CITY);
    await this.pages.recurringApplicationsPage3.userTypesPhoneNumber(V.RECURRING_BOOKING_PHONE_NUMBER);
    await this.pages.recurringApplicationsPage3.userTypesEmail(V.RECURRING_BOOKING_EMAIL);
    await this.pages.recurringApplicationsPage3.userTypesAdditionalInformation(V.RECURRING_BOOKING_ADDITIONAL_INFO);
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
    await this.pages.customKeywords.findAndClickButtonInGroupWithMatchingConditions(
      '[data-testid="applications__group--wrapper"]',
      "Vastaanotettu",
      '[class*="Card__CardContent"]',
      '[data-testid="card__heading"]',
      "Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)",
      '[data-testid="card__tags"]',
      "Lähetetty",
      "Peru"
    );

    // The click waits until the modal's animation has ended
    await this.pages.customKeywords.findAndClickElementWithText("#application-card-modal >> span", "Kyllä");
  }

  /**
   * Verifies that the recurring reservation with the given name is no longer found
   * in the applications list. Fails if the reservation is still present.
   */
  @step("app_user.User Verifies The Recurring Reservation Is Cancelled")
  async userVerifiesTheRecurringReservationIsCancelled() {
    await this.pages.customKeywords.verifyCardNotFoundInGroupWithMatchingConditions(
      V.EMPTY_STATE_MESSAGE_RECURRING_APPLICATIONS
    );
  }

  // MOBILE
  @step("app_user.User Navigates To Single Booking Page Mobile")
  async userNavigatesToSingleBookingPageMobile() {
    await this.pages.topnav.navigateToSingleBookingPageMobile();
  }

  @step("app_user.User Checks Cancelled Booking Is Found Mobile")
  async userChecksCancelledBookingIsFoundMobile(
    unitname_mybookings: string,
    time_of_quick_reservation_minusT: RobotValue
  ) {
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
    let img_selector: string,
      src: RobotValue,
      complete: RobotValue,
      natural_width: RobotValue,
      natural_height: RobotValue,
      width: RobotValue,
      height: RobotValue;
    // Target the image by its alt text - this is the most reliable selector
    img_selector = `img[alt*="${unit_name}"]`;

    const image = this.page.locator(img_selector).first();

    // Wait for the image element to be attached
    await expect(image, `Reservation unit picture for ${unit_name} is not present`).toBeAttached({ timeout: 5000 });

    // Verify the src attribute is present
    src = await image.getAttribute("src");
    expect(src, "Image src attribute is empty").toBeTruthy();

    // Verify the image has actually loaded (not broken)
    // Check that image.complete is true, naturalWidth > 0, and naturalHeight > 0
    complete = await image.evaluate((element) => (element as HTMLImageElement).complete);
    expect(isTruthy(complete), "Image is not fully loaded (complete property is false)").toBe(true);

    natural_width = await image.evaluate((element) => (element as HTMLImageElement).naturalWidth);
    expect(Number(natural_width), "Image naturalWidth is 0 - image failed to load").toBeGreaterThan(0);

    natural_height = await image.evaluate((element) => (element as HTMLImageElement).naturalHeight);
    expect(Number(natural_height), "Image naturalHeight is 0 - image failed to load").toBeGreaterThan(0);

    // Get and log the image dimensions for debugging
    width = await image.evaluate((element) => (element as HTMLImageElement).naturalWidth);
    height = await image.evaluate((element) => (element as HTMLImageElement).naturalHeight);
    await log(`Image loaded successfully with dimensions: ${str(width)}x${str(height)}`);
  }
}
