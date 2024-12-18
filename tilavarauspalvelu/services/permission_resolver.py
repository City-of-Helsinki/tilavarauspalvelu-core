from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db.models import Q

from tilavarauspalvelu.enums import UserRoleChoice
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from collections.abc import Container, Iterable

    from tilavarauspalvelu.enums import UserPermissionChoice
    from tilavarauspalvelu.models import (
        Application,
        ApplicationRound,
        RecurringReservation,
        Reservation,
        ReservationUnit,
        Space,
        Unit,
        User,
    )
    from tilavarauspalvelu.typing import AnyUser


class PermissionResolver:
    """
    A class for figuring out user permissions.
    Should be used through a user instance: `user.permissions.`.
    Users must have `user.is_active=True` for their set permissions to apply.
    Also works for anonymous users.

    >>> if user.permissions.can_manage_reservation(reservation):
    ...     ...
    """

    def __get__(self, instance: AnyUser | None, owner: type[User]) -> Self:
        if instance is None:
            return self
        self.user = instance
        return self

    # Base checks

    def has_any_role(self) -> bool:
        """Check if the user has any role or is a superuser."""
        if self.is_user_anonymous_or_inactive():
            return False
        return (
            self.user.is_superuser
            or bool(self.user.active_general_roles)
            or bool(self.user.active_unit_roles)
            or bool(self.user.active_unit_group_roles)
        )

    def has_general_role(
        self,
        *,
        role_choices: Container[UserRoleChoice] | None = None,
        permit_reserver: bool = True,
    ) -> bool:
        """
        Check if the user has any of the given roles in their general roles.
        If no choices are given, check if the user has any general role.

        :param role_choices: The roles to check for. If not given, check if the user has any general role.
        :param permit_reserver: If set to False, don't count the `RESERVER` role if the user has it.
                                Reservers are only supposed to be able to modify their own reservations,
                                so this can be set to False if checking permissions for other user's reservations.
        """
        if self.is_user_anonymous_or_inactive():
            return False
        if role_choices is None:  # Has any general role
            return any(
                role  #
                for role in self.user.active_general_roles
                if permit_reserver or role != UserRoleChoice.RESERVER
            )
        return any(
            role in role_choices  #
            for role in self.user.active_general_roles
            if permit_reserver or role != UserRoleChoice.RESERVER
        )

    def has_role_for_units_or_their_unit_groups(
        self,
        *,
        units: Iterable[Unit] | None = None,
        role_choices: Container[UserRoleChoice] | None = None,
        require_all: bool = False,
        permit_reserver: bool = True,
    ) -> bool:
        """
        Check if the user has at least one of the given roles in the given units or their unit groups.
        If units are not given, use all units the user has roles in.
        If after that there are no units, then the user has no permission.
        If role choices are not given, check for any role.

        :param units: Units to check for the role.
        :param role_choices: Roles to check for.
        :param require_all: If True, require roles in all the given units or their unit groups instead of any.
        :param permit_reserver: If set to False, don't count the `RESERVER` role as a role for the given units.
                                Reservers are only supposed to be able to modify their own reservations,
                                so this can be set to False if checking permissions for other user's reservations.
        """
        if self.is_user_anonymous_or_inactive():
            return False

        if units is None:  # Check for any unit or unit group the user has roles in
            from tilavarauspalvelu.models import Unit

            unit_ids = list(self.user.active_unit_roles.keys())
            unit_group_ids = list(self.user.active_unit_group_roles.keys())
            units = (
                Unit.objects.filter(Q(pk__in=unit_ids) | Q(unit_groups__pk__in=unit_group_ids))
                .prefetch_related("unit_groups")
                .distinct()
            )

        units = list(units)
        if not units:
            return False

        if role_choices is None:  # Check for any role
            role_choices = list(UserRoleChoice)

        has_role = False
        for unit in units:
            roles = self.user.active_unit_roles.get(unit.pk, [])
            has_role = any(
                role in role_choices  #
                for role in roles
                if permit_reserver or role != UserRoleChoice.RESERVER
            )

            # No role though units -> check through unit groups
            if not has_role:
                has_role = any(
                    role in role_choices
                    for unit_group in unit.unit_groups.all()
                    for role in self.user.active_unit_group_roles.get(unit_group.pk, [])
                    if permit_reserver or role != UserRoleChoice.RESERVER
                )

            # If we require roles for all units, we need to keep checking until all units have been checked.
            # If at any point we don't have a role for a unit or it's groups, we can stop early.
            if require_all:
                if not has_role:
                    return False
            # Once we have found a role for any unit or its unit group, we can stop.
            elif has_role:
                return True

        return has_role

    def has_permission_for_unit_or_their_unit_group(
        self,
        *,
        permission: UserPermissionChoice,
        unit_ids: Iterable[Unit] = (),
        require_all: bool = False,
    ) -> bool:
        from tilavarauspalvelu.models import Unit

        unit_ids = list(unit_ids)
        if not unit_ids:  # Check for all units and unit groups the user has permissions for.
            unit_ids = list(self.user.active_unit_permissions.keys())
            unit_group_ids = list(self.user.active_unit_group_permissions.keys())
            units = (
                Unit.objects.filter(Q(pk__in=unit_ids) | Q(unit_groups__pk__in=unit_group_ids))
                .prefetch_related("unit_groups")
                .distinct()
            )
        else:
            units = Unit.objects.filter(pk__in=unit_ids).prefetch_related("unit_groups")

        # Has the given permission through their unit roles in the given units or their unit groups
        has_permission: bool = False
        for unit in units:
            permissions = self.user.active_unit_permissions.get(unit.pk, [])
            has_permission = permission in permissions

            # No permissions though units -> check through unit groups
            if not has_permission:
                permissions = {
                    permission
                    for unit_group in unit.unit_groups.all()
                    for permission in self.user.active_unit_group_permissions.get(unit_group.pk, [])
                }
                has_permission = permission in permissions

            # If we require permissions for all units, we need to keep checking until all units have been checked.
            # If at any point we don't have permission for a unit or it's groups, we can stop early.
            if require_all:
                if not has_permission:
                    return False
            # If we require permissions for any unit, we can stop once we have found one.
            elif has_permission:
                return True

        return has_permission

    def is_user_anonymous_or_inactive(self) -> bool:
        return getattr(self, "user", None) is None or self.user.is_anonymous or not self.user.is_active

    # ID helpers

    def unit_ids_where_has_role(self, *, role_choices: Container[UserRoleChoice]) -> list[int]:
        """List unit ids where the user has any of the given roles."""
        if self.is_user_anonymous_or_inactive():
            return []
        return [
            pk
            for pk, roles in self.user.active_unit_roles.items()  #
            if any(role in role_choices for role in roles)
        ]

    def unit_group_ids_where_has_role(self, *, role_choices: Container[UserRoleChoice]) -> list[int]:
        """List unit group ids where the user has any of the given roles."""
        if self.is_user_anonymous_or_inactive():
            return []
        return [
            pk
            for pk, roles in self.user.active_unit_group_roles.items()  #
            if any(role in role_choices for role in roles)
        ]

    # Permission checks

    def can_create_staff_reservation(self, reservation_unit: ReservationUnit, *, is_reservee: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        role_choices = UserRoleChoice.can_create_staff_reservations()
        if self.has_general_role(role_choices=role_choices, permit_reserver=is_reservee):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=[reservation_unit.unit],
            role_choices=role_choices,
            require_all=True,
            permit_reserver=is_reservee,
        )

    def can_manage_application(
        self,
        application: Application,
        *,
        reserver_needs_role: bool = False,
        all_units: bool = False,
    ) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        if (
            not reserver_needs_role
            and self.user == application.user
            and local_datetime() < application.application_round.application_period_end
        ):
            return True

        role_choices = UserRoleChoice.can_manage_applications()
        if self.has_general_role(role_choices=role_choices):
            return True

        units = application.units_for_permissions
        return self.has_role_for_units_or_their_unit_groups(
            units=units,
            role_choices=role_choices,
            require_all=all_units,
        )

    def can_manage_application_round(self, application_round: ApplicationRound) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        role_choices = UserRoleChoice.can_manage_applications()
        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=application_round.units_for_permissions,
            role_choices=role_choices,
            require_all=True,
        )

    def can_manage_applications_for_units(self, units: Iterable[Unit], *, any_unit: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        role_choices = UserRoleChoice.can_manage_applications()
        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=units,
            role_choices=role_choices,
            require_all=not any_unit,
        )

    def can_manage_notifications(self) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        return self.has_general_role(role_choices=UserRoleChoice.can_manage_notifications())

    def can_manage_reservation(
        self,
        reservation: Reservation,
        *,
        reserver_needs_role: bool = False,
        allow_reserver_role_for_own_reservations: bool = False,
    ) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        if not reserver_needs_role and self.user == reservation.user:
            return True

        role_choices = UserRoleChoice.can_manage_reservations()
        if allow_reserver_role_for_own_reservations and self.user == reservation.user:
            role_choices.append(UserRoleChoice.RESERVER)

        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=reservation.units_for_permissions,
            role_choices=role_choices,
        )

    def can_manage_reservation_related_data(self) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        return self.has_general_role(role_choices=UserRoleChoice.can_manage_reservation_related_data())

    def can_manage_reservations_for_units(self, units: Iterable[Unit], *, any_unit: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        role_choices = UserRoleChoice.can_manage_reservations()
        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=units,
            role_choices=role_choices,
            require_all=not any_unit,
        )

    def can_manage_resources(self, space: Space | None) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        role_choices = UserRoleChoice.can_manage_reservation_units()
        if self.has_general_role(role_choices=role_choices):
            return True

        if space is None:
            return False

        return self.has_role_for_units_or_their_unit_groups(
            units=[space.unit],
            role_choices=role_choices,
            require_all=True,
        )

    def can_manage_spaces(self, unit: Unit | None) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        role_choices = UserRoleChoice.can_manage_reservation_units()
        if self.has_general_role(role_choices=role_choices):
            return True

        if unit is None:
            return False

        return self.has_role_for_units_or_their_unit_groups(
            units=[unit],
            role_choices=role_choices,
            require_all=True,
        )

    def can_manage_unit(self, unit: Unit) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        role_choices = UserRoleChoice.can_manage_reservation_units()
        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=[unit],
            role_choices=role_choices,
            require_all=True,
        )

    def can_view_application(self, application: Application, *, reserver_needs_role: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        if not reserver_needs_role and self.user == application.user:
            return True

        role_choices = UserRoleChoice.can_view_applications()
        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=application.units_for_permissions,
            role_choices=role_choices,
        )

    def can_view_recurring_reservation(self, recurring_reservation: RecurringReservation) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        if self.user == recurring_reservation.user:
            return True

        role_choices = UserRoleChoice.can_view_reservations()
        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=[recurring_reservation.reservation_unit.unit],
            role_choices=role_choices,
        )

    def can_view_reservation(self, reservation: Reservation, *, reserver_needs_role: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        if self.user == reservation.user and (self.has_any_role() if reserver_needs_role else True):
            return True

        role_choices = UserRoleChoice.can_view_reservations()
        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=reservation.units_for_permissions,
            role_choices=role_choices,
        )

    def can_view_user(self, user: User | None) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        if self.user == user:
            return True

        roles = UserRoleChoice.can_view_users()
        if self.has_general_role(role_choices=roles):
            return True

        # Is admin in any unit or unit group
        return self.has_role_for_units_or_their_unit_groups(role_choices=roles)
