import {
  ServiceSectorRoleType,
  UnitRoleType,
  UnitType,
  UserType,
} from "../common/gql-types";
import permissionHelper from "./permissionHelper";

test("permissionHelper returns true when named unit permission is set", () => {
  const user = {
    isSuperuser: false,
    unitRoles: [
      {
        id: "0",
        permissions: [{ permission: "fooPermission" }],
        units: [{ pk: 1 } as Partial<UnitType>],
      } as Partial<UnitRoleType>,
    ],
  } as Partial<UserType>;

  const ph = permissionHelper(user as UserType);

  expect(ph("fooPermission", 1)).toBeTruthy();
});

test("permissionHelper returns flase when named unit permission is not set", () => {
  const user = {
    isSuperuser: false,
    unitRoles: [
      {
        id: "0",
        permissions: [{ permission: "fooPermission" }],
        units: [{ pk: 1 } as Partial<UnitType>],
      } as Partial<UnitRoleType>,
    ],
  } as Partial<UserType>;

  const ph = permissionHelper(user as UserType);

  expect(ph("otherPermission", 1)).toBeFalsy();
});

test("permissionHelper returns true when named serviceSector permission is set", () => {
  const user = {
    isSuperuser: false,
    serviceSectorRoles: [
      {
        id: "5",
        permissions: [{ permission: "fooPermission" }],
        serviceSector: {
          pk: 1,
        },
      } as Partial<ServiceSectorRoleType>,
    ],
  } as Partial<UserType>;

  const ph = permissionHelper(user as UserType);

  expect(ph("fooPermission", -1, 1)).toBeTruthy();
});

test("permissionHelper returns false when named serviceSector permission is set", () => {
  const user = {
    isSuperuser: false,
    serviceSectorRoles: [
      {
        id: "5",
        permissions: [{ permission: "fooPermission" }],
        serviceSector: {
          pk: 1,
        },
      } as Partial<ServiceSectorRoleType>,
    ],
  } as Partial<UserType>;

  const ph = permissionHelper(user as UserType);

  expect(ph("otherPermission", -1, 1)).toBeFalsy();
});

test("permissionHelper returns true for superuser", () => {
  const user = {
    isSuperuser: true,
  } as Partial<UserType>;

  const ph = permissionHelper(user as UserType);

  expect(ph("fooPermission", -1, 1)).toBeTruthy();

  expect(ph("otherPermission", -1, 1)).toBeTruthy();
});
