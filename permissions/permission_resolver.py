from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db.models import Q

from common.date_utils import local_datetime
from permissions.enums import UserRoleChoice
from spaces.models import Unit

if TYPE_CHECKING:
    from collections.abc import Container, Iterable

    from applications.models import Application, ApplicationRound
    from common.typing import AnyUser
    from reservation_units.models import ReservationUnit
    from reservations.models import RecurringReservation, Reservation
    from spaces.models import Space
    from users.models import User


class PermissionResolver:
    """
    A class for figuring out user permissions.
    Should be used through a user instance: `user.permissions.`.
    Users must have `user.is_active=True` for their set permissions to apply.
    Also works for anonymous users.

    >>> if user.permissions.can_manage_reservation(reservation): ...
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
            or bool(self.user.general_roles_list)
            or bool(self.user.unit_roles_map)
            or bool(self.user.unit_group_roles_map)
        )

    def has_general_role(self, *, role_choices: Container[UserRoleChoice] | None = None) -> bool:
        """
        Check if the user has any of the given roles in their general roles.
        If no choices are given, check if the user has any general role.
        """
        if self.is_user_anonymous_or_inactive():
            return False
        if role_choices is None:  # Has any general role
            return bool(self.user.general_roles_list)
        return any(role in role_choices for role in self.user.general_roles_list)

    def has_role_for_units_or_their_unit_groups(
        self,
        *,
        units: Iterable[Unit] | None = None,
        role_choices: Container[UserRoleChoice] | None = None,
        require_all: bool = False,
    ) -> bool:
        """
        Check if the user has at least one of the given roles in the given units or their unit groups.
        If units are not given, use all units the user has roles in.
        If after that there are no units, then the user has no permission.
        If role choices are not given, check for any role.

        :param units: Units to check for the role.
        :param role_choices: Roles to check for.
        :param require_all: If True, require roles in all the given units or their unit groups instead of any.
        """
        if self.is_user_anonymous_or_inactive():
            return False

        if units is None:  # Check for any unit or unit group the user has roles in
            unit_ids = list(self.user.unit_roles_map.keys())
            unit_group_ids = list(self.user.unit_group_roles_map.keys())
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
            roles = self.user.unit_roles_map.get(unit.pk, [])
            has_role = any(role in role_choices for role in roles)

            # No role though units -> check through unit groups
            if not has_role:
                has_role = any(
                    role in role_choices
                    for unit_group in unit.unit_groups.all()
                    for role in self.user.unit_group_roles_map.get(unit_group.pk, [])
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

    def is_user_anonymous_or_inactive(self) -> bool:
        return getattr(self, "user", None) is None or self.user.is_anonymous or not self.user.is_active

    def is_superuser_or_has_general_role(self, *, role_choices: Container[UserRoleChoice]) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        return self.has_general_role(role_choices=role_choices)

    # ID helpers

    def unit_ids_where_has_role(self, *, role_choices: Container[UserRoleChoice]) -> list[int]:
        """List unit ids where the user has any of the given roles."""
        if self.is_user_anonymous_or_inactive():
            return []
        return [
            pk
            for pk, roles in self.user.unit_roles_map.items()  #
            if any(role in role_choices for role in roles)
        ]

    def unit_group_ids_where_has_role(self, *, role_choices: Container[UserRoleChoice]) -> list[int]:
        """List unit group ids where the user has any of the given roles."""
        if self.is_user_anonymous_or_inactive():
            return []
        return [
            pk
            for pk, roles in self.user.unit_group_roles_map.items()  #
            if any(role in role_choices for role in roles)
        ]

    # Permission checks

    def can_create_staff_reservation(self, reservation_unit: ReservationUnit) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        role_choices = UserRoleChoice.can_create_staff_reservations()
        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=[reservation_unit.unit],
            role_choices=role_choices,
            require_all=True,
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
        return self.is_superuser_or_has_general_role(role_choices=UserRoleChoice.can_manage_notifications())

    def can_manage_reservation(self, reservation: Reservation, *, reserver_needs_role: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        if not reserver_needs_role and self.user == reservation.user:
            return True

        role_choices = UserRoleChoice.can_manage_reservations()
        if self.has_general_role(role_choices=role_choices):
            return True

        return self.has_role_for_units_or_their_unit_groups(
            units=reservation.units_for_permissions,
            role_choices=role_choices,
        )

    def can_manage_reservation_related_data(self) -> bool:
        return self.is_superuser_or_has_general_role(role_choices=UserRoleChoice.can_manage_reservation_related_data())

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
