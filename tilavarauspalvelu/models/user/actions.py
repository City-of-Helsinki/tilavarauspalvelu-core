from __future__ import annotations

import operator
import uuid
from functools import reduce
from typing import TYPE_CHECKING

from auditlog.models import LogEntry
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.db import models
from django.db.models.functions import Upper
from social_django.models import UserSocialAuth

from tilavarauspalvelu.enums import (
    ApplicationStatusChoice,
    OrderStatus,
    ReservationNotification,
    ReservationStateChoice,
    ReservationTypeChoice,
    UserRoleChoice,
)
from tilavarauspalvelu.models import (
    Address,
    Application,
    ApplicationSection,
    GeneralRole,
    Person,
    RecurringReservation,
    Reservation,
    Unit,
    UnitRole,
)
from tilavarauspalvelu.typing import UserAnonymizationInfo
from utils.date_utils import local_date, local_datetime

if TYPE_CHECKING:
    from collections.abc import Iterable

    from .model import User


ANONYMIZED_FIRST_NAME = "ANON"
ANONYMIZED_LAST_NAME = "ANONYMIZED"
ANONYMIZED = "Anonymized"
SENSITIVE_RESERVATION = "Sensitive data of this reservation has been anonymized by a script"
SENSITIVE_APPLICATION = "Sensitive data of this application has been anonymized by a script"


