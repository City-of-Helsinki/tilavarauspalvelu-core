/**
 * The test data that each test's tags choose, which the `testData` fixture (TestSuites/fixtures.ts) gives to the
 * test and its page objects (`this.testData`):
 *
 * - A data set tag (e.g. `@desktop-test-data-set-0`) picks the test's users from the section with the same tag in
 *   `Resources/pabot_users.dat`. Only one test at a time uses a data set.
 * - A suite tag (`@desktop-suite`, `@admin-suite`, `@combined-suite`, `@android-suite`, `@iphone-suite`) picks the
 *   test's units from `Resources/suite_specific_units`.
 * - In sequential mode (FORCE_SINGLE_USER=True or one worker), and in tests without a data set tag, the tests use the
 *   shared users of `Resources/serial_users`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BASIC_ADMIN_MALE,
  BASIC_DJANGO_ADMIN,
  BASIC_PERMISSION_TARGET_ADMIN,
  BASIC_USER_MALE,
} from "./Resources/serial_users";
import { ANDROID_UNITS, COMBINED_UNITS, DESKTOP_UNITS, IPHONE_UNITS } from "./Resources/suite_specific_units";

const PABOT_USERS = join(import.meta.dirname, "Resources/pabot_users.dat");

const DATA_SET_TAG =
  /^(desktop-test-data|admin-test-data|mobile-android-data|mobile-iphone-data|combined-test-data)-set-\d+$/;

export interface Person {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  hetu: string;
}

/** The customer who books */
export interface User extends Person {
  phone: string;
  password: string;
}

/** The admin of the admin UI */
export interface Admin extends Person {
  password: string;
}

/** The Django admin of the permission tests, and the admin whose permissions they change */
export interface DjangoUser extends Person {
  djangoUsername: string;
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
  /** The data set tag, or null when the test uses the shared users of serial_users */
  dataSet: string | null;
  /** The suite tag the units come from */
  suite: string;
  user: User;
  admin: Admin;
  djangoAdmin: DjangoUser;
  permissionTarget: DjangoUser;
  /** The units of the suite. Reading a unit that the suite doesn't pick fails. */
  units: Units;
}

// The keys of each kind of user in the sections of pabot_users.dat
const USER_KEYS: Record<keyof User, string> = {
  email: "CURRENT_USER_EMAIL",
  firstName: "CURRENT_USER_FIRST_NAME",
  lastName: "CURRENT_USER_LAST_NAME",
  fullName: "CURRENT_USER_FULLNAME",
  hetu: "CURRENT_USER_HETU",
  phone: "CURRENT_USER_PHONE",
  password: "CURRENT_PASSWORD",
};
const ADMIN_KEYS: Record<keyof Admin, string> = {
  email: "ADMIN_CURRENT_USER_EMAIL",
  firstName: "ADMIN_CURRENT_USER_FIRST_NAME",
  lastName: "ADMIN_CURRENT_USER_LAST_NAME",
  hetu: "ADMIN_CURRENT_USER_HETU",
  fullName: "ADMIN_CURRENT_USER_FULLNAME",
  password: "ADMIN_CURRENT_USER_PASSWORD",
};
const DJANGO_ADMIN_KEYS: Record<keyof DjangoUser, string> = {
  email: "DJANGO_ADMIN_EMAIL",
  firstName: "DJANGO_ADMIN_FIRST_NAME",
  lastName: "DJANGO_ADMIN_LAST_NAME",
  hetu: "DJANGO_ADMIN_HETU",
  fullName: "DJANGO_ADMIN_FULLNAME",
  djangoUsername: "DJANGO_ADMIN_DJANGO_USERNAME",
};
const PERMISSION_TARGET_KEYS: Record<keyof DjangoUser, string> = {
  email: "PERMISSION_TARGET_ADMIN_EMAIL",
  firstName: "PERMISSION_TARGET_ADMIN_FIRST_NAME",
  lastName: "PERMISSION_TARGET_ADMIN_LAST_NAME",
  hetu: "PERMISSION_TARGET_ADMIN_HETU",
  fullName: "PERMISSION_TARGET_ADMIN_FULLNAME",
  djangoUsername: "PERMISSION_TARGET_DJANGO_USERNAME",
};

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

/**
 * The sections of pabot_users.dat by their `tags` value. The keys are uppercase, as the variables of the Robot suite
 * were named (pabot's configparser lowercased them).
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

/** The person of a data set section, from the section's keys for that kind of user. */
function personOf<Field extends string>(
  values: Record<string, string>,
  keys: Record<Field, string>,
  dataSet: string
): Record<Field, string> {
  const person = {} as Record<Field, string>;
  for (const field of Object.keys(keys) as Field[]) {
    const value = values[keys[field]];
    if (value == null) {
      throw new Error(`The section with tags=${dataSet} in pabot_users.dat has no ${keys[field]}`);
    }
    person[field] = value;
  }
  return person;
}

/** The test data that the tags (without "@") choose. */
export function resolveTestData(tags: string[], options: { sequential: boolean }, file = PABOT_USERS): TestData {
  const tagged = tags.find((tag) => DATA_SET_TAG.test(tag)) ?? null;
  const combined = tagged?.startsWith("combined-test-data") ?? false;
  const admin = (tagged?.startsWith("admin-test-data") ?? false) || combined;
  const user = !admin || combined;
  const permissionTest = tags.find((tag) => tag.endsWith("permissions-test")) ?? null;
  const suite = Object.keys(SUITE_UNITS).find((name) => tags.includes(name)) ?? "desktop-suite";

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
    const values = readDataSets(file).get(dataSet);
    if (values == null) {
      throw new Error(`No section with tags=${dataSet} in pabot_users.dat`);
    }
    data.dataSet = dataSet;
    if (user) {
      data.user = personOf(values, USER_KEYS, dataSet);
    }
    if (admin && permissionTest == null) {
      data.admin = personOf(values, ADMIN_KEYS, dataSet);
    }
    if (admin && permissionTest != null) {
      data.djangoAdmin = personOf(values, DJANGO_ADMIN_KEYS, dataSet);
      data.permissionTarget = personOf(values, PERMISSION_TARGET_KEYS, dataSet);
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
