import {
  ServiceSectorRoleNode,
  UnitRoleNode,
  UserNode,
} from "common/types/gql-types";
import { hasPermission } from "./permissionHelper";

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
const unitRole: UnitRoleNode = {
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

const serviceSectorRoles: ServiceSectorRoleNode[] = [
  {
    id: "5",
    permissions: [{ permission: "fooPermission" }],
    serviceSector: {
      pk: 1,
      id: "",
    },
  },
];

test("hasPermission returns true when named unit permission is set", () => {
  const user = {
    ...userCommon,
    unitRoles: [unitRole],
  };

  const ph = hasPermission(user);

  expect(ph("fooPermission", 1)).toBeTruthy();
});

test("hasPermission returns flase when named unit permission is not set", () => {
  const user = {
    ...userCommon,
    unitRoles: [unitRole],
  };

  const ph = hasPermission(user);

  expect(ph("otherPermission", 1)).toBeFalsy();
});

test("hasPermission returns true when named serviceSector permission is set", () => {
  const user = {
    ...userCommon,
    serviceSectorRoles,
  };

  const ph = hasPermission(user);

  expect(ph("fooPermission", -1, [1])).toBeTruthy();
});

test("hasPermission returns false when named serviceSector permission is set", () => {
  const user: UserNode = {
    ...userCommon,
    serviceSectorRoles: [serviceSectorRole],
  };

  const ph = hasPermission(user);

  expect(ph("otherPermission", -1, [1])).toBeFalsy();
});

test("hasPermission returns true for superuser", () => {
  const user = {
    ...userCommon,
    isSuperuser: true,
  };

  const ph = hasPermission(user);

  expect(ph("fooPermission", -1, [1])).toBeTruthy();

  expect(ph("otherPermission", -1, [1])).toBeTruthy();
});
