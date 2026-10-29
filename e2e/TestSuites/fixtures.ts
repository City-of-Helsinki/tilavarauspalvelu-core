/**
 * The suites' `test`: Playwright's fixtures, plus the test data that each test's tags choose (`testData`), and a
 * staggered start for the first test of each parallel slot (`staggeredStart`).
 *
 * - A data set tag (e.g. `@desktop-test-data-set-0`) picks the test's users from the section with the same tag in
 *   `Resources/pabot_users.dat`. Only one test at a time uses a data set.
 * - A suite tag (`@desktop-suite`, `@admin-suite`, `@combined-suite`, `@android-suite`, `@iphone-suite`) picks the
 *   test's units from `Resources/suite_specific_units`.
 * - In sequential mode (FORCE_SINGLE_USER=True or one worker), and in tests without a data set tag, the tests use the
 *   shared users of `Resources/serial_users`.
 *
 * The keywords read the test data from their Robot variables (`V.CURRENT_USER_HETU`, `V.CURRENT_ALWAYS_FREE_UNIT`,
 * …), which the fixture sets before the test starts.
 *
 * The page objects are fixtures too, by their names in `Pages` (`TestSuites/pages.ts`):
 * `test("…", async ({ appCommon, appUser }) => { await appCommon.userLogsInWithSuomiFi(); … })`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { PabotLib, sharedDir } from "../lib/PabotLib";
import { V, isSequential, runStep, str, test as base } from "../lib/robot";
import type { RobotValue } from "../lib/robot";
import { Session } from "../lib/session";
import { Pages } from "./pages";
import "./Resources/serial_users";
import "./Resources/suite_specific_units";

const PABOT_USERS = join(import.meta.dirname, "Resources/pabot_users.dat");

const DATA_SET_TAG =
  /^(desktop-test-data|admin-test-data|mobile-android-data|mobile-iphone-data|combined-test-data)-set-\d+$/;

// The Robot variables of each kind of user, as the sections of pabot_users.dat name them
const USER_KEYS = [
  "CURRENT_USER_EMAIL",
  "CURRENT_USER_FIRST_NAME",
  "CURRENT_USER_LAST_NAME",
  "CURRENT_USER_FULLNAME",
  "CURRENT_USER_HETU",
  "CURRENT_USER_PHONE",
  "CURRENT_PASSWORD",
] as const;
const ADMIN_KEYS = [
  "ADMIN_CURRENT_USER_EMAIL",
  "ADMIN_CURRENT_USER_FIRST_NAME",
  "ADMIN_CURRENT_USER_LAST_NAME",
  "ADMIN_CURRENT_USER_HETU",
  "ADMIN_CURRENT_USER_FULLNAME",
  "ADMIN_CURRENT_USER_PASSWORD",
] as const;
const DJANGO_ADMIN_KEYS = [
  "DJANGO_ADMIN_EMAIL",
  "DJANGO_ADMIN_FIRST_NAME",
  "DJANGO_ADMIN_LAST_NAME",
  "DJANGO_ADMIN_HETU",
  "DJANGO_ADMIN_FULLNAME",
  "DJANGO_ADMIN_DJANGO_USERNAME",
] as const;
const PERMISSION_TARGET_KEYS = [
  "PERMISSION_TARGET_ADMIN_EMAIL",
  "PERMISSION_TARGET_ADMIN_FIRST_NAME",
  "PERMISSION_TARGET_ADMIN_LAST_NAME",
  "PERMISSION_TARGET_ADMIN_HETU",
  "PERMISSION_TARGET_ADMIN_FULLNAME",
  "PERMISSION_TARGET_DJANGO_USERNAME",
] as const;

/** The units of suite_specific_units that the suite tags pick. */
type Unit =
  | "ALWAYS_FREE_UNIT"
  | "ALWAYS_PAID_UNIT"
  | "ALWAYS_PAID_UNIT_SUBVENTED"
  | "FREE_UNIT_NO_CANCEL"
  | "UNAVAILABLE_UNIT"
  | "UNIT_REQUIRES_ALWAYS_HANDLING"
  | "UNIT_WITH_ACCESS_CODE";

