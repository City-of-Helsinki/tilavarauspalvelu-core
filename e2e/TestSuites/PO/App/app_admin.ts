/** Port of PO/App/app_admin.robot */
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import {
  ADMIN_REASON_REJECTED,
  ADMIN_STATUS_PROCESSED,
  DEFAULT_PRICE_ALWAYS_REQUESTED_UNIT,
  MYBOOKINGS_STATUS_CONFIRMED,
  MYBOOKINGS_STATUS_REJECTED,
  NOTIFICATION_BANNER_CLEANUP_PATTERN,
  NOTIFICATION_BANNER_MESSAGE_ERROR,
  NOTIFICATION_BANNER_MESSAGE_NORMAL,
  NOTIFICATION_BANNER_MESSAGE_WARNING,
  PURPOSE_OF_THE_BOOKING,
  RESERVATION_STATUS_DIALOG,
  RESERVATION_TIME_NOT_FREE,
  SINGLEBOOKING_DESCRIPTION,
  SINGLEBOOKING_NO_PAYMENT_ADMIN_SIDE,
  SINGLEBOOKING_NUMBER_OF_PERSONS,
  SINGLEBOOKING_SUBVENTED_ADMIN_SIDE_AGE_GROUP,
  SINGLEBOOKING_SUBVENTED_PRICE_ADMIN_SIDE,
} from "../../Resources/texts_FI";
import { ALWAYS_PAID_UNIT_SUBVENTED_WITH_UNIT_LOCATION } from "../../Resources/variables";

