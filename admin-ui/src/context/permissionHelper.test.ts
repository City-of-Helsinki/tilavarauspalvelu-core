import {
  ServiceSectorRoleType,
  UnitRoleType,
  UserType,
} from "common/types/gql-types";
import permissionHelper from "./permissionHelper";

const userCommon = {
  id: "1",
  email: "",
  firstName: "",
  lastName: "",
  username: "",
  uuid: "",
  isSuperuser: false,
};
const serviceSectorRole = {
  id: "5",
  permissions: [{ permission: "fooPermission" }],
  serviceSector: {
    pk: 1,
    id: "1",
  },
};
const unitRole: UnitRoleType = {
  id: "0",
  permissions: [{ permission: "fooPermission" }],
  units: [
    {
      pk: 1,
      id: "",
      webPage: "",
      phone: "",
      email: "",
    },
  ],
};

const serviceSectorRoles: ServiceSectorRoleType[] = [
  {
    id: "5",
    permissions: [{ permission: "fooPermission" }],
    serviceSector: {
      pk: 1,
      id: "",
    },
  },
];

test("permissionHelper returns true when named unit permission is set", () => {
  const user = {
    ...userCommon,
    unitRoles: [unitRole],
  };

  const ph = permissionHelper(user);

  expect(ph("fooPermission", 1)).toBeTruthy();
});

test("permissionHelper returns flase when named unit permission is not set", () => {
  const user = {
    ...userCommon,
    unitRoles: [unitRole],
  };

  const ph = permissionHelper(user);

  expect(ph("otherPermission", 1)).toBeFalsy();
});

test("permissionHelper returns true when named serviceSector permission is set", () => {
  const user = {
    ...userCommon,
    serviceSectorRoles,
  };

  const ph = permissionHelper(user);

  expect(ph("fooPermission", -1, [1])).toBeTruthy();
});

test("permissionHelper returns false when named serviceSector permission is set", () => {
  const user: UserType = {
    ...userCommon,
    serviceSectorRoles: [serviceSectorRole],
  };

  const ph = permissionHelper(user);

  expect(ph("otherPermission", -1, [1])).toBeFalsy();
});

test("permissionHelper returns true for superuser", () => {
  const user = {
    ...userCommon,
    isSuperuser: true,
  };

  const ph = permissionHelper(user);

  expect(ph("fooPermission", -1, [1])).toBeTruthy();

  expect(ph("otherPermission", -1, [1])).toBeTruthy();
});