/** The Robot variables this fixture sets: a data set's users and a suite's units (see variable-types.ts). */
export type TestDataVariableName =
  | (typeof USER_KEYS)[number]
  | (typeof ADMIN_KEYS)[number]
  | (typeof DJANGO_ADMIN_KEYS)[number]
  | (typeof PERMISSION_TARGET_KEYS)[number]
  | `CURRENT_${Unit}`
  | `CURRENT_${Unit}_WITH_LOCATION`;

/** `CURRENT_<unit>` and `CURRENT_<unit>_WITH_LOCATION` from the units of suite_specific_units with this prefix. */
function units(prefix: string, names: ReadonlyArray<Unit>): Record<string, string> {
  return Object.fromEntries(
    names.flatMap((unit) => [
      [`CURRENT_${unit}`, `${prefix}_${unit}`],
      [`CURRENT_${unit}_WITH_LOCATION`, `${prefix}_${unit}_WITH_LOCATION`],
    ])
  );
}

const MOBILE_UNITS: Unit[] = [
  "ALWAYS_FREE_UNIT",
  "ALWAYS_PAID_UNIT",
  "UNIT_WITH_ACCESS_CODE",
  "ALWAYS_PAID_UNIT_SUBVENTED",
  "UNIT_REQUIRES_ALWAYS_HANDLING",
];

/** The units each suite tag picks: the `CURRENT_…` variable and the suite_specific_units variable it comes from. */
const SUITE_UNITS: Record<string, Record<string, string>> = {
  "desktop-suite": units("DESKTOP", [
    "ALWAYS_FREE_UNIT",
    "ALWAYS_PAID_UNIT",
    "ALWAYS_PAID_UNIT_SUBVENTED",
    "FREE_UNIT_NO_CANCEL",
    "UNAVAILABLE_UNIT",
  ]),
  "admin-suite": units("DESKTOP", ["UNAVAILABLE_UNIT"]),
  "combined-suite": {
    ...units("COMBINED", ["ALWAYS_PAID_UNIT_SUBVENTED", "UNIT_REQUIRES_ALWAYS_HANDLING"]),
    ...units("DESKTOP", ["UNIT_WITH_ACCESS_CODE"]),
  },
  "android-suite": units("ANDROID", MOBILE_UNITS),
  "iphone-suite": units("IPHONE", MOBILE_UNITS),
};

// The admins whose permissions the permission tests change, in sequential mode
const PERMISSION_TARGETS: Record<string, Record<string, string>> = {
  "unit-permissions-test": {
    PERMISSION_TARGET_ADMIN_EMAIL: "qfaksi+niko@gmail.com",
    PERMISSION_TARGET_ADMIN_HETU: "150785-907H",
    PERMISSION_TARGET_ADMIN_FIRST_NAME: "Niko",
    PERMISSION_TARGET_ADMIN_LAST_NAME: "Selänne",
    PERMISSION_TARGET_ADMIN_FULLNAME: "Niko Selänne",
  },
  "unit-group-permissions-test": {
    PERMISSION_TARGET_ADMIN_EMAIL: "qfaksi+mikko@gmail.com",
    PERMISSION_TARGET_ADMIN_HETU: "200685-907K",
    PERMISSION_TARGET_ADMIN_FIRST_NAME: "Mikko",
    PERMISSION_TARGET_ADMIN_LAST_NAME: "Mäkinen",
    PERMISSION_TARGET_ADMIN_FULLNAME: "Mikko Mäkinen",
  },
};

/**
 * The sections of pabot_users.dat by their `tags` value. The keys are uppercase, like the Robot variables they set
 * (pabot's configparser lowercased them).
 */
