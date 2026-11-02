/**
 * The suites' `test`: Playwright's fixtures, plus
 *
 * - `testData`: the users and units that the test's tags choose (`TestSuites/test-data.ts`), e.g.
 *   `testData.user.hetu` and `testData.units.alwaysFreeUnit`. Only one test at a time uses a data set.
 * - `state`: the values that keywords save while the test runs (`TestSuites/state.ts`), e.g.
 *   `state.timeOfQuickReservationMinusT`.
 * - a staggered start for the first test of each parallel slot (`staggeredStart`).
 *
 * The page objects are fixtures too, by their names in `Pages` (`TestSuites/pages.ts`):
 * `test("…", async ({ appCommon, appUser }) => { await appCommon.userLogsInWithSuomiFi(); … })`.
 */
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { BackendErrors } from "../lib/backend-errors";
import { acquireLock, releaseLock, sharedDir } from "../lib/locks";
import { errorMessage, isSequential, log, runStep, test as base } from "../lib/runtime";
import { Session } from "../lib/session";
import { Pages } from "./pages";
import type { TestState } from "./state";
import { resolveTestData } from "./test-data";
import type { TestData } from "./test-data";

/** The run's first test in parallel slot n waits n times this before it starts */
const STAGGER_MS = 10_000;

/** True for the run's first test in this parallel slot: that test creates the slot's folder in the run's folder. */
async function firstInSlot(slot: number): Promise<boolean> {
  const started = join(sharedDir(), "started");
  await mkdir(started, { recursive: true });
  try {
    await mkdir(join(started, String(slot)));
    return true;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "EEXIST") {
      return false;
    }
    throw err;
  }
}

// oxlint-disable react-hooks/rules-of-hooks -- `use` is the fixture callback of Playwright, not React's hook

/** Each page object of `Pages` as a fixture of its own. */
type PageObjectFixtures = { [Name in keyof Pages]: Pages[Name] };

export const test = base.extend<
  { staggeredStart: void; testData: TestData; session: Session; pages: Pages; state: TestState } & PageObjectFixtures