export class AppAdmin extends PageObject {
  @step("app_admin.Admin Checks The Info And Sets Reservation Free And Approves It")
  async adminChecksTheInfoAndSetsReservationFreeAndApprovesIt() {
    await this.pages.adminReservations.adminChecksReservationH1(this.state.bookingNumOnlyBookingNameSubvented);
    await this.pages.adminReservations.adminChecksReservationTitleTagline(this.state.reservationTagline);
    await this.pages.adminReservations.adminChecksReservationInfoBeforeHandling(
      SINGLEBOOKING_SUBVENTED_PRICE_ADMIN_SIDE,
      ADMIN_STATUS_PROCESSED,
      PURPOSE_OF_THE_BOOKING,
      SINGLEBOOKING_DESCRIPTION,
      SINGLEBOOKING_NUMBER_OF_PERSONS,
      SINGLEBOOKING_SUBVENTED_ADMIN_SIDE_AGE_GROUP
    );
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      this.page.getByTestId("approval-buttons__approve-button")
    );
    // Waits for the approval dialog
    await this.pages.adminReservations.adminChecksReasonForSubventionInDialog();
    await this.pages.adminReservations.adminClicksSetReservationToFree();
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      this.page.getByTestId("approval-dialog__accept-button")
    );
    // The checks wait until the payment status is updated
    await this.pages.adminReservations.adminChecksReservationInfoAfterHandling(
      SINGLEBOOKING_NO_PAYMENT_ADMIN_SIDE,
      MYBOOKINGS_STATUS_CONFIRMED,
      PURPOSE_OF_THE_BOOKING,
      SINGLEBOOKING_DESCRIPTION,
      SINGLEBOOKING_NUMBER_OF_PERSONS,
      SINGLEBOOKING_SUBVENTED_ADMIN_SIDE_AGE_GROUP,
      null
    );
  }

  @step("app_admin.Admin Checks The Info And Cancels Reservation")
  async adminChecksTheInfoAndCancelsReservation() {
    await this.pages.adminReservations.adminChecksReservationH1(this.state.bookingNumOnlyBookingNameSubvented);
    await this.pages.adminReservations.adminChecksReservationTitleTagline(this.state.reservationTagline);
    await this.pages.adminReservations.adminChecksReservationInfoBeforeHandling(
      DEFAULT_PRICE_ALWAYS_REQUESTED_UNIT,
      ADMIN_STATUS_PROCESSED,
      PURPOSE_OF_THE_BOOKING,
      SINGLEBOOKING_DESCRIPTION,
      SINGLEBOOKING_NUMBER_OF_PERSONS,
      null
    );
    await this.adminRejectsReservationAndChecksTheStatus();
    await this.pages.adminReservations.adminSavesReservationNumber();
    await this.pages.adminReservations.adminChecksReservationInfoAfterHandling(
      DEFAULT_PRICE_ALWAYS_REQUESTED_UNIT,
      MYBOOKINGS_STATUS_REJECTED,
      PURPOSE_OF_THE_BOOKING,
      SINGLEBOOKING_DESCRIPTION,
      SINGLEBOOKING_NUMBER_OF_PERSONS,
      null,
      ADMIN_REASON_REJECTED
    );
  }

  @step("app_admin.Admin Returns Reservation To Handling State From Rejected State")
  async adminReturnsReservationToHandlingStateFromRejectedState() {
    // When UI is scrolled down, a sticky header appears with the same selector name
    // Using nth=-1 to target the last element
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      this.page.getByTestId("approval-buttons__return-to-handling-button").last()
    );
    await this.page
      .locator("#info-dialog")
      .getByRole("button", { name: RESERVATION_STATUS_DIALOG, exact: true })
      .click();
    await this.pages.adminReservations.adminChecksReservationStatus(ADMIN_STATUS_PROCESSED);
  }

  @step("app_admin.Admin Edits Reservation Time")
  async adminEditsReservationTime() {
    await log("Reservation needs to be approved first in order to do this step");

    // This sets the variables for ${MODIFIED_HOUR_STARTTIME_SUBVENTED_RESERVATION}, ${MODIFIED_HOUR_ENDTIME_SUBVENTED_RESERVATION}, ${MODIFIED_DATE_SUBVENTED_RESERVATION}, ${MODIFIED_STARTTIME_SUBVENTED_RESERVATION}
    await this.pages.adminReservations.adminOpensCalendarAndChangesReservationTime();
    await this.pages.dataModification.setInfoCardDurationTimeInfo(
      this.state.modifiedStarttimeSubventedReservation,
      this.state.modifiedDateSubventedReservation
    );
    const [admin_modified_formatted_date, admin_modified_formatted_date_minus_t] =
      await this.pages.dataModification.setInfoCardDurationTimeInfo(
        this.state.modifiedStarttimeSubventedReservation,
        this.state.modifiedDateSubventedReservation
      );

    this.state.adminModifiesTimeOfInfoCard = admin_modified_formatted_date;
    this.state.adminModifiesTimeOfInfoCardMinusT = admin_modified_formatted_date_minus_t;

    // This sets ${RESERVATION_TAGLINE} back to client side.
    await this.pages.dataModification.formatsTaglineForAdminSide(
      this.state.adminModifiesTimeOfInfoCard,
      ALWAYS_PAID_UNIT_SUBVENTED_WITH_UNIT_LOCATION
    );
    await this.pages.adminReservations.adminChecksReservationH1(this.state.bookingNumOnlyBookingNameSubvented);
    await this.pages.adminReservations.adminChecksReservationTitleTagline(this.state.reservationTagline);
    await this.pages.adminReservations.adminChecksReservationStatus(MYBOOKINGS_STATUS_CONFIRMED);
  }

  @step("app_admin.Admin Navigates To Own Units And Selects Unit Group")
  async adminNavigatesToOwnUnitsAndSelectsUnitGroup(unit_group_name: string) {
    await this.pages.adminNavigationMenu.adminNavigatesToMyUnits();
    await this.pages.adminMyUnits.adminSearchesOwnUnitAndClicksIt(unit_group_name);
  }

  @step("app_admin.Admin Opens Make Reservation Modal And Selects Unit")
  async adminOpensMakeReservationModalAndSelectsUnit(unit_name: string) {
    await this.pages.adminMyUnits.adminClicksMakeReservation();
    await this.pages.adminMyUnits.adminSelectsUnitFromReservationUnitsDropdown(unit_name);
  }

  @step("app_admin.Admin Checks That Reservation Cannot Be Made")
  async adminChecksThatReservationCannotBeMade() {
    await this.pages.adminMyUnits.adminChecksMakeReservationButtonIsDisabled();
  }

  // Access code
  @step("app_admin.Admin Opens Access Code Modal")
  async adminOpensAccessCodeModal() {
    await this.pages.adminReservations.adminOpenAccessCodeModal();
  }

  @step("app_admin.Admin Changes Access Code")
  async adminChangesAccessCode() {
    await this.pages.adminReservations.adminChangesAccessCode();
    await this.pages.adminReservations.adminClicksConfirmAccessCodeButton();
    // Admin Checks Access Code Does Not Match waits until the access code has changed
    await expect(this.page.getByTestId("reservation__info--Ovikoodi")).toBeVisible({ timeout: 10_000 });
  }

  /** Verifies that the access code matches the expected value (extracts numbers only). */
  @step("app_admin.Admin Checks Access Code Matches")
  async adminChecksAccessCodeMatches(access_code: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__info--Ovikoodi"),
      access_code
    );
  }

  /** Verifies that the access code does NOT match the expected value (extracts numbers only). */
  @step("app_admin.Admin Checks Access Code Does Not Match")
  async adminChecksAccessCodeDoesNotMatch(access_code: string) {
    await this.pages.customKeywords.verifyElementWithTextIsNotFound(
      this.page.getByTestId("reservation__info--Ovikoodi"),
      access_code
    );
  }

  @step("app_admin.Admin Saves Access Code")
  async adminSavesAccessCode() {
    const access_code = await this.page.getByTestId("reservation__info--Ovikoodi").innerText();
    this.state.accessCodeAdminside = access_code;
    await log(this.state.accessCodeAdminside);

    // Top navigation
  }

  // Basic permissions
  @step("app_admin.Admin Checks Top Navigation For Notification Manager")
  async adminChecksTopNavigationForNotificationManager() {
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservations/requested"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Reserver")
  async adminChecksTopNavigationForReserver() {
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/application-rounds"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Viewer")
  async adminChecksTopNavigationForViewer() {
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/application-rounds"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Handler")
  async adminChecksTopNavigationForHandler() {
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Admin")
  async adminChecksTopNavigationForAdmin() {
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/units"]');
  }

  // Unit permissions
  @step("app_admin.Admin Checks Top Navigation For Notification Manager With Unit Permissions")
  async adminChecksTopNavigationForNotificationManagerWithUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Viewer With Unit Permissions")
  async adminChecksTopNavigationForViewerWithUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Reserver With Unit Permissions")
  async adminChecksTopNavigationForReserverWithUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Handler With Unit Permissions")
  async adminChecksTopNavigationForHandlerWithUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Admin With Unit Permissions")
  async adminChecksTopNavigationForAdminWithUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
  }

  // Group unit permissions
  @step("app_admin.Admin Checks Top Navigation For Notification Manager With Group Unit Permissions")
  async adminChecksTopNavigationForNotificationManagerWithGroupUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Viewer With Group Unit Permissions")
  async adminChecksTopNavigationForViewerWithGroupUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Reserver With Group Unit Permissions")
  async adminChecksTopNavigationForReserverWithGroupUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Handler With Group Unit Permissions")
  async adminChecksTopNavigationForHandlerWithGroupUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/units"]');
  }

  @step("app_admin.Admin Checks Top Navigation For Admin With Group Unit Permissions")
  async adminChecksTopNavigationForAdminWithGroupUnitPermissions() {
    // The Found checks wait for the navigation, so the Not Found checks see it rendered
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/application-rounds"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservation-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/my-units"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations"]');
    await this.pages.customKeywords.verifyElementIsFound('[href="/kasittely/reservations/requested"]');
    await this.pages.customKeywords.verifyElementIsNotFound('[href="/kasittely/notifications"]');

    // Not currently in use
    // This was used to navigate to reservations through calendar view
    // Admin Navigates To Reservations By Units And Checks Reservation Info
    // ${ByUnitsElement}=  Browser.Get Element  css=[role="tablist"] >> span:text-is("${RESERVATIONS_BY_UNITS_FI}")
    // Click  ${ByUnitsElement}
    // admin_reservations.Admin Selects Reservation Unit  ${ALWAYS_FREE_UNIT}
    // admin_reservations.Admin Finds Reservation And Clicks It  ${CALENDAR_EVENT_NAME}
    // app_common.Switch To New Tab From Current Page
    // admin_reservations.Admin Checks Reservation Title Tagline  ${RESERVATION_TAGLINE}
    // admin_reservations.Admin Checks Reservation User Info
  }

  @step("app_admin.Admin Clicks Make Reservation And Checks Dialog Opens")
  async adminClicksMakeReservationAndChecksDialogOpens() {
    await this.pages.adminMyUnits.adminClicksMakeReservation();
    await expect(
      this.page.locator("#info-dialog"),
      "Info dialog should be visible after clicking make reservation button"
    ).toBeVisible({ timeout: 10_000 });
  }

  @step("app_admin.Admin Rejects Reservation And Checks The Status")
  async adminRejectsReservationAndChecksTheStatus() {
    // Click the last one to avoid strict mode violation that might happen when accordion is open
    await this.page.getByTestId("approval-buttons__reject-button").last().click();
    await this.pages.adminReservations.adminSelectsReasonForRejection(ADMIN_REASON_REJECTED);
    await this.page.getByTestId("deny-dialog__deny-button").click();
    await this.pages.adminReservations.adminChecksReservationStatus(MYBOOKINGS_STATUS_REJECTED);
  }

  @step("app_admin.Admin Makes Reservation For Behalf And Clicks Submit")
  async adminMakesReservationForBehalfAndClicksSubmit() {
    await log(
      "This sets variables for MODIFIED_HOUR_STARTTIME_SUBVENTED_RESERVATION, MODIFIED_HOUR_ENDTIME_SUBVENTED_RESERVATION, MODIFIED_DATE_SUBVENTED_RESERVATION and MODIFIED_STARTTIME_SUBVENTED_RESERVATION"
    );

    // Call the keyword and capture the returned values
    const [date_plus_x_days, start_hour, end_hour] = await this.pages.dataModification.getModifiedDateAndTime();

    this.state.unavailableReservationDate = date_plus_x_days;
    this.state.unavailableReservationHourStarttime = start_hour;
    this.state.unavailableReservationHourEndtime = end_hour;

    await this.pages.adminReservations.adminEntersReservationTimeAndTypeOfReservation(
      "[for=BEHALF]",
      this.state.unavailableReservationHourStarttime,
      this.state.unavailableReservationHourEndtime,
      this.state.unavailableReservationDate
    );
    await this.pages.adminReservations.adminFillsReservationDetailsBehalf(); // this keyword generates the info for checking calendar content
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      this.page.getByTestId("CreateReservationModal__accept-reservation")
    );
    await this.pages.adminReservations.adminVerifiesReservationModalIsClosed();
  }

  @step("app_admin.Admin Makes Reservation For Closed And Clicks Submit")
  async adminMakesReservationForClosedAndClicksSubmit() {
    // Call the keyword and capture the returned values
    const [date_plus_x_days, start_hour, end_hour] = await this.pages.dataModification.getModifiedDateAndTime();

    this.state.unavailableReservationDate = date_plus_x_days;
    this.state.unavailableReservationHourStarttime = start_hour;
    this.state.unavailableReservationHourEndtime = end_hour;

    await this.pages.adminReservations.adminEntersReservationTimeAndTypeOfReservation(
      "[for=BLOCKED]",
      this.state.unavailableReservationHourStarttime,
      this.state.unavailableReservationHourEndtime,
      this.state.unavailableReservationDate
    );
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      this.page.getByTestId("CreateReservationModal__accept-reservation")
    );
    await this.pages.adminReservations.adminVerifiesReservationModalIsClosed();
  }

  @step("app_admin.Admin Makes Reservation For Staff And Clicks Submit")
  async adminMakesReservationForStaffAndClicksSubmit() {
    // Call the keyword and capture the returned values
    const [date_plus_x_days, start_hour, end_hour] = await this.pages.dataModification.getModifiedDateAndTime();

    this.state.unavailableReservationDate = date_plus_x_days;
    this.state.unavailableReservationHourStarttime = start_hour;
    this.state.unavailableReservationHourEndtime = end_hour;

    await this.pages.adminReservations.adminEntersReservationTimeAndTypeOfReservation(
      "[for=STAFF]",
      this.state.unavailableReservationHourStarttime,
      this.state.unavailableReservationHourEndtime,
      this.state.unavailableReservationDate
    );
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      this.page.getByTestId("CreateReservationModal__accept-reservation")
    );
    await this.pages.adminReservations.adminVerifiesReservationModalIsClosed();
  }

  @step("app_admin.Admin Attempts To Make An Unavailable Reservation And Clicks Cancel")
  async adminAttemptsToMakeAnUnavailableReservationAndClicksCancel() {
    await this.pages.adminReservations.adminEntersReservationTimeAndTypeOfReservation(
      '[for="BEHALF"]',
      this.state.unavailableReservationHourStarttime,
      this.state.unavailableReservationHourEndtime,
      this.state.unavailableReservationDate
    );
    await this.page.getByTestId("CreateReservationModal__accept-reservation").scrollIntoViewIfNeeded();
    // The warning's label and body both have the text
    await this.pages.customKeywords.checkElementContainsText(
      this.page.getByTestId("CreateReservationModal__collision-warning"),
      RESERVATION_TIME_NOT_FREE
    );
    await this.page.getByTestId("CreateReservationModal__cancel-reservation").click();
    await this.pages.adminReservations.adminVerifiesReservationModalIsClosed();
  }

  // Notifications
  @step("app_admin.Admin Creates Normal Notification For User And Admin Side")
  async adminCreatesNormalNotificationForUserAndAdminSide() {
    await this.pages.adminNotifications.adminClicksCreateNotificationButton();
    await this.pages.adminNotificationsCreatePage.adminSelectsImmediateValidityPeriod();
    const date_plus_60_days = await this.pages.dataModification.getDatePlus60Days();
    this.state.notificationActiveUntil = date_plus_60_days;
    await this.pages.adminNotificationsCreatePage.adminSelectsNotificationActiveUntil(
      this.state.notificationActiveUntil
    );
    // if the notification name exist already we cannot publish the notification
    let randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    this.state.notificationBannerMessageName = `${NOTIFICATION_BANNER_MESSAGE_NORMAL} ${randomvalue}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationName(this.state.notificationBannerMessageName);
    await this.pages.adminNotificationsCreatePage.adminSelectsTypeOfNotification(NOTIFICATION_BANNER_MESSAGE_NORMAL);
    await this.pages.adminNotificationsCreatePage.adminSelectsTargetGroupAll();

    randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    this.state.notificationBannerMessageTextFi = `${NOTIFICATION_BANNER_MESSAGE_NORMAL} ${NOTIFICATION_BANNER_CLEANUP_PATTERN} ${randomvalue}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationTextFi(
      this.state.notificationBannerMessageTextFi
    );
    await this.pages.adminNotificationsCreatePage.adminPublishesNotification();
  }

  @step("app_admin.Admin Creates Warning Notification For User And Admin Side")
  async adminCreatesWarningNotificationForUserAndAdminSide() {
    await this.pages.adminNotifications.adminClicksCreateNotificationButton();
    await this.pages.adminNotificationsCreatePage.adminSelectsImmediateValidityPeriod();
    const date_plus_60_days = await this.pages.dataModification.getDatePlus60Days();
    this.state.notificationActiveUntil = date_plus_60_days;
    await this.pages.adminNotificationsCreatePage.adminSelectsNotificationActiveUntil(
      this.state.notificationActiveUntil
    );
    // if the notification name exist already we cannot publish the notification
    let randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    this.state.notificationBannerMessageNameWarning = `${NOTIFICATION_BANNER_MESSAGE_WARNING} ${randomvalue}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationName(
      this.state.notificationBannerMessageNameWarning
    );
    await this.pages.adminNotificationsCreatePage.adminSelectsTypeOfNotification(NOTIFICATION_BANNER_MESSAGE_WARNING);
    await this.pages.adminNotificationsCreatePage.adminSelectsTargetGroupAll();
    randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    this.state.notificationBannerMessageTextFi = `${NOTIFICATION_BANNER_MESSAGE_WARNING} ${NOTIFICATION_BANNER_CLEANUP_PATTERN} ${randomvalue}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationTextFi(
      this.state.notificationBannerMessageTextFi
    );
    await this.pages.adminNotificationsCreatePage.adminPublishesNotification();
  }

  @step("app_admin.Admin Creates Error Notification For User And Admin Side")
  async adminCreatesErrorNotificationForUserAndAdminSide() {
    await this.pages.adminNotifications.adminClicksCreateNotificationButton();
    await this.pages.adminNotificationsCreatePage.adminSelectsImmediateValidityPeriod();
    const date_plus_60_days = await this.pages.dataModification.getDatePlus60Days();
    this.state.notificationActiveUntil = date_plus_60_days;
    await this.pages.adminNotificationsCreatePage.adminSelectsNotificationActiveUntil(
      this.state.notificationActiveUntil
    );
    // if the notification name exist already we cannot publish the notification
    let randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    this.state.notificationBannerMessageNameError = `${NOTIFICATION_BANNER_MESSAGE_ERROR} ${randomvalue}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationName(
      this.state.notificationBannerMessageNameError
    );
    await this.pages.adminNotificationsCreatePage.adminSelectsTypeOfNotification(NOTIFICATION_BANNER_MESSAGE_ERROR);
    await this.pages.adminNotificationsCreatePage.adminSelectsTargetGroupAll();

    randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    this.state.notificationBannerMessageTextFi = `${NOTIFICATION_BANNER_MESSAGE_ERROR} ${NOTIFICATION_BANNER_CLEANUP_PATTERN} ${randomvalue}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationTextFi(
      this.state.notificationBannerMessageTextFi
    );
    await this.pages.adminNotificationsCreatePage.adminPublishesNotification();
  }
}