function readDataSets(file = PABOT_USERS): Map<string, Record<string, string>> {
  const sets = new Map<string, Record<string, string>>();
  let current: Record<string, string> | null = null;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#") || line.startsWith(";")) {
      continue;
    }
    if (/^\[.+\]$/.test(line)) {
      current = {};
      continue;
    }
    const separator = line.indexOf("=");
    if (current != null && separator > 0) {
      const key = line.slice(0, separator).trim().toUpperCase();
      current[key] = line.slice(separator + 1).trim();
      if (key === "TAGS") {
        for (const tag of current.TAGS?.split(",") ?? []) {
          sets.set(tag.trim(), current);
        }
      }
    }
  }
  return sets;
}

export interface TestData {
  /** The data set tag, or null when the test uses the shared users of serial_users */
  dataSet: string | null;
  /** The suite tag the units come from */
  suite: string;
  /** The Robot variables that the tags choose, e.g. CURRENT_USER_HETU and CURRENT_ALWAYS_FREE_UNIT */
  variables: Record<string, RobotValue>;
}

/**
 * The test data that the tags (without "@") choose. `defaults` are the Robot variables of serial_users and
 * suite_specific_units, which the shared users and the units come from.
 */
export function resolveTestData(
  tags: string[],
  options: { sequential: boolean; defaults: Record<string, RobotValue> },
  file = PABOT_USERS
): TestData {
  const { defaults } = options;
  const tagged = tags.find((tag) => DATA_SET_TAG.test(tag)) ?? null;
  const combined = tagged?.startsWith("combined-test-data") ?? false;
  const admin = (tagged?.startsWith("admin-test-data") ?? false) || combined;
  const user = !admin || combined;
  const permissionTest = tags.find((tag) => tag.endsWith("permissions-test")) ?? null;
  const suite = Object.keys(SUITE_UNITS).find((name) => tags.includes(name)) ?? "desktop-suite";

  const variables: Record<string, RobotValue> = {};
  for (const [name, source] of Object.entries(SUITE_UNITS[suite] ?? {})) {
    variables[name] = defaults[source];
  }

  const dataSet = options.sequential ? null : tagged;
  if (dataSet != null) {
    const values = readDataSets(file).get(dataSet);
    if (values == null) {
      throw new Error(`No section with tags=${dataSet} in pabot_users.dat`);
    }
    let keys: ReadonlyArray<string> = user ? USER_KEYS : [];
    if (admin) {
      keys = [...keys, ...(permissionTest == null ? ADMIN_KEYS : [...DJANGO_ADMIN_KEYS, ...PERMISSION_TARGET_KEYS])];
    }
    for (const key of keys) {
      const value = values[key];
      if (value == null) {
        throw new Error(`The section with tags=${dataSet} in pabot_users.dat has no ${key}`);
      }
      variables[key] = value;
    }
    return { dataSet, suite, variables };
  }

  // The shared users of serial_users
  if (user) {
    Object.assign(variables, {
      CURRENT_USER_EMAIL: defaults.BASIC_USER_MALE_EMAIL,
      CURRENT_USER_HETU: defaults.BASIC_USER_MALE_HETU,
      CURRENT_USER_PHONE: defaults.BASIC_USER_MALE_PHONE,
      CURRENT_USER_FIRST_NAME: defaults.BASIC_USER_MALE_FIRSTNAME,
      CURRENT_USER_LAST_NAME: defaults.BASIC_USER_MALE_LASTNAME,
      CURRENT_USER_FULLNAME: `${str(defaults.BASIC_USER_MALE_FIRSTNAME)} ${str(defaults.BASIC_USER_MALE_LASTNAME)}`,
      CURRENT_PASSWORD: defaults.BASIC_USER_MALE_PASSWORD,
    });
  }
  if (admin && permissionTest == null) {
    Object.assign(variables, {
      ADMIN_CURRENT_USER_EMAIL: defaults.BASIC_ADMIN_MALE_EMAIL,
      ADMIN_CURRENT_USER_HETU: defaults.BASIC_ADMIN_MALE_HETU,
      ADMIN_CURRENT_USER_FIRST_NAME: defaults.BASIC_ADMIN_MALE_FIRSTNAME,
      ADMIN_CURRENT_USER_LAST_NAME: defaults.BASIC_ADMIN_MALE_LASTNAME,
      ADMIN_CURRENT_USER_FULLNAME: defaults.BASIC_ADMIN_MALE_FULLNAME,
      ADMIN_CURRENT_USER_PASSWORD: defaults.BASIC_ADMIN_MALE_PASSWORD,
    });
  }
  if (admin && permissionTest != null) {
    Object.assign(
      variables,
      {
        DJANGO_ADMIN_EMAIL: defaults.BASIC_DJANGO_ADMIN_EMAIL,
        DJANGO_ADMIN_HETU: defaults.BASIC_DJANGO_ADMIN_HETU,
        DJANGO_ADMIN_FIRST_NAME: defaults.BASIC_DJANGO_ADMIN_FIRSTNAME,
        DJANGO_ADMIN_LAST_NAME: defaults.BASIC_DJANGO_ADMIN_LASTNAME,
        DJANGO_ADMIN_FULLNAME: defaults.BASIC_DJANGO_ADMIN_FULLNAME,
        DJANGO_ADMIN_DJANGO_USERNAME: defaults.BASIC_DJANGO_ADMIN_DJANGO_USERNAME,
      },
      PERMISSION_TARGETS[permissionTest] ?? {
        PERMISSION_TARGET_ADMIN_EMAIL: defaults.BASIC_PERMISSION_TARGET_ADMIN_EMAIL,
        PERMISSION_TARGET_ADMIN_HETU: defaults.BASIC_PERMISSION_TARGET_ADMIN_HETU,
        PERMISSION_TARGET_ADMIN_FIRST_NAME: defaults.BASIC_PERMISSION_TARGET_ADMIN_FIRSTNAME,
        PERMISSION_TARGET_ADMIN_LAST_NAME: defaults.BASIC_PERMISSION_TARGET_ADMIN_LASTNAME,
        PERMISSION_TARGET_ADMIN_FULLNAME: defaults.BASIC_PERMISSION_TARGET_ADMIN_FULLNAME,
      }
    );
  }
  return { dataSet: null, suite, variables };
}

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
  { staggeredStart: void; testData: TestData; session: Session; pages: Pages } & PageObjectFixtures
