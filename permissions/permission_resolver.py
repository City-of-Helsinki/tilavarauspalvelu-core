from __future__ import annotations

from typing import TYPE_CHECKING, Self

from common.date_utils import local_datetime
from permissions.enums import UserRoleChoice

if TYPE_CHECKING:
    from collections.abc import Container, Iterable

    from applications.models import Application, ApplicationRound
    from common.typing import AnyUser
    from reservation_units.models import ReservationUnit
    from reservations.models import RecurringReservation, Reservation
    from spaces.models import Space, Unit
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

    def has_role_for_all_units(
        self,
        *,
        unit_ids: Iterable[int] | None = None,
        role_choices: Container[UserRoleChoice] | None = None,
    ) -> bool:
        """
        Check if the user has at least one of the given roles in all the given units.
        If unit ids are not given, check for all user's units.
        If after that there are no units, then the user has no permission.
        If role choices are not given, check for any role.
        """
        if self.is_user_anonymous_or_inactive():
            return False
        if unit_ids is None:  # For any unit
            unit_ids = self.user.unit_roles_map.keys()
        unit_ids = list(unit_ids)
        if not unit_ids:
            return False
        if role_choices is None:  # Any role
            role_choices = list(UserRoleChoice)
        return all(
            any(role in role_choices for role in self.user.unit_roles_map.get(unit_id, []))  #
            for unit_id in unit_ids
        )

    def has_role_for_any_unit(
        self,
        *,
        unit_ids: Iterable[int] | None = None,
        role_choices: Container[UserRoleChoice] | None = None,
    ) -> bool:
        """
        Check if the user has at least one of the given roles in all the given units.
        If unit ids are not given, check for all user's units.
        If after that there are no units, then the user has no permission.
        If role choices are not given, check for any role.
        """
        if self.is_user_anonymous_or_inactive():
            return False
        if unit_ids is None:  # For any unit
            unit_ids = self.user.unit_roles_map.keys()
        unit_ids = list(unit_ids)
        if not unit_ids:
            return False
        if role_choices is None:  # Any role
            role_choices = list(UserRoleChoice)
        return any(
            any(role in role_choices for role in self.user.unit_roles_map.get(unit_id, []))  #
            for unit_id in unit_ids
        )

    def has_role_for_all_unit_groups(
        self,
        *,
        unit_group_ids: Iterable[int] | None = None,
        role_choices: Container[UserRoleChoice] | None = None,
    ) -> bool:
        """
        Check if the user has at least one of the given roles in all the given unit groups.
        If unit group ids are not given, check for all user's unit groups.
        If after that there are no unit groups, then the user has no permission.
        If role choices are not given, check for any role.
        """
        if self.is_user_anonymous_or_inactive():
            return False
        if unit_group_ids is None:
            unit_group_ids = self.user.unit_group_roles_map.keys()
        unit_group_ids = list(unit_group_ids)
        if not unit_group_ids:
            return False
        if role_choices is None:  # Any role
            role_choices = list(UserRoleChoice)
        return all(
            any(role in role_choices for role in self.user.unit_group_roles_map.get(unit_group_id, []))  #
            for unit_group_id in unit_group_ids
        )

    def has_role_for_any_unit_group(
        self,
        *,
        unit_group_ids: Iterable[int] | None = None,
        role_choices: Container[UserRoleChoice] | None = None,
    ) -> bool:
        """
        Check if the user has at least one of the given roles in all the given unit groups.
        If unit group ids are not given, check for all user's unit groups.
        If after that there are no unit groups, then the user has no permission.
        If role choices are not given, check for any role.
        """
        if self.is_user_anonymous_or_inactive():
            return False
        if unit_group_ids is None:
            unit_group_ids = self.user.unit_group_roles_map.keys()
        unit_group_ids = list(unit_group_ids)
        if not unit_group_ids:
            return False
        if role_choices is None:  # Any role
            role_choices = list(UserRoleChoice)
        return any(
            any(role in role_choices for role in self.user.unit_group_roles_map.get(unit_group_id, []))  #
            for unit_group_id in unit_group_ids
        )

    # Combination checks

    def is_user_anonymous_or_inactive(self) -> bool:
        """Is user anonymous or inactive?"""
        return getattr(self, "user", None) is None or self.user.is_anonymous or not self.user.is_active

    def has_role_generally_or_for_any_unit(
        self,
        *,
        unit_ids: Iterable[int],
        unit_group_ids: Iterable[int],
        role_choices: Container[UserRoleChoice],
    ) -> bool:
        if self.has_general_role(role_choices=role_choices):
            return True
        if self.has_role_for_any_unit(unit_ids=unit_ids, role_choices=role_choices):
            return True
        return self.has_role_for_any_unit_group(unit_group_ids=unit_group_ids, role_choices=role_choices)

    def has_role_generally_or_for_all_units(
        self,
        *,
        unit_ids: Iterable[int],
        unit_group_ids: Iterable[int],
        role_choices: Container[UserRoleChoice],
    ) -> bool:
        if self.has_general_role(role_choices=role_choices):
            return True
        if self.has_role_for_all_units(unit_ids=unit_ids, role_choices=role_choices):
            return True
        return self.has_role_for_all_unit_groups(unit_group_ids=unit_group_ids, role_choices=role_choices)

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

        unit = reservation_unit.unit
        return self.has_role_generally_or_for_all_units(
            unit_ids=[unit.id],
            unit_group_ids=unit.unit_groups.all().values_list("id", flat=True),
            role_choices=UserRoleChoice.can_create_staff_reservations(),
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

        if all_units:
            return self.has_role_generally_or_for_all_units(
                unit_ids=application.unit_ids_for_perms,
                unit_group_ids=application.unit_group_ids_for_perms,
                role_choices=UserRoleChoice.can_manage_applications(),
            )

        return self.has_role_generally_or_for_any_unit(
            unit_ids=application.unit_ids_for_perms,
            unit_group_ids=application.unit_group_ids_for_perms,
            role_choices=UserRoleChoice.can_manage_applications(),
        )

    def can_manage_application_round(self, application_round: ApplicationRound) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        return self.has_role_generally_or_for_all_units(
            unit_ids=application_round.unit_ids_for_perms,
            unit_group_ids=application_round.unit_group_ids_for_perms,
            role_choices=UserRoleChoice.can_manage_applications(),
        )

    def can_manage_applications_for_units(self, units: Iterable[Unit], *, any_unit: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        unit_ids = (unit.id for unit in units)
        unit_group_ids = (unit_group.id for unit in units for unit_group in unit.unit_groups.all())

        if any_unit:
            return self.has_role_generally_or_for_any_unit(
                unit_ids=unit_ids,
                unit_group_ids=unit_group_ids,
                role_choices=UserRoleChoice.can_manage_applications(),
            )

        return self.has_role_generally_or_for_all_units(
            unit_ids=unit_ids,
            unit_group_ids=unit_group_ids,
            role_choices=UserRoleChoice.can_manage_applications(),
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

        return self.has_role_generally_or_for_any_unit(
            unit_ids=reservation.unit_ids_for_perms,
            unit_group_ids=reservation.unit_group_ids_for_perms,
            role_choices=UserRoleChoice.can_manage_reservations(),
        )

    def can_manage_reservation_related_data(self) -> bool:
        return self.is_superuser_or_has_general_role(role_choices=UserRoleChoice.can_manage_reservation_related_data())

    def can_manage_reservations_for_units(self, units: Iterable[Unit], *, any_unit: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        unit_ids = (unit.id for unit in units)
        unit_group_ids = (unit_group.id for unit in units for unit_group in unit.unit_groups.all())

        if any_unit:
            return self.has_role_generally_or_for_any_unit(
                unit_ids=unit_ids,
                unit_group_ids=unit_group_ids,
                role_choices=UserRoleChoice.can_manage_reservations(),
            )

        return self.has_role_generally_or_for_all_units(
            unit_ids=unit_ids,
            unit_group_ids=unit_group_ids,
            role_choices=UserRoleChoice.can_manage_reservations(),
        )

    def can_manage_resources(self, space: Space | None) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        roles = UserRoleChoice.can_manage_reservation_units()
        if self.has_general_role(role_choices=roles):
            return True

        if space is None:
            return False

        return self.has_role_generally_or_for_all_units(
            unit_ids=[space.unit.id],
            unit_group_ids=space.unit.unit_groups.all().values_list("id", flat=True),
            role_choices=roles,
        )

    def can_manage_spaces(self, unit: Unit | None) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        roles = UserRoleChoice.can_manage_reservation_units()
        if self.has_general_role(role_choices=roles):
            return True

        if unit is None:
            return False

        return self.has_role_generally_or_for_all_units(
            unit_ids=[unit.id],
            unit_group_ids=unit.unit_groups.all().values_list("id", flat=True),
            role_choices=roles,
        )

    def can_manage_unit(self, unit: Unit) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True

        return self.has_role_generally_or_for_all_units(
            unit_ids=[unit.id],
            unit_group_ids=unit.unit_groups.all().values_list("id", flat=True),
            role_choices=UserRoleChoice.can_manage_reservation_units(),
        )

    def can_view_application(self, application: Application, *, reserver_needs_role: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        if not reserver_needs_role and self.user == application.user:
            return True

        return self.has_role_generally_or_for_any_unit(
            unit_ids=application.unit_ids_for_perms,
            unit_group_ids=application.unit_group_ids_for_perms,
            role_choices=UserRoleChoice.can_view_applications(),
        )

    def can_view_recurring_reservation(self, recurring_reservation: RecurringReservation) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        if self.user == recurring_reservation.user:
            return True

        return self.has_role_generally_or_for_any_unit(
            unit_ids=[recurring_reservation.reservation_unit.unit.id],
            unit_group_ids=recurring_reservation.reservation_unit.unit.unit_groups.all().values_list("id", flat=True),
            role_choices=UserRoleChoice.can_view_reservations(),
        )

    def can_view_reservation(self, reservation: Reservation, *, reserver_needs_role: bool = False) -> bool:
        if self.is_user_anonymous_or_inactive():
            return False
        if self.user.is_superuser:
            return True
        if self.user == reservation.user and (self.has_any_role() if reserver_needs_role else True):
            return True

        return self.has_role_generally_or_for_any_unit(
            unit_ids=reservation.unit_ids_for_perms,
            unit_group_ids=reservation.unit_group_ids_for_perms,
            role_choices=UserRoleChoice.can_view_reservations(),
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
        if self.has_role_for_any_unit(role_choices=roles):
            return True
        return self.has_role_for_any_unit_group(role_choices=roles)
