import { describe, expect, test } from "vitest";
import { createNodeId } from "@ui/modules/helpers";
import { UserPermissionChoice, UserRoleChoice } from "@gql/gql-types";
import type { CurrentUserQuery } from "@gql/gql-types";
import { hasPermission } from "./permissionHelper";

function getPermissionsForRole(role: UserRoleChoice): UserPermissionChoice[] {
  switch (role) {
    case UserRoleChoice.Admin:
      return Object.values(UserPermissionChoice);
    case UserRoleChoice.Reserver:
      return [UserPermissionChoice.CanCreateStaffReservations];
    case UserRoleChoice.Handler:
      return [
        UserPermissionChoice.CanCreateStaffReservations,
        UserPermissionChoice.CanManageApplications,
        UserPermissionChoice.CanManageReservations,
        UserPermissionChoice.CanViewApplications,
        UserPermissionChoice.CanViewReservations,
      ];
    case UserRoleChoice.NotificationManager:
      return [UserPermissionChoice.CanManageNotifications];
    case UserRoleChoice.Viewer:
      return [UserPermissionChoice.CanViewApplications, UserPermissionChoice.CanViewReservations];
  }
}

type UserT = CurrentUserQuery["currentUser"];
function createUser({
  isSuperuser = false,
  generalRoles = [],
  unitRoles = [],
}: {
  isSuperuser?: boolean;
  generalRoles?: UserRoleChoice[];
  unitRoles?: Array<{
    role: UserRoleChoice;
    units: number[];
    unitGroups?: Array<{
      units: number[];
    }>;
  }>;
} = {}): UserT {
  const generalRolesPermissions = generalRoles.map((role) => ({
    id: "",
    permissions: getPermissionsForRole(role),
    role,
  }));

  const unitRolesPermissions = unitRoles.map(({ role, units, unitGroups = [] }) => ({
    id: "",
    role,
    permissions: getPermissionsForRole(role),
    units: units.map((unit) => ({
      id: "",
      pk: unit,
      nameFi: `Unit ${unit} FI`,
    })),
    unitGroups: unitGroups.map((grp) => ({
      id: "",
      units: grp.units.map((x) => ({
        id: "",
        pk: x,
      })),
    })),
  }));

  return {
    id: createNodeId("User", 551),
    pk: 551,
    username: "foobar",
    firstName: "Foo",
    lastName: "Bar",
    email: "foo@bar.com",
    isSuperuser,
    isAdAuthenticated: false,
    unitRoles: unitRolesPermissions,
    generalRoles: generalRolesPermissions,
  } satisfies UserT;
}
describe("hasPermission", () => {
  test.for(Object.values(UserPermissionChoice))("%s true for super user", (permission) => {
    const user = createUser({ isSuperuser: true });
    expect(hasPermission(user, permission)).toBeTruthy();
  });
  test.for(Object.values(UserPermissionChoice))("%s true for super user to random unit", (permission) => {
    const user = createUser({ isSuperuser: true });
    const unit = Math.floor(Math.random() * 500);
    expect(hasPermission(user, permission, unit)).toBeTruthy();
  });
  describe.for([
    UserRoleChoice.Admin,
    UserRoleChoice.Handler,
    UserRoleChoice.NotificationManager,
    UserRoleChoice.Reserver,
    UserRoleChoice.Viewer,
  ])("general role %s", (role) => {
    test.for(
      Object.values(UserPermissionChoice).map((permission) => ({
        permission,
        isAllowed: getPermissionsForRole(role).some((x) => x === permission),
      }))
    )("can $permission is $isAllowed", ({ permission, isAllowed }) => {
      const user = createUser({ isSuperuser: false, generalRoles: [role] });
      expect(hasPermission(user, permission)).toBe(isAllowed);
    });
  });

  describe.for([
    UserRoleChoice.Admin,
    UserRoleChoice.Handler,
    UserRoleChoice.NotificationManager,
    UserRoleChoice.Reserver,
    UserRoleChoice.Viewer,
  ])("unit role %s for valid unit", (role) => {
    test.for(
      Object.values(UserPermissionChoice).map((permission) => ({
        permission,
        isAllowed: getPermissionsForRole(role).some((x) => x === permission),
      }))
    )("can $permission is $isAllowed", ({ permission, isAllowed }) => {
      const user = createUser({ isSuperuser: false, unitRoles: [{ role, units: [1, 2, 3, 4, 100, 400, 401, 402] }] });
      expect(hasPermission(user, permission, 100)).toBe(isAllowed);
    });
  });

  describe.for([
    UserRoleChoice.Admin,
    UserRoleChoice.Handler,
    UserRoleChoice.NotificationManager,
    UserRoleChoice.Reserver,
    UserRoleChoice.Viewer,
  ])("unit role %s for not valid unit", (role) => {
    test.for(
      Object.values(UserPermissionChoice).map((permission) => ({
        permission,
      }))
    )("can $permission is not allowed", ({ permission }) => {
      const user = createUser({ isSuperuser: false, unitRoles: [{ role, units: [100] }] });
      expect(hasPermission(user, permission, 1)).toBeFalsy();
    });
  });

  describe.for([
    UserRoleChoice.Admin,
    UserRoleChoice.Handler,
    UserRoleChoice.NotificationManager,
    UserRoleChoice.Reserver,
    UserRoleChoice.Viewer,
  ])("unit group role %s for valid unit", (role) => {
    test.for(
      Object.values(UserPermissionChoice).map((permission) => ({
        permission,
        isAllowed: getPermissionsForRole(role).some((x) => x === permission),
      }))
    )("can $permission is $isAllowed", ({ permission, isAllowed }) => {
      const user = createUser({
        isSuperuser: false,
        unitRoles: [{ role, units: [], unitGroups: [{ units: [1, 2, 3, 4, 5, 100, 401, 402] }] }],
      });
      expect(hasPermission(user, permission, 100)).toBe(isAllowed);
    });
  });
});
