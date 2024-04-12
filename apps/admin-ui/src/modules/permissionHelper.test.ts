import {
  UnitNode,
  UnitPermissionChoices,
  UnitRoleNode,
  UnitRolePermissionNode,
  UserNode,
} from "common/types/gql-types";
import { Permission, hasPermission } from "./permissionHelper";

const userCommon = {
  id: "1",
  email: "",
  firstName: "",
  lastName: "",
  username: "",
  uuid: "",
  isSuperuser: false,
  unitRoles: [],
  generalRoles: [],
  serviceSectorRoles: [],
};

const unitRole: UnitRoleNode = {
  id: "0",
  role: {
    id: "1",
    permissions: [
      {
        id: "1",
        permission: UnitPermissionChoices.CanManageReservations,
      },
    ] as UnitRolePermissionNode[],
    code: "foo_permission",
    verboseName: "Foo permission",
  },
  unitGroup: [],
  unit: [
    {
      pk: 1,
      id: "",
      webPage: "",
      phone: "",
      name: "",
      email: "",
      description: "",
      shortDescription: "",
      reservationunitSet: [],
      serviceSectors: [],
      spaces: [],
    } as UnitNode,
  ],
};

test("hasPermission returns true when named unit permission is set", () => {
  const user: UserNode = {
    ...userCommon,
    unitRoles: [unitRole],
  };
  const ph = hasPermission(user);
  expect(ph(Permission.CAN_MANAGE_RESERVATIONS, 1)).toBeTruthy();
});

test("hasPermission returns flase when named unit permission is not set", () => {
  const user = {
    ...userCommon,
    unitRoles: [unitRole],
  };

  const ph = hasPermission(user);

  expect(ph(Permission.CAN_MANAGE_UNITS, 1)).toBeFalsy();
});

test("hasPermission returns true for superuser", () => {
  const user = {
    ...userCommon,
    isSuperuser: true,
  };

  const ph = hasPermission(user);
  expect(ph(Permission.CAN_MANAGE_RESERVATIONS, 1)).toBeTruthy();
  expect(ph(Permission.CAN_MANAGE_UNITS, 1)).toBeTruthy();
});