class UserActions:
    def __init__(self, user: User) -> None:
        self.user = user

    def anonymize(self) -> None:
        self.anonymize_user()
        self.anonymize_user_applications()
        self.anonymize_user_reservations()

    def anonymize_user(self) -> None:
        self.user.first_name = ANONYMIZED_FIRST_NAME
        self.user.last_name = ANONYMIZED_LAST_NAME
        self.user.email = f"{self.user.first_name}.{self.user.last_name}@anonymized.net"
        self.user.uuid = uuid.uuid4()
        self.user.username = f"anonymized-{self.user.uuid}"
        self.user.date_of_birth = None
        self.user.reservation_notification = ReservationNotification.NONE
        self.user.is_active = False
        self.user.is_superuser = False
        self.user.is_staff = False
        self.user.profile_id = ""
        self.user.save()

        self.user.ad_groups.clear()

        GeneralRole.objects.filter(user=self.user).delete()
        UnitRole.objects.filter(user=self.user).delete()
        UserSocialAuth.objects.filter(user=self.user).delete()

    def anonymize_user_reservations(self) -> None:
        reservations: Iterable[Reservation] = Reservation.objects.filter(user=self.user).exclude(
            type__in=ReservationTypeChoice.should_not_anonymize,
        )
        recurring_reservations = RecurringReservation.objects.filter(reservations__in=reservations)

        for reservation in reservations:
            reservation.name = ANONYMIZED
            reservation.description = ANONYMIZED
            reservation.reservee_first_name = self.user.first_name
            reservation.reservee_last_name = self.user.last_name
            reservation.reservee_email = self.user.email
            reservation.reservee_phone = ""
            reservation.reservee_address_zip = "99999"
            reservation.reservee_address_city = ANONYMIZED
            reservation.reservee_address_street = ANONYMIZED
            reservation.billing_first_name = self.user.first_name
            reservation.billing_last_name = self.user.last_name
            reservation.billing_email = self.user.email
            reservation.billing_phone = ""
            reservation.billing_address_zip = "99999"
            reservation.billing_address_city = ANONYMIZED
            reservation.billing_address_street = ANONYMIZED
            reservation.working_memo = ""
            reservation.free_of_charge_reason = SENSITIVE_RESERVATION
            reservation.cancel_details = SENSITIVE_RESERVATION
            reservation.handling_details = SENSITIVE_RESERVATION

        for recurring_reservation in recurring_reservations:
            recurring_reservation.name = ANONYMIZED
            recurring_reservation.description = ANONYMIZED

        Reservation.objects.bulk_update(
            reservations,
            [
                "name",
                "description",
                "reservee_first_name",
                "reservee_last_name",
                "reservee_email",
                "reservee_phone",
                "reservee_address_zip",
                "reservee_address_city",
                "reservee_address_street",
                "billing_first_name",
                "billing_last_name",
                "billing_email",
                "billing_phone",
                "billing_address_zip",
                "billing_address_city",
                "billing_address_street",
                "working_memo",
                "free_of_charge_reason",
                "cancel_details",
                "handling_details",
            ],
        )

        RecurringReservation.objects.bulk_update(
            recurring_reservations,
            [
                "name",
                "description",
            ],
        )

        LogEntry.objects.get_for_objects(reservations).delete()

    def anonymize_user_applications(self) -> None:
        ApplicationSection.objects.filter(application__user=self.user).update(
            name=SENSITIVE_APPLICATION,
        )
        Person.objects.filter(applications__user=self.user).update(
            first_name=self.user.first_name,
            last_name=self.user.last_name,
            email=self.user.email,
            phone_number="",
        )
        Address.objects.filter(applications__user=self.user).update(
            post_code="99999",
            city=ANONYMIZED,
            city_fi=ANONYMIZED,
            city_en=ANONYMIZED,
            city_sv=ANONYMIZED,
            street_address=ANONYMIZED,
            street_address_fi=ANONYMIZED,
            street_address_en=ANONYMIZED,
            street_address_sv=ANONYMIZED,
        )
        Application.objects.filter(user=self.user).update(
            additional_information=SENSITIVE_APPLICATION,
            working_memo=SENSITIVE_APPLICATION,
        )

    def can_anonymize(self) -> UserAnonymizationInfo:
        month_ago = local_datetime() - relativedelta(months=1)

        has_open_reservations = (
            self.user.reservations.filter(end__gte=month_ago)
            .exclude(state__in=ReservationStateChoice.doesnt_block_anonymization)
            .exists()
        )

        has_open_applications = (  #
            self.user.applications.has_status_in(statuses=ApplicationStatusChoice.blocks_anonymization).exists()
        )

        has_open_payments = self.user.reservations.filter(
            payment_order__isnull=False,
            payment_order__remote_id__isnull=False,
            payment_order__status=OrderStatus.DRAFT,
        ).exists()

        return UserAnonymizationInfo(
            has_open_reservations=has_open_reservations,
            has_open_applications=has_open_applications,
            has_open_payments=has_open_payments,
        )

    @property
    def is_ad_user(self) -> bool:
        id_token = self.user.id_token
        return id_token is not None and id_token.is_ad_login

    @property
    def is_profile_user(self) -> bool:
        id_token = self.user.id_token
        return id_token is not None and id_token.is_profile_login

    @property
    def user_age(self) -> int | None:
        birthday = self.user.date_of_birth
        if birthday is None:
            return None
        return relativedelta(local_date(), birthday).years

    @property
    def is_of_age(self) -> bool:
        user_age = self.user_age
        if user_age is None:
            return False
        return user_age >= settings.USER_IS_ADULT_AT_AGE

    def get_ad_group_roles(self) -> dict[UserRoleChoice, set[int]]:
        """
        Parse information from user's AD groups for creating unit roles.

        AD groups that give role should be of format `<prefix>__varaamo__<roles>__<tprek_id>` where:
         - '<prefix>': can be anything (usually identifies the unit)
         - '<roles>': roles matching `UserRoleChoice` the user should have (separated by "__")
         - '<tprek_id>': `Unit.tprek_id` for the unit the role is for.
        """
        identifier = "__VARAAMO__"
        ad_group_names: set[str] = set(
            self.user.ad_groups.filter(name__icontains=identifier)
            .annotate(upper_name=Upper("name"))
            .values_list("upper_name", flat=True)
        )

        if self.user.is_superuser and settings.FAKE_SUPERUSER_AD_GROUPS:
            ad_group_names.update(name.upper() for name in settings.FAKE_SUPERUSER_AD_GROUPS)

        units_by_role: dict[UserRoleChoice, set[int]] = {}

        for ad_group_name in ad_group_names:
            parts = ad_group_name.split(identifier, maxsplit=1)
            if len(parts) != 2:  # noqa: PLR2004
                continue

            info_parts = parts[1].split("__")
            if len(info_parts) < 2:  # noqa: PLR2004
                continue

            tprek_id = info_parts[-1]
            unit = Unit.objects.filter(tprek_id=tprek_id).first()
            if unit is None:
                continue

            if not unit.allow_permissions_from_ad_groups:
                continue

            for role in info_parts[:-1]:
                if role not in UserRoleChoice.allowed_roles_for_ad_permissions():
                    continue

                user_role = UserRoleChoice(role)
                units_by_role.setdefault(user_role, set()).add(unit.id)

        return units_by_role

    def update_unit_roles_from_ad_groups(self) -> None:
        current_ad_roles = self.get_ad_group_roles()
        existing_ad_roles = {
            UserRoleChoice(role.role): role  #
            for role in self.user.unit_roles.filter(is_from_ad_group=True).prefetch_related("units")
        }

        UnitRoleUnit: type[models.Model] = UnitRole.units.through  # noqa: N806

        roles_to_add: list[UnitRole] = []
        role_units_to_add: list[UnitRoleUnit] = []
        role_unit_remove_conditions: list[models.Q] = []

        for user_role, current_unit_ids in current_ad_roles.items():
            # Pop role from existing roles to indicate that it shouldn't be removed.
            role = existing_ad_roles.pop(user_role, None)

            # If current role is not defined in existing roles, add a new role.
            if role is None:
                new_role = UnitRole(user=self.user, role=user_role, is_from_ad_group=True)
                roles_to_add.append(new_role)
                role_units_to_add.extend(  #
                    UnitRoleUnit(unitrole=new_role, unit_id=unit_id) for unit_id in current_unit_ids
                )
                continue

            exiting_unit_ids: set[int] = {unit.id for unit in role.units.all()}

            # If current role has been added to new units, add them to the role.
            new_unit_ids = current_unit_ids - exiting_unit_ids
            if new_unit_ids:
                role_units_to_add.extend(  #
                    UnitRoleUnit(unitrole=role, unit_id=unit_id) for unit_id in new_unit_ids
                )

            # If current role no longer includes some units, remove those units from the role.
            old_unit_ids = exiting_unit_ids - current_unit_ids
            if old_unit_ids:
                condition = models.Q(unit_id__in=list(old_unit_ids), unitrole_id=role.id)
                role_unit_remove_conditions.append(condition)

        if role_unit_remove_conditions:
            remove_condition = reduce(operator.or_, role_unit_remove_conditions, models.Q())
            UnitRoleUnit.objects.filter(remove_condition).delete()

        if existing_ad_roles:
            remove_ids = [role.id for role in existing_ad_roles.values()]
            UnitRole.objects.filter(id__in=remove_ids).delete()

        if roles_to_add:
            UnitRole.objects.bulk_create(roles_to_add)

        if role_units_to_add:
            UnitRoleUnit.objects.bulk_create(role_units_to_add)
