import type { Page } from "@playwright/test";

/**
 * The values that keywords save while a test runs, for the test and the keywords after them: a booking's time and
 * number, a notification's name, the pages of a test with two sessions. Each test gets a new one (the `state`
 * fixture), and the page objects read it as `this.state`. Each field says which keywords set it.
 */
export class TestState {
  // The customer's booking

  /** Set by quick_reservation.Select The Free Slot From Quick Reservation */
  timeOfQuickReservationFreeSlot = "";
  /** Set by app_user.User Selects The Time With Quick Reservation And Sets Time Variables */
  timeOfQuickReservation = "";
  /** Set by app_user.User Selects The Time With Quick Reservation And Sets Time Variables */
  timeOfQuickReservationMinusT = "";
  /** Set by app_user.User Modifies Booking And Verifies The Changes */
  timeOfQuickReservationModified = "";
  /** Set by app_user.User Modifies Booking And Verifies The Changes */
  timeOfQuickReservationMinusTModified = "";
  /** Set by quick_reservation.Get Booking Number and checkout.In Order Summary Get Booking Number From Product List */
  bookingNumOnly = "";
  /** Set by quick_reservation.Get Access Code */
  accessCode = "";
  /** Set by reservation_calendar.Click And Store Free Reservation Time and reservation_calendar.Changing Time Again */
  calendarControlTimeOfFreeSlot = "";

  // The booking's calendar file and emails

  /** Set by app_user.User Saves File And Formats Booking Time To ICS */
  icsTextFromFile = "";
  /** Set by custom_keywords.Extract Start And End Time From ICS File */
  startTimeFromIcs = "";
  /** Set by custom_keywords.Extract Start And End Time From ICS File */
  endTimeFromIcs = "";
  /** Set by custom_keywords.Convert Booking Time To ICS Format */
  formattedStartToIcs = "";
  /** Set by custom_keywords.Convert Booking Time To ICS Format */
  formattedEndToIcs = "";
  /** e.g. Monday. Set by data_modification.Convert Finnish Short Day To English */
  englishDay = "";
  /** e.g. 17:30-18:30. Set by data_modification.Compute Reservation Time Slot */
  calendarTimeslot = "";
  /**
   * Alkamisaika: ${day}.${month}.${year} klo ${start_time}. Set by data_modification.Formats Reservation Time To
   * Start And End Time
   */
  formattedStarttimeEmail = "";
  /**
   * Päättymisaika: ${day}.${month}.${year} klo ${end_time}. Set by data_modification.Formats Reservation Time To
   * Start And End Time
   */
  formattedEndtimeEmail = "";

  // The admin's handling of the booking

  /** Set by admin_reservations.Admin Saves Reservation Number */
  reservationNumberAdminside = "";
  /** Set by app_admin.Admin Saves Access Code */
  accessCodeAdminside = "";
  /** Set by data_modification.Formats Reservation Number And Name For Admin Side */
  bookingNumOnlyBookingNameSubvented = "";
  /**
   * e.g. Ke 10.4.2024 klo 17:15-18:15, 1 t Alennuskelpoinen aula, Caisa. Set by data_modification.Formats Tagline For
   * Admin Side
   */
  reservationTagline = "";
  /** Set by app_admin.Admin Edits Reservation Time */
  adminModifiesTimeOfInfoCard = "";
  /** Set by app_admin.Admin Edits Reservation Time */
  adminModifiesTimeOfInfoCardMinusT = "";
  /** Set by admin_reservations.Admin Opens Calendar And Changes Reservation Time */
  modifiedDateSubventedReservation = "";
  /** Set by admin_reservations.Admin Opens Calendar And Changes Reservation Time */
  modifiedHourStarttimeSubventedReservation = "";
  /** Set by admin_reservations.Admin Opens Calendar And Changes Reservation Time */
  modifiedHourEndtimeSubventedReservation = "";
  /** Set by admin_reservations.Admin Opens Calendar And Changes Reservation Time */
  modifiedStarttimeSubventedReservation = "";
  /** Set by admin_reservations.Admin Fills Reservation Details Behalf */
  adminBehalfLastnameFi = "";
  /** e.g. Puolesta| Puolesta a6. Set by admin_reservations.Admin Fills Reservation Details Behalf */
  calendarEventName = "";
  /** Set by app_admin.Admin Makes Reservation For Behalf/Closed/Staff And Clicks Submit */
  unavailableReservationDate = "";
  /** Set by app_admin.Admin Makes Reservation For Behalf/Closed/Staff And Clicks Submit */
  unavailableReservationHourStarttime = "";
  /** Set by app_admin.Admin Makes Reservation For Behalf/Closed/Staff And Clicks Submit */
  unavailableReservationHourEndtime = "";

  // The banner notifications

  /** e.g. 12.2.2024. Set by app_admin.Admin Creates Normal/Warning/Error Notification For User And Admin Side */
  notificationActiveUntil = "";
  /** e.g. Normaali (sininen) + random value h5. Set by app_admin.Admin Creates Normal Notification For User And Admin Side */
  notificationBannerMessageName = "";
  /** Set by app_admin.Admin Creates Warning Notification For User And Admin Side */
  notificationBannerMessageNameWarning = "";
  /** Set by app_admin.Admin Creates Error Notification For User And Admin Side */
  notificationBannerMessageNameError = "";
  /**
   * e.g. Normaali (sininen) + random value Z6. Set by app_admin.Admin Creates Normal/Warning/Error Notification For
   * User And Admin Side
   */
  notificationBannerMessageTextFi = "";

  // The pages of tests with two sessions or tabs, for session.switchTo()

  /** Django admin in Firefox. Set by app_common.Open Django Admin In Firefox And App Admin In Chromium */
  browserAdminSide!: Page;
  /** The admin UI in Chromium. Set by app_common.Open Django Admin In Firefox And App Admin In Chromium */
  browserUserSide!: Page;
  /** Set by app_common.Open New Window From Admin Side To User Side And Saves Both Windows */
  pageAdminSide!: Page;
  /** Set by app_common.Open New Window From Admin Side To User Side And Saves Both Windows */
  pageUserSide!: Page;
}
