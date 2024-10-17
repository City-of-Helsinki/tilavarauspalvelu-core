import datetime

import pytest
from freezegun import freeze_time

from tests.factories import GeneralRoleFactory, UnitRoleFactory, UserFactory
from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.services.permission_service import deactivate_old_permissions
from utils.date_utils import local_start_of_day

pytestmark = [
    pytest.mark.django_db,
]


@freeze_time("2024-01-01 00:00:00")
def test_deactivate_old_permissions__deactivates(settings):
    delta = 1
    settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS = delta
    last_login = local_start_of_day() - datetime.timedelta(days=delta, seconds=1)

    user = UserFactory.create(is_superuser=True, is_staff=True, last_login=last_login)

    general_role_1 = GeneralRoleFactory.create(user=user, role=UserRoleChoice.ADMIN)
    general_role_2 = GeneralRoleFactory.create(user=user, role=UserRoleChoice.HANDLER)

    unit_role_1 = UnitRoleFactory.create(user=user, role=UserRoleChoice.ADMIN)
    unit_role_2 = UnitRoleFactory.create(user=user, role=UserRoleChoice.HANDLER)

    assert general_role_1.role_active is True
    assert general_role_2.role_active is True
    assert unit_role_1.role_active is True
    assert unit_role_2.role_active is True
    assert user.is_staff is True
    assert user.is_superuser is True

    deactivate_old_permissions()

    general_role_1.refresh_from_db()
    general_role_2.refresh_from_db()
    unit_role_1.refresh_from_db()
    unit_role_2.refresh_from_db()
    user.refresh_from_db()

    assert general_role_1.role_active is False
    assert general_role_2.role_active is False
    assert unit_role_1.role_active is False
    assert unit_role_2.role_active is False
    assert user.is_staff is False
    assert user.is_superuser is False


@freeze_time("2024-01-01 00:00:00")
def test_deactivate_old_permissions__doesnt_deactivate(settings):
    delta = 1
    settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS = delta
    last_login = local_start_of_day() - datetime.timedelta(days=delta)

    user = UserFactory.create(is_superuser=True, is_staff=True, last_login=last_login)

    general_role_1 = GeneralRoleFactory.create(user=user, role=UserRoleChoice.ADMIN)
    general_role_2 = GeneralRoleFactory.create(user=user, role=UserRoleChoice.HANDLER)

    unit_role_1 = UnitRoleFactory.create(user=user, role=UserRoleChoice.ADMIN)
    unit_role_2 = UnitRoleFactory.create(user=user, role=UserRoleChoice.HANDLER)

    assert general_role_1.role_active is True
    assert general_role_2.role_active is True
    assert unit_role_1.role_active is True
    assert unit_role_2.role_active is True
    assert user.is_staff is True
    assert user.is_superuser is True

    deactivate_old_permissions()

    general_role_1.refresh_from_db()
    general_role_2.refresh_from_db()
    unit_role_1.refresh_from_db()
    unit_role_2.refresh_from_db()
    user.refresh_from_db()

    assert general_role_1.role_active is True
    assert general_role_2.role_active is True
    assert unit_role_1.role_active is True
    assert unit_role_2.role_active is True
    assert user.is_staff is True
    assert user.is_superuser is True