>({
  // The run's first test in each slot waits 10 s times the slot's number: when all first tests started together, the
  // test environment answered with 502s and error pages, and simultaneous Suomi.fi logins failed.
  staggeredStart: [
    async ({ testRuntime: _testRuntime }, use, info) => {
      if (info.parallelIndex > 0 && (await firstInSlot(info.parallelIndex))) {
        await runStep(`Staggered start: waits ${(info.parallelIndex * STAGGER_MS) / 1000} s`, () =>
          setTimeout(info.parallelIndex * STAGGER_MS)
        );
      }
      await use();
    },
    { auto: true },
  ],
  testData: [
    async ({ testRuntime: _testRuntime }, use, info) => {
      const data = resolveTestData(
        info.tags.map((tag) => tag.replace(/^@/, "")),
        { sequential: isSequential() }
      );
      // A data set's users are used by one test at a time
      if (data.dataSet != null) {
        await acquireLock(`DATA_SET_${data.dataSet}`);
      }
      // The report shows the users that the tags chose (in Before Hooks)
      await log(`🚀 Test data for: ${info.title}`);
      await log(`🏷️ Tags: ${info.tags.join(", ")}`);
      const { user, admin, djangoAdmin, permissionTarget } = data;
      for (const [kind, person] of Object.entries({ user, admin, djangoAdmin, permissionTarget })) {
        if (person.fullName !== "") {
          // oxlint-disable-next-line no-await-in-loop -- log lines in order
          await log(`👤 ${kind}: ${person.fullName}`);
        }
      }
      await use(data);
      if (data.dataSet != null) {
        await releaseLock(`DATA_SET_${data.dataSet}`);
      }
    },
    { auto: true },
  ],
  // The backend errors of the test's pages are added to the test's annotations when it ends (lib/backend-errors.ts)
  session: async ({ browser, context, page }, use, info) => {
    const backendErrors = new BackendErrors(info);
    const session = new Session({ browser, context, page }, info, backendErrors);
    await use(session);
    await backendErrors.finish();
    // A failure to close what the test opened isn't the test's result, so it is a warning
    try {
      await session.close();
    } catch (err) {
      await log(`Closing the test's pages failed: ${errorMessage(err)}`, { level: "WARN" });
    }
  },
  pages: async ({ session, testData }, use) => {
    await use(new Pages(session, testData));
  },
  state: async ({ pages }, use) => {
    await use(pages.state);
  },
  adminLandingpage: async ({ pages }, use) => {
    await use(pages.adminLandingpage);
  },
  adminMyUnits: async ({ pages }, use) => {
    await use(pages.adminMyUnits);
  },
  adminNavigationMenu: async ({ pages }, use) => {
    await use(pages.adminNavigationMenu);
  },
  adminNotifications: async ({ pages }, use) => {
    await use(pages.adminNotifications);
  },
  adminNotificationsCreatePage: async ({ pages }, use) => {
    await use(pages.adminNotificationsCreatePage);
  },
  adminReservations: async ({ pages }, use) => {
    await use(pages.adminReservations);
  },
  appAdmin: async ({ pages }, use) => {
    await use(pages.appAdmin);
  },
  appCommon: async ({ pages }, use) => {
    await use(pages.appCommon);
  },
  appUser: async ({ pages }, use) => {
    await use(pages.appUser);
  },
  checkout: async ({ pages }, use) => {
    await use(pages.checkout);
  },
  commonSetupsTeardowns: async ({ pages }, use) => {
    await use(pages.commonSetupsTeardowns);
  },
  createData: async ({ pages }, use) => {
    await use(pages.createData);
  },
  customKeywords: async ({ pages }, use) => {
    await use(pages.customKeywords);
  },
  dataModification: async ({ pages }, use) => {
    await use(pages.dataModification);
  },
  devices: async ({ pages }, use) => {
    await use(pages.devices);
  },
  djangoAdmin: async ({ pages }, use) => {
    await use(pages.djangoAdmin);
  },
  graphqlCommands: async ({ pages }, use) => {
    await use(pages.graphqlCommands);
  },
  login: async ({ pages }, use) => {
    await use(pages.login);
  },
  mail: async ({ pages }, use) => {
    await use(pages.mail);
  },
  mybookings: async ({ pages }, use) => {
    await use(pages.mybookings);
  },
  popups: async ({ pages }, use) => {
    await use(pages.popups);
  },
  quickReservation: async ({ pages }, use) => {
    await use(pages.quickReservation);
  },
  recurring: async ({ pages }, use) => {
    await use(pages.recurring);
  },
  recurringApplications: async ({ pages }, use) => {
    await use(pages.recurringApplications);
  },
  recurringApplicationsPage2: async ({ pages }, use) => {
    await use(pages.recurringApplicationsPage2);
  },
  recurringApplicationsPage3: async ({ pages }, use) => {
    await use(pages.recurringApplicationsPage3);
  },
  recurringApplicationsPagePreview: async ({ pages }, use) => {
    await use(pages.recurringApplicationsPagePreview);
  },
  recurringApplicationsPageSent: async ({ pages }, use) => {
    await use(pages.recurringApplicationsPageSent);
  },
  reservationCalendar: async ({ pages }, use) => {
    await use(pages.reservationCalendar);
  },
  reservationLownav: async ({ pages }, use) => {
    await use(pages.reservationLownav);
  },
  reservationUnitBookingDetails: async ({ pages }, use) => {
    await use(pages.reservationUnitBookingDetails);
  },
  reservationUnitReservationReceipt: async ({ pages }, use) => {
    await use(pages.reservationUnitReservationReceipt);
  },
  reservationUnitReserverInfo: async ({ pages }, use) => {
    await use(pages.reservationUnitReserverInfo);
  },
  reservationUnitReserverTypes: async ({ pages }, use) => {
    await use(pages.reservationUnitReserverTypes);
  },
  singlebooking: async ({ pages }, use) => {
    await use(pages.singlebooking);
  },
  topnav: async ({ pages }, use) => {
    await use(pages.topnav);
  },
  userLandingpage: async ({ pages }, use) => {
    await use(pages.userLandingpage);
  },
});
