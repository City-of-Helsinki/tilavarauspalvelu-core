from __future__ import annotations

import freezegun
import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, ReservationSeriesFactory, UserFactory
from tests.helpers import patch_method

from .helpers import REPAIR_ACCESS_CODE_SERIES_MUTATION

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraService.sync_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_repair_reservation_series_access_code__regular_user(graphql):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    graphql.login_with_regular_user()

    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, input_data={"pk": series.pk})

    assert response.error_message() == "No permission to update."


@patch_method(PindoraService.sync_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_repair_reservation_series_access_code__general_admin(graphql):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, input_data={"pk": series.pk})

    assert response.has_errors is False, response.errors
