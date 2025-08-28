from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice, UserRoleChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, ReservationUnitFactory, UserFactory
from tests.helpers import patch_method
from tests.test_graphql_api.test_reservation.helpers import REPAIR_ACCESS_CODE_STAFF_MUTATION

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraService.sync_access_code)
def test_staff_repair_access_code__regular_user(graphql):
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=now,
        access_code_is_active=True,
        begins_at=now + datetime.timedelta(hours=1),
        ends_at=now + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_regular_user()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.error_message(0) == "No permission to update this reservation."

    assert PindoraService.sync_access_code.call_count == 0


@patch_method(PindoraService.sync_access_code)
@patch_method(EmailService.send_reservation_access_type_changed_email)
def test_staff_repair_access_code__unit_handler(graphql):
    now = local_datetime()

    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=now,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(hours=1),
        ends_at=now + datetime.timedelta(hours=2),
        reservation_unit=reservation_unit,
    )

    def hook(obj: Reservation) -> None:
        obj.access_code_is_active = True
        obj.save(update_fields=["access_code_is_active"])

    PindoraService.sync_access_code.side_effect = hook

    data = {
        "pk": reservation.pk,
    }

    user = UserFactory.create_with_unit_role(role=UserRoleChoice.HANDLER, units=[reservation_unit.unit])

    graphql.force_login(user)
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.call_count == 1
    assert EmailService.send_reservation_access_type_changed_email.call_count == 1


@patch_method(PindoraService.sync_access_code)
@patch_method(EmailService.send_reservation_access_type_changed_email)
def test_staff_repair_access_code__general_handler(graphql):
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=now,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(hours=1),
        ends_at=now + datetime.timedelta(hours=2),
    )

    def hook(obj: Reservation) -> None:
        obj.access_code_is_active = True
        obj.save(update_fields=["access_code_is_active"])

    PindoraService.sync_access_code.side_effect = hook

    data = {
        "pk": reservation.pk,
    }

    user = UserFactory.create_with_general_role(role=UserRoleChoice.HANDLER)

    graphql.force_login(user)
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.call_count == 1
    assert EmailService.send_reservation_access_type_changed_email.call_count == 1
