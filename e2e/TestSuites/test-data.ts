/**
 * The test data that each test's tags choose. The `testData` fixture (TestSuites/fixtures.ts) gives it to the test and
 * its page objects (`this.testData`):
 *
 * - A data set tag picks the users from `Resources/test_users.ts`: `@user-data-set-N` (the project's platform picks
 *   the set's user), `@admin-test-data-set-N` or `@combined-test-data-set-N`. One test at a time uses a data set.
 * - A suite tag (`@admin-suite`, `@combined-suite`) picks the units from `Resources/suite_specific_units`. A customer
 *   test has none: its platform picks the units (`desktop-suite`, `android-suite`, `iphone-suite`). A customer test
 *   that names a suite fails, and so does any test that names one of the platform suites.
 * - In sequential mode (FORCE_SINGLE_USER=True or one worker) and in tests without a data set tag, the tests use the
 *   shared users of `Resources/serial_users`.
 */
import {
  BASIC_ADMIN_MALE,
  BASIC_DJANGO_ADMIN,
  BASIC_PERMISSION_TARGET_ADMIN,
  BASIC_USER_MALE,
} from "./Resources/serial_users";
import { ANDROID_UNITS, COMBINED_UNITS, DESKTOP_UNITS, IPHONE_UNITS } from "./Resources/suite_specific_units";
import { ADMIN_DATA_SETS, COMBINED_DATA_SETS, PLATFORMS, USER_DATA_SETS } from "./Resources/test_users";
import type { Admin, DjangoUser, Person, Platform, User } from "./Resources/test_users";

const DATA_SET_TAG = /^(user-data|admin-test-data|combined-test-data)-set-\d+$/;

/** A tag that looks like a data set tag, valid or not: a letter for the number, a typo or an old name */
const LOOKS_LIKE_DATA_SET_TAG = /data-set|-set-/;

/**
 * The platform of a project, its `metadata.platform` in playwright.config.ts: `desktop` when it has none. The platform
 * and the project's device must agree, so a phone project without a platform can't get the desktop's users and units.
 */
export function platformOf(project: { metadata: Record<string, unknown>; use: { isMobile?: boolean } }): Platform {
  const platform = project.metadata.platform ?? "desktop";
  const known = PLATFORMS.find((name) => name === platform);
  if (known == null) {
    throw new Error(`The project's platform is ${String(platform)}, not one of ${PLATFORMS.join(", ")}`);
  }
  const phone = project.use.isMobile === true;
  if (phone && known === "desktop") {
    throw new Error(
      "The project's device is a phone, but its platform is desktop: set the platform in playwright.config.ts"
    );
  }
  if (!phone && known !== "desktop") {
    throw new Error(`The project's platform is ${known}, but its device is not a phone`);
  }
  return known;
}

const UNIT_NAMES = [
  "alwaysFreeUnit",
  "alwaysPaidUnit",
  "alwaysPaidUnitSubvented",
  "freeUnitNoCancel",
  "unavailableUnit",
  "unitRequiresAlwaysHandling",
  "unitWithAccessCode",
] as const;

type UnitName = (typeof UNIT_NAMES)[number];

/** A unit's name, and the name with its location ("…, Harakka, piilokoju") */
export type Units = Record<UnitName | `${UnitName}WithLocation`, string>;

export interface TestData {
  /** The data set that the users come from (a customer set with its platform), or null for the shared users */
  dataSet: string | null;
  /** The suite the units come from */
  suite: string;
  user: User;
  admin: Admin;
  djangoAdmin: DjangoUser;
  permissionTarget: DjangoUser;
  /** The units of the suite. Reading a unit that the suite doesn't pick fails. */
  units: Units;
}

const NO_PERSON: Person = { email: "", firstName: "", lastName: "", fullName: "", hetu: "" };

/** The units of a platform in suite_specific_units, with the location: `alwaysFreeUnit` and `alwaysFreeUnitWithLocation` */
function pick(platform: Partial<Units>, names: UnitName[]): Partial<Units> {
  const units: Partial<Units> = {};
  for (const name of names) {
    for (const key of [name, `${name}WithLocation`] as const) {
      const value = platform[key];
      if (value == null) {
        throw new Error(`suite_specific_units has no ${key} of this platform`);
      }
      units[key] = value;
    }
  }
  return units;
}

const MOBILE_UNITS: UnitName[] = [
  "alwaysFreeUnit",
  "alwaysPaidUnit",
  "unitWithAccessCode",
  "alwaysPaidUnitSubvented",
  "unitRequiresAlwaysHandling",
];

/** The units each suite tag picks */
const SUITE_UNITS: Record<string, Partial<Units>> = {
  "desktop-suite": pick(DESKTOP_UNITS, [
    "alwaysFreeUnit",
    "alwaysPaidUnit",
    "alwaysPaidUnitSubvented",
    "freeUnitNoCancel",
    "unavailableUnit",
  ]),
  "admin-suite": pick(DESKTOP_UNITS, ["unavailableUnit"]),
  "combined-suite": {
    ...pick(COMBINED_UNITS, ["alwaysPaidUnitSubvented", "unitRequiresAlwaysHandling"]),
    ...pick(DESKTOP_UNITS, ["unitWithAccessCode"]),
  },
  "android-suite": pick(ANDROID_UNITS, MOBILE_UNITS),
  "iphone-suite": pick(IPHONE_UNITS, MOBILE_UNITS),
};

/** The suite of a platform's customer tests, which name none */
const PLATFORM_SUITE: Record<Platform, string> = {
  desktop: "desktop-suite",
  android: "android-suite",
  iphone: "iphone-suite",
};

/** The suites that a test names with a tag. The other tests get the suite of their project's platform. */
const SUITE_TAGS = ["admin-suite", "combined-suite"];

