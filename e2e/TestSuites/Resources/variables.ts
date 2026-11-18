/** A resource file with variables. */
export const URL_TEST = "https://varaamo.test.hel.ninja/";
export const URL_STAGE = "https://varaamo.test.hel.ninja/kasittely";
export const URL_PROD = "https://varaamo.hel.fi/";
export const URL_ADMIN = "https://varaamo.test.hel.ninja/kasittely";
export const URL_DJANGO_ADMIN = "https://varaamo.test.hel.ninja/admin/login/";
export const URL_MAIL = "https://www.google.com/intl/fi/gmail/about/";
export const DOWNLOAD_DIR = `${import.meta.dirname}/downloads`;
export const EMAIL_FILE_PATH = `${import.meta.dirname}/downloads/cleaned_emails.json`;
// The admin's login for the notification tests, which TestSuites/notifications_login.setup.ts saves. It's a session,
// so it's kept in the git-ignored .shared-state/.
export const NOTIFICATION_ADMIN_STATE = `${import.meta.dirname}/../../.shared-state/notification-admin.json`;
// Milliseconds, like Playwright's timeouts
export const BROWSER_TIMEOUT_GLOBAL = 40_000;
export const CONTENT_WAIT_TIMEOUT = 10_000;
// How long a text check waits for its element to show the text (the page objects' checks)
export const TEXT_CHECK_TIMEOUT = 10_000 + CONTENT_WAIT_TIMEOUT;
// The cookie in which the customer site's cookie banner saves the consent (the app's sitesettings.json)
export const COOKIE_CONSENT_COOKIE = "varaamo-cookie-consents";
export const ROBOT_EMAIL = "django_email_robot@mailiposti.com";
export const DJANGO_ROBO_MAIL = "https://varaamo.test.hel.ninja/v1/robot_email_cache/";
export const WAIT_FOR_EMAIL_SECONDS = 5;
export const DOWNLOAD_ICS_FILE = `${import.meta.dirname}/downloads`;
export const ALWAYS_FREE_UNIT = "Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA)";
export const ALWAYS_FREE_UNIT_WITH_UNIT_LOCATION = "Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju";
export const UNIT_REQUIRES_ALWAYS_HANDLING = "Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA)";
export const UNIT_REQUIRES_ALWAYS_HANDLING_WITH_UNIT_LOCATION =
  "Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju";
export const UNIT_WITH_ACCESS_CODE = "Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA)";
export const UNIT_WITH_ACCESS_CODE_WITH_UNIT_LOCATION =
  "Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju";
export const FREE_UNIT_NO_CANCEL = "Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA)";
export const FREE_UNIT_NO_CANCEL_WITH_UNIT_LOCATION =
  "Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju";
export const ALWAYS_PAID_UNIT = "Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA)";
export const ALWAYS_PAID_UNIT_WITH_UNIT_LOCATION =
  "Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju";
export const ALWAYS_PAID_UNIT_SUBVENTED = "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA)";
export const ALWAYS_PAID_UNIT_SUBVENTED_WITH_UNIT_LOCATION =
  "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju";
export const UNAVAILABLE_UNIT = "Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA)";
export const UNAVAILABLE_UNIT_WITH_UNIT_LOCATION =
  "Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju";
