/** Port of PO/App/app_admin.robot */
import { V, expect, str, step, log } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/parallel_test_data";
import "../../Resources/variables";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/devices";
import "../../Resources/create_data";
import { PageObject } from "../../page-object";

export class AppAdmin extends PageObject {
  @step("app_admin.Admin Checks The Info And Sets Reservation Free And Approves It")
  async adminChecksTheInfoAndSetsReservationFreeAndApprovesIt() {
    await this.pages.adminReservations.adminChecksReservationH1(V.BOOKING_NUM_ONLY_BOOKING_NAME_SUBVENTED);
    await this.pages.adminReservations.adminChecksReservationTitleTagline(V.RESERVATION_TAGLINE);
    await this.pages.adminReservations.adminChecksReservationInfoBeforeHandling(
      V.SINGLEBOOKING_SUBVENTED_PRICE_ADMIN_SIDE,
      V.ADMIN_STATUS_PROCESSED,
      V.PURPOSE_OF_THE_BOOKING,
      V.SINGLEBOOKING_DESCRIPTION,
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      V.SINGLEBOOKING_SUBVENTED_ADMIN_SIDE_AGE_GROUP
    );
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      '[data-testid="approval-buttons__approve-button"]'
    );
    // Waits for the approval dialog
    await this.pages.adminReservations.adminChecksReasonForSubventionInDialog();
    await this.pages.adminReservations.adminClicksSetReservationToFree();
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      '[data-testid="approval-dialog__accept-button"]'
    );
    // The checks wait until the payment status is updated
    await this.pages.adminReservations.adminChecksReservationInfoAfterHandling(
      V.SINGLEBOOKING_NO_PAYMENT_ADMIN_SIDE,
      V.MYBOOKINGS_STATUS_CONFIRMED,
      V.PURPOSE_OF_THE_BOOKING,
      V.SINGLEBOOKING_DESCRIPTION,
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      V.SINGLEBOOKING_SUBVENTED_ADMIN_SIDE_AGE_GROUP,
      null
    );
  }

  @step("app_admin.Admin Checks The Info And Cancels Reservation")
  async adminChecksTheInfoAndCancelsReservation() {
    await this.pages.adminReservations.adminChecksReservationH1(V.BOOKING_NUM_ONLY_BOOKING_NAME_SUBVENTED);
    await this.pages.adminReservations.adminChecksReservationTitleTagline(V.RESERVATION_TAGLINE);
    await this.pages.adminReservations.adminChecksReservationInfoBeforeHandling(
      V.DEFAULT_PRICE_ALWAYS_REQUESTED_UNIT,
      V.ADMIN_STATUS_PROCESSED,
      V.PURPOSE_OF_THE_BOOKING,
      V.SINGLEBOOKING_DESCRIPTION,
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      null
    );
    await this.adminRejectsReservationAndChecksTheStatus();
    await this.pages.adminReservations.adminSavesReservationNumber();
    await this.pages.adminReservations.adminChecksReservationInfoAfterHandling(
      V.DEFAULT_PRICE_ALWAYS_REQUESTED_UNIT,
      V.MYBOOKINGS_STATUS_REJECTED,
      V.PURPOSE_OF_THE_BOOKING,
      V.SINGLEBOOKING_DESCRIPTION,
      V.SINGLEBOOKING_NUMBER_OF_PERSONS,
      null,
      V.ADMIN_REASON_REJECTED
    );
  }

  @step("app_admin.Admin Returns Reservation To Handling State From Rejected State")
  async adminReturnsReservationToHandlingStateFromRejectedState() {
    // When UI is scrolled down, a sticky header appears with the same selector name
    // Using nth=-1 to target the last element
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      '[data-testid="approval-buttons__return-to-handling-button"] >> nth=-1'
    );
    await this.pages.customKeywords.findAndClickElementWithText("#info-dialog >> span", V.RESERVATION_STATUS_DIALOG);
    await this.pages.adminReservations.adminChecksReservationStatus(V.ADMIN_STATUS_PROCESSED);
  }

  @step("app_admin.Admin Edits Reservation Time")
  async adminEditsReservationTime() {
    let admin_modified_formatted_date: RobotValue, admin_modified_formatted_date_minus_t: RobotValue;
    await log("Reservation needs to be approved first in order to do this step");

    // This sets the variables for ${MODIFIED_HOUR_STARTTIME_SUBVENTED_RESERVATION}, ${MODIFIED_HOUR_ENDTIME_SUBVENTED_RESERVATION}, ${MODIFIED_DATE_SUBVENTED_RESERVATION}, ${MODIFIED_STARTTIME_SUBVENTED_RESERVATION}
    await this.pages.adminReservations.adminOpensCalendarAndChangesReservationTime();
    await this.pages.dataModification.setInfoCardDurationTimeInfo(
      V.MODIFIED_STARTTIME_SUBVENTED_RESERVATION,
      V.MODIFIED_DATE_SUBVENTED_RESERVATION
    );
    [admin_modified_formatted_date, admin_modified_formatted_date_minus_t] =
      await this.pages.dataModification.setInfoCardDurationTimeInfo(
        V.MODIFIED_STARTTIME_SUBVENTED_RESERVATION,
        V.MODIFIED_DATE_SUBVENTED_RESERVATION
      );

    V.ADMIN_MODIFIES_TIME_OF_INFO_CARD = admin_modified_formatted_date;
    V.ADMIN_MODIFIES_TIME_OF_INFO_CARD_MINUS_T = admin_modified_formatted_date_minus_t;

    // This sets ${RESERVATION_TAGLINE} back to client side.
    await this.pages.dataModification.formatsTaglineForAdminSide(
      V.ADMIN_MODIFIES_TIME_OF_INFO_CARD,
      V.ALWAYS_PAID_UNIT_SUBVENTED_WITH_UNIT_LOCATION
    );
    await this.pages.adminReservations.adminChecksReservationH1(V.BOOKING_NUM_ONLY_BOOKING_NAME_SUBVENTED);
    await this.pages.adminReservations.adminChecksReservationTitleTagline(V.RESERVATION_TAGLINE);
    await this.pages.adminReservations.adminChecksReservationStatus(V.MYBOOKINGS_STATUS_CONFIRMED);
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
  async adminChecksAccessCodeMatches(access_code: RobotValue) {
    await this.pages.customKeywords.checkElementsText('[data-testid="reservation__info--Ovikoodi"]', access_code);
  }

  /** Verifies that the access code does NOT match the expected value (extracts numbers only). */
  @step("app_admin.Admin Checks Access Code Does Not Match")
  async adminChecksAccessCodeDoesNotMatch(access_code: RobotValue) {
    await this.pages.customKeywords.verifyElementWithTextIsNotFound(
      '[data-testid="reservation__info--Ovikoodi"]',
      access_code
    );
  }

  @step("app_admin.Admin Saves Access Code")
  async adminSavesAccessCode() {
    let access_code: RobotValue;
    access_code = await this.page.getByTestId("reservation__info--Ovikoodi").innerText();
    V.ACCESS_CODE_ADMINSIDE = access_code;
    await log(V.ACCESS_CODE_ADMINSIDE);

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
    await this.pages.adminReservations.adminSelectsReasonForRejection(V.ADMIN_REASON_REJECTED);
    await this.page.getByTestId("deny-dialog__deny-button").click();
    await this.pages.adminReservations.adminChecksReservationStatus(V.MYBOOKINGS_STATUS_REJECTED);
  }

  @step("app_admin.Admin Makes Reservation For Behalf And Clicks Submit")
  async adminMakesReservationForBehalfAndClicksSubmit() {
    let date_plus_x_days: RobotValue, start_hour: RobotValue, end_hour: RobotValue;
    await log(
      "This sets variables for MODIFIED_HOUR_STARTTIME_SUBVENTED_RESERVATION, MODIFIED_HOUR_ENDTIME_SUBVENTED_RESERVATION, MODIFIED_DATE_SUBVENTED_RESERVATION and MODIFIED_STARTTIME_SUBVENTED_RESERVATION"
    );

    // Call the keyword and capture the returned values
    [date_plus_x_days, start_hour, end_hour] = await this.pages.dataModification.getModifiedDateAndTime();

    V.UNAVAILABLE_RESERVATION_DATE = date_plus_x_days;
    V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME = start_hour;
    V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME = end_hour;

    await this.pages.adminReservations.adminEntersReservationTimeAndTypeOfReservation(
      "[for=BEHALF]",
      V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME,
      V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME,
      V.UNAVAILABLE_RESERVATION_DATE
    );
    await this.pages.adminReservations.adminFillsReservationDetailsBehalf(); // this keyword generates the info for checking calendar content
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      '[data-testid="CreateReservationModal__accept-reservation"]'
    );
    await this.pages.adminReservations.adminVerifiesReservationModalIsClosed();
  }

  @step("app_admin.Admin Makes Reservation For Closed And Clicks Submit")
  async adminMakesReservationForClosedAndClicksSubmit() {
    let date_plus_x_days: RobotValue, start_hour: RobotValue, end_hour: RobotValue;
    // Call the keyword and capture the returned values
    [date_plus_x_days, start_hour, end_hour] = await this.pages.dataModification.getModifiedDateAndTime();

    V.UNAVAILABLE_RESERVATION_DATE = date_plus_x_days;
    V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME = start_hour;
    V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME = end_hour;

    await this.pages.adminReservations.adminEntersReservationTimeAndTypeOfReservation(
      "[for=BLOCKED]",
      V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME,
      V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME,
      V.UNAVAILABLE_RESERVATION_DATE
    );
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      '[data-testid="CreateReservationModal__accept-reservation"]'
    );
    await this.pages.adminReservations.adminVerifiesReservationModalIsClosed();
  }

  @step("app_admin.Admin Makes Reservation For Staff And Clicks Submit")
  async adminMakesReservationForStaffAndClicksSubmit() {
    let date_plus_x_days: RobotValue, start_hour: RobotValue, end_hour: RobotValue;
    // Call the keyword and capture the returned values
    [date_plus_x_days, start_hour, end_hour] = await this.pages.dataModification.getModifiedDateAndTime();

    V.UNAVAILABLE_RESERVATION_DATE = date_plus_x_days;
    V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME = start_hour;
    V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME = end_hour;

    await this.pages.adminReservations.adminEntersReservationTimeAndTypeOfReservation(
      "[for=STAFF]",
      V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME,
      V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME,
      V.UNAVAILABLE_RESERVATION_DATE
    );
    await this.pages.adminReservations.adminClicksButtonInReservationPage(
      '[data-testid="CreateReservationModal__accept-reservation"]'
    );
    await this.pages.adminReservations.adminVerifiesReservationModalIsClosed();
  }

  @step("app_admin.Admin Attempts To Make An Unavailable Reservation And Clicks Cancel")
  async adminAttemptsToMakeAnUnavailableReservationAndClicksCancel() {
    await this.pages.adminReservations.adminEntersReservationTimeAndTypeOfReservation(
      '[for="BEHALF"]',
      V.UNAVAILABLE_RESERVATION_HOUR_STARTTIME,
      V.UNAVAILABLE_RESERVATION_HOUR_ENDTIME,
      V.UNAVAILABLE_RESERVATION_DATE
    );
    await this.page.getByTestId("CreateReservationModal__accept-reservation").scrollIntoViewIfNeeded();
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="CreateReservationModal__collision-warning"] >> [class*="Notification-module_body__"]',
      V.RESERVATION_TIME_NOT_FREE
    );
    await this.page.getByTestId("CreateReservationModal__cancel-reservation").click();
    await this.pages.adminReservations.adminVerifiesReservationModalIsClosed();
  }

  // Notifications
  @step("app_admin.Admin Creates Normal Notification For User And Admin Side")
  async adminCreatesNormalNotificationForUserAndAdminSide() {
    let date_plus_60_days: RobotValue, randomvalue: RobotValue;
    await this.pages.adminNotifications.adminClicksCreateNotificationButton();
    await this.pages.adminNotificationsCreatePage.adminSelectsImmediateValidityPeriod();
    date_plus_60_days = await this.pages.dataModification.getDatePlus60Days();
    V.NOTIFICATION_ACTIVE_UNTIL = date_plus_60_days;
    await this.pages.adminNotificationsCreatePage.adminSelectsNotificationActiveUntil(V.NOTIFICATION_ACTIVE_UNTIL);
    // if the notification name exist already we cannot publish the notification
    randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    V.NOTIFICATION_BANNER_MESSAGE_NAME = `${V.NOTIFICATION_BANNER_MESSAGE_NORMAL} ${str(randomvalue)}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME);
    await this.pages.adminNotificationsCreatePage.adminSelectsTypeOfNotification(V.NOTIFICATION_BANNER_MESSAGE_NORMAL);
    await this.pages.adminNotificationsCreatePage.adminSelectsTargetGroupAll();

    randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI = `${V.NOTIFICATION_BANNER_MESSAGE_NORMAL} ${V.NOTIFICATION_BANNER_CLEANUP_PATTERN} ${str(randomvalue)}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationTextFi(V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI);
    await this.pages.adminNotificationsCreatePage.adminPublishesNotification();
  }

  @step("app_admin.Admin Creates Warning Notification For User And Admin Side")
  async adminCreatesWarningNotificationForUserAndAdminSide() {
    let date_plus_60_days: RobotValue, randomvalue: RobotValue;
    await this.pages.adminNotifications.adminClicksCreateNotificationButton();
    await this.pages.adminNotificationsCreatePage.adminSelectsImmediateValidityPeriod();
    date_plus_60_days = await this.pages.dataModification.getDatePlus60Days();
    V.NOTIFICATION_ACTIVE_UNTIL = date_plus_60_days;
    await this.pages.adminNotificationsCreatePage.adminSelectsNotificationActiveUntil(V.NOTIFICATION_ACTIVE_UNTIL);
    // if the notification name exist already we cannot publish the notification
    randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING = `${V.NOTIFICATION_BANNER_MESSAGE_WARNING} ${str(randomvalue)}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationName(
      V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING
    );
    await this.pages.adminNotificationsCreatePage.adminSelectsTypeOfNotification(V.NOTIFICATION_BANNER_MESSAGE_WARNING);
    await this.pages.adminNotificationsCreatePage.adminSelectsTargetGroupAll();
    randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI = `${V.NOTIFICATION_BANNER_MESSAGE_WARNING} ${V.NOTIFICATION_BANNER_CLEANUP_PATTERN} ${str(randomvalue)}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationTextFi(V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI);
    await this.pages.adminNotificationsCreatePage.adminPublishesNotification();
  }

  @step("app_admin.Admin Creates Error Notification For User And Admin Side")
  async adminCreatesErrorNotificationForUserAndAdminSide() {
    let date_plus_60_days: RobotValue, randomvalue: RobotValue;
    await this.pages.adminNotifications.adminClicksCreateNotificationButton();
    await this.pages.adminNotificationsCreatePage.adminSelectsImmediateValidityPeriod();
    date_plus_60_days = await this.pages.dataModification.getDatePlus60Days();
    V.NOTIFICATION_ACTIVE_UNTIL = date_plus_60_days;
    await this.pages.adminNotificationsCreatePage.adminSelectsNotificationActiveUntil(V.NOTIFICATION_ACTIVE_UNTIL);
    // if the notification name exist already we cannot publish the notification
    randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR = `${V.NOTIFICATION_BANNER_MESSAGE_ERROR} ${str(randomvalue)}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR);
    await this.pages.adminNotificationsCreatePage.adminSelectsTypeOfNotification(V.NOTIFICATION_BANNER_MESSAGE_ERROR);
    await this.pages.adminNotificationsCreatePage.adminSelectsTargetGroupAll();

    randomvalue = await this.pages.dataModification.generateRandomLetterAndNumber();
    V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI = `${V.NOTIFICATION_BANNER_MESSAGE_ERROR} ${V.NOTIFICATION_BANNER_CLEANUP_PATTERN} ${str(randomvalue)}`;
    await this.pages.adminNotificationsCreatePage.adminFillsNotificationTextFi(V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI);
    await this.pages.adminNotificationsCreatePage.adminPublishesNotification();
  }
}