>({
  // Like Apply Staggered Startup Strategy in devices.robot, the run's first test in each parallel slot waits 3 s times
  // the slot's number, so the first tests don't all log in at once. Suomi.fi logins that ended at the same moment were
  // refused (access_denied) or sent to Helsinki Profiili's email page. Later tests start at different times anyway.
  staggeredStart: [
    async ({ robotTest: _robotTest }, use, info) => {
      if (info.parallelIndex > 0 && (await firstInSlot(info.parallelIndex))) {
        await runStep(`Staggered start: waits ${info.parallelIndex * 3} s`, () =>
          setTimeout(info.parallelIndex * 3000)
        );
      }
      await use();
    },
    { auto: true },
  ],
  testData: [
    async ({ robotTest: _robotTest }, use, info) => {
      const data = resolveTestData(
        info.tags.map((tag) => tag.replace(/^@/, "")),
        { sequential: isSequential(), defaults: V }
      );
      Object.assign(V, data.variables);
      // Like a pabot value set, a data set's users are used by one test at a time
      if (data.dataSet != null) {
        await PabotLib["Acquire Lock"](`DATA_SET_${data.dataSet}`);
      }
      await use(data);
      if (data.dataSet != null) {
        await PabotLib["Release Lock"](`DATA_SET_${data.dataSet}`);
      }
    },
    { auto: true },
  ],
  session: async ({ browser, context, page }, use, info) => {
    const session = new Session({ browser, context, page }, info);
    await use(session);
    await session.close();
  },
  pages: async ({ session }, use) => {
    await use(new Pages(session));
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