/** The suite's units. A unit the suite doesn't pick is a getter that fails, so a wrong unit isn't used silently. */
function suiteUnits(suite: string): Units {
  const picked = SUITE_UNITS[suite] ?? {};
  const units = { ...picked } as Units;
  for (const name of UNIT_NAMES) {
    for (const key of [name, `${name}WithLocation`] as const) {
      if (!(key in picked)) {
        Object.defineProperty(units, key, {
          get: () => {
            throw new Error(`The ${suite} tests have no unit ${key}`);
          },
        });
      }
    }
  }
  return units;
}

// The admins whose permissions the permission tests change, in sequential mode
const PERMISSION_TARGETS: Record<string, Person> = {
  "unit-permissions-test": {
    email: "qfaksi+niko@gmail.com",
    hetu: "150785-907H",
    firstName: "Niko",
    lastName: "Selänne",
    fullName: "Niko Selänne",
  },
  "unit-group-permissions-test": {
    email: "qfaksi+mikko@gmail.com",
    hetu: "200685-907K",
    firstName: "Mikko",
    lastName: "Mäkinen",
    fullName: "Mikko Mäkinen",
  },
};

/** What a data set has for a kind of user: a set without it fails the test that needs it. */
function required<T>(value: T | undefined, dataSet: string, what: string): T {
  if (value == null) {
    throw new Error(`The data set ${dataSet} has no ${what}`);
  }
  return value;
}

/** The data set of a tag in one of the sets of test_users.ts: a tag without one fails the test. */
function dataSetOf<T>(sets: Record<string, T>, tag: string): T {
  const found: T | undefined = sets[tag];
  if (found == null) {
    throw new Error(`No data set ${tag} in test_users.ts`);
  }
  return found;
}

/** The test data that the tags (without "@") choose, for a project of the platform. */
export function resolveTestData(tags: string[], options: { sequential: boolean; platform?: Platform }): TestData {
  const platform = options.platform ?? "desktop";
  // A tag that looks like a data set tag but isn't one would leave the test with the shared users without a word
  const stale = tags.find((tag) => LOOKS_LIKE_DATA_SET_TAG.test(tag) && !DATA_SET_TAG.test(tag));
  if (stale != null) {
    throw new Error(
      `The tag ${stale} is not a data set tag: use user-data-set-N, admin-test-data-set-N or combined-test-data-set-N`
    );
  }
  // A platform's suite tag would give the test the units of another device
  const platformSuite = tags.find((tag) => Object.values(PLATFORM_SUITE).includes(tag));
  if (platformSuite != null) {
    throw new Error(`The tag ${platformSuite} is not used: the project's platform picks the units of a customer test`);
  }
  const tagged = tags.find((tag) => DATA_SET_TAG.test(tag)) ?? null;
  const customer = tagged?.startsWith("user-data") ?? false;
  const combined = tagged?.startsWith("combined-test-data") ?? false;
  const admin = (tagged?.startsWith("admin-test-data") ?? false) || combined;
  const user = !admin || combined;
  const permissionTest = tags.find((tag) => tag.endsWith("permissions-test")) ?? null;
  const suiteTag = SUITE_TAGS.find((name) => tags.includes(name));
  // A suite tag would give a customer test the units of an admin or combined test
  if (customer && suiteTag != null) {
    throw new Error(`The tag ${suiteTag} is not used in a customer test: its project's platform picks the units`);
  }
  const suite = suiteTag ?? PLATFORM_SUITE[platform];

  // The kinds of users a test doesn't have are empty
  const data: TestData = {
    dataSet: null,
    suite,
    user: { ...NO_PERSON, phone: "", password: "" },
    admin: { ...NO_PERSON, password: "" },
    djangoAdmin: { ...NO_PERSON, djangoUsername: "" },
    permissionTarget: { ...NO_PERSON, djangoUsername: "" },
    units: suiteUnits(suite),
  };

  const dataSet = options.sequential ? null : tagged;
  if (dataSet != null) {
    if (customer) {
      const customerSet = dataSetOf(USER_DATA_SETS, dataSet);
      data.dataSet = `${platform}-${dataSet}`;
      data.user = { ...required(customerSet[platform], dataSet, `user for ${platform}`) };
      return data;
    }
    data.dataSet = dataSet;
    if (combined) {
      const combinedSet = dataSetOf(COMBINED_DATA_SETS, dataSet);
      // A combined set has a customer and an admin, no Django admin
      if (permissionTest != null) {
        throw new Error(`The data set ${dataSet} has no Django admin`);
      }
      data.user = { ...combinedSet.user };
      data.admin = { ...combinedSet.admin };
      return data;
    }
    const adminSet = dataSetOf(ADMIN_DATA_SETS, dataSet);
    if (permissionTest == null) {
      data.admin = { ...required(adminSet.admin, dataSet, "admin") };
    } else {
      data.djangoAdmin = { ...required(adminSet.djangoAdmin, dataSet, "Django admin") };
      data.permissionTarget = { ...required(adminSet.permissionTarget, dataSet, "permission target") };
    }
    return data;
  }

  // The shared users of serial_users
  if (user) {
    data.user = { ...BASIC_USER_MALE };
  }
  if (admin && permissionTest == null) {
    data.admin = { ...BASIC_ADMIN_MALE };
  }
  if (admin && permissionTest != null) {
    const { password: _password, ...djangoAdmin } = BASIC_DJANGO_ADMIN;
    data.djangoAdmin = djangoAdmin;
    const { phone: _phone, ...target } = BASIC_PERMISSION_TARGET_ADMIN;
    data.permissionTarget = { ...(PERMISSION_TARGETS[permissionTest] ?? target), djangoUsername: "" };
  }
  return data;
}