export const RECURRING_UNIT_MALMI = "KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA)";
export const RECURRING_UNIT_KESKUSTA = "KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA)";
export const UNIT_LOCATION = "Harakka, piilokoju";
export const UNIT_NAME_FOR_PICTURE_TEST = "Maksuton Mankeli";
// The seasonal application's times: a weekday, and the start and end of the times painted in the calendar. The
// calendar paints only inside the seasonal units' opening hours, 09:00–21:00 in the test data.
export const RECURRING_THU_19_21_PRIMARY = ["Torstai", "19:00", "21:00"] as const;
export const RECURRING_THU_09_11_SECONDARY = ["Torstai", "09:00", "11:00"] as const;
// Closed hours, and a drag past the closing time, which paints only the open part
export const RECURRING_THU_07_09_CLOSED = ["Torstai", "07:00", "09:00"] as const;
export const RECURRING_THU_21_23_CLOSED = ["Torstai", "21:00", "23:00"] as const;
export const RECURRING_THU_20_22_PAST_CLOSING = ["Torstai", "20:00", "22:00"] as const;
export const RECURRING_THU_20_21 = ["Torstai", "20:00", "21:00"] as const;
// A 3-hour time, the half hour erased from its middle, and the two pieces left
export const RECURRING_TUE_11_14 = ["Tiistai", "11:00", "14:00"] as const;
export const RECURRING_TUE_12_1230 = ["Tiistai", "12:00", "12:30"] as const;
export const RECURRING_TUE_11_12 = ["Tiistai", "11:00", "12:00"] as const;
export const RECURRING_TUE_1230_14 = ["Tiistai", "12:30", "14:00"] as const;
// Times added with the form
export const RECURRING_WED_10_12 = ["Keskiviikko", "10:00", "12:00"] as const;
export const RECURRING_FRI_15_17 = ["Perjantai", "15:00", "17:00"] as const;
// A time shorter than the 30-minute minimum, and a 15-minute time just before 19:00–21:00
export const RECURRING_THU_13_1315 = ["Torstai", "13:00", "13:15"] as const;
export const RECURRING_THU_1845_19 = ["Torstai", "18:45", "19:00"] as const;
// Times painted with the keyboard, the cell toggled with Space, and the times painted next to them
export const RECURRING_MON_10_12 = ["Maanantai", "10:00", "12:00"] as const;
export const RECURRING_MON_10 = ["Maanantai", "10:00"] as const;
export const RECURRING_MON_1015_12 = ["Maanantai", "10:15", "12:00"] as const;
export const RECURRING_MON_12_13 = ["Maanantai", "12:00", "13:00"] as const;
export const RECURRING_MON_10_13 = ["Maanantai", "10:00", "13:00"] as const;
export const RECURRING_MON_13_14 = ["Maanantai", "13:00", "14:00"] as const;
// The times the application is sent with, as the time checks write them (recurring_applications_page2.ts)
export const RECURRING_SENT_TIMES = [
  "Ma 10:00–13:00 E",
  "Ma 13:00–14:00 V",
  "Ke 10:00–12:00 V",
  "To 09:00–11:00 V",
  "To 18:45–19:00 V",
  "To 19:00–21:00 E",
  "Pe 15:00–17:00 E",
] as const;
export const QUICK_RESERVATION_DURATION = "60 min";
export const RESERVATION_INDIVIDUAL = "#reserveeType__INDIVIDUAL";
export const RESERVATION_NONPROFIT = "#reserveeType__NONPROFIT";
export const RESERVATION_BUSINESS = "#reserveeType__COMPANY";
export const RESERVATION_CARD = '[data-testid="reservation-card__container"]';
export const RESERVATION_CARDNAME = '[data-testid="reservation-card__name"]';
export const NOTIFICATION_TYPE_NORMAL = '[class*="Notification-module_notification__"]';
export const NOTIFICATION_TYPE_ERROR = '[class*="Notification-module_error__"]';
export const NOTIFICATION_TYPE_WARNING = '[class*="Notification-module_alert__"]';
export const ADMIN_ROLE_ADMIN = "ADMIN";
export const ADMIN_ROLE_HANDLER = "HANDLER";
export const ADMIN_ROLE_VIEWER = "VIEWER";
export const ADMIN_ROLE_RESERVER = "RESERVER";
export const ADMIN_ROLE_NOTIFICATION_MANAGER = "NOTIFICATION_MANAGER";
export const MAIL_TEST_TRIGGER = true;
export const ATTACHMENT_FILENAME = "asiointipalvelun-ehdot.pdf";
export const DOWNLOAD_TERMS_OF_USE_FILE = `${import.meta.dirname}/downloads/asiointipalvelun-ehdot.pdf`;
export const EXPECTED_ATTACHMENT_STATUS = true;
