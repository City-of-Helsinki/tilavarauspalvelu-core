/** A resource file with variables. */
export const URL_TEST = "https://varaamo.test.hel.ninja/";
export const URL_STAGE = "https://varaamo.test.hel.ninja/kasittely";
export const URL_PROD = "https://varaamo.hel.fi/";
export const URL_ADMIN = "https://varaamo.test.hel.ninja/kasittely";
export const URL_DJANGO_ADMIN = "https://varaamo.test.hel.ninja/admin/login/";
export const URL_MAIL = "https://www.google.com/intl/fi/gmail/about/";
export const DOWNLOAD_DIR = `${import.meta.dirname}/downloads`;
export const EMAIL_FILE_PATH = `${import.meta.dirname}/downloads/cleaned_emails.json`;
// Milliseconds, like Playwright's timeouts
export const BROWSER_TIMEOUT_GLOBAL = 40_000;
export const CONTENT_WAIT_TIMEOUT = 10_000;
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
export const RECURRING_THU_22_23_OTHER = '[aria-label="Ei varattavissa: To 22 - 23"]';
export const RECURRING_THU_23_24_OTHER = '[aria-label="Ei varattavissa: To 23 - 24"]';
export const RECURRING_THU_09_10_PREFERRED = '[aria-label="Varattavissa: To 9 - 10"]';
export const RECURRING_THU_10_11_PREFERRED = '[aria-label="Varattavissa: To 10 - 11"]';
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
