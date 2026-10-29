/**
 * The page objects of a test. They are created together, so that each one can call the others' keywords
 * (`this.pages.customKeywords`). The tests get them as fixtures (`TestSuites/fixtures.ts`).
 */
import type { Session } from "../lib/session";
import { AdminLandingpage } from "./PO/Admin/admin_landingpage";
import { AdminMyUnits } from "./PO/Admin/admin_my_units";
import { AdminNavigationMenu } from "./PO/Admin/admin_navigation_menu";
import { AdminNotifications } from "./PO/Admin/admin_notifications";
import { AdminNotificationsCreatePage } from "./PO/Admin/admin_notifications_create_page";
import { AdminReservations } from "./PO/Admin/admin_reservations";
import { DjangoAdmin } from "./PO/Admin/django_admin";
import { AppAdmin } from "./PO/App/app_admin";
import { AppCommon } from "./PO/App/app_common";
import { AppUser } from "./PO/App/app_user";
import { Mail } from "./PO/App/mail";
import { Checkout } from "./PO/Common/checkout";
import { Login } from "./PO/Common/login";
import { Popups } from "./PO/Common/popups";
import { Topnav } from "./PO/Common/topnav";
import { Mybookings } from "./PO/User/mybookings";
import { QuickReservation } from "./PO/User/quick_reservation";
import { Recurring } from "./PO/User/recurring";
import { RecurringApplications } from "./PO/User/recurring_applications";
import { RecurringApplicationsPage2 } from "./PO/User/recurring_applications_page2";
import { RecurringApplicationsPage3 } from "./PO/User/recurring_applications_page3";
import { RecurringApplicationsPagePreview } from "./PO/User/recurring_applications_page_preview";
import { RecurringApplicationsPageSent } from "./PO/User/recurring_applications_page_sent";
import { ReservationCalendar } from "./PO/User/reservation_calendar";
import { ReservationLownav } from "./PO/User/reservation_lownav";
import { ReservationUnitBookingDetails } from "./PO/User/reservation_unit_booking_details";
import { ReservationUnitReservationReceipt } from "./PO/User/reservation_unit_reservation_receipt";
import { ReservationUnitReserverInfo } from "./PO/User/reservation_unit_reserver_info";
import { ReservationUnitReserverTypes } from "./PO/User/reservation_unit_reserver_types";
import { Singlebooking } from "./PO/User/singlebooking";
import { UserLandingpage } from "./PO/User/user_landingpage";
import { CommonSetupsTeardowns } from "./Resources/common_setups_teardowns";
import { CreateData } from "./Resources/create_data";
import { CustomKeywords } from "./Resources/custom_keywords";
import { DataModification } from "./Resources/data_modification";
import { Devices } from "./Resources/devices";
import { GraphqlCommands } from "./Resources/graphql_commands";
import { TestState } from "./state";
import type { TestData } from "./test-data";

export class Pages {
  /**
   * `session` is the test's pages and `testData` the users and units its tags chose; tests without a browser
   * (create_data, selftest) have neither. `state` keeps the values that keywords save while the test runs.
   */
  constructor(
    readonly session: Session | null = null,
    readonly testData: TestData | null = null,
    readonly state = new TestState()
  ) {}

  readonly adminLandingpage = new AdminLandingpage(this);
  readonly adminMyUnits = new AdminMyUnits(this);
  readonly adminNavigationMenu = new AdminNavigationMenu(this);
  readonly adminNotifications = new AdminNotifications(this);
  readonly adminNotificationsCreatePage = new AdminNotificationsCreatePage(this);
  readonly adminReservations = new AdminReservations(this);
  readonly appAdmin = new AppAdmin(this);
  readonly appCommon = new AppCommon(this);
  readonly appUser = new AppUser(this);
  readonly checkout = new Checkout(this);
  readonly commonSetupsTeardowns = new CommonSetupsTeardowns(this);
  readonly createData = new CreateData(this);
  readonly customKeywords = new CustomKeywords(this);
  readonly dataModification = new DataModification(this);
  readonly devices = new Devices(this);
  readonly djangoAdmin = new DjangoAdmin(this);
  readonly graphqlCommands = new GraphqlCommands(this);
  readonly login = new Login(this);
  readonly mail = new Mail(this);
  readonly mybookings = new Mybookings(this);
  readonly popups = new Popups(this);
  readonly quickReservation = new QuickReservation(this);
  readonly recurring = new Recurring(this);
  readonly recurringApplications = new RecurringApplications(this);
  readonly recurringApplicationsPage2 = new RecurringApplicationsPage2(this);
  readonly recurringApplicationsPage3 = new RecurringApplicationsPage3(this);
  readonly recurringApplicationsPagePreview = new RecurringApplicationsPagePreview(this);
  readonly recurringApplicationsPageSent = new RecurringApplicationsPageSent(this);
  readonly reservationCalendar = new ReservationCalendar(this);
  readonly reservationLownav = new ReservationLownav(this);
  readonly reservationUnitBookingDetails = new ReservationUnitBookingDetails(this);
  readonly reservationUnitReservationReceipt = new ReservationUnitReservationReceipt(this);
  readonly reservationUnitReserverInfo = new ReservationUnitReserverInfo(this);
  readonly reservationUnitReserverTypes = new ReservationUnitReserverTypes(this);
  readonly singlebooking = new Singlebooking(this);
  readonly topnav = new Topnav(this);
  readonly userLandingpage = new UserLandingpage(this);
}
