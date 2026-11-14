import datetime

import freezegun
import pytest
from celery.exceptions import SoftTimeLimitExceeded

from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.tasks import generate_reservation_series_from_allocations_task
from tilavarauspalvelu.typing import Allocation
from utils.date_utils import local_date, local_datetime, local_time, next_date_matching_weekday

from tests.factories import UserFactory
from tests.factories.application_round import ApplicationRoundFactory
from tests.factories.reservation_unit import ReservationUnitBuilder
from tests.factories.unit import UnitBuilder
from tests.helpers import patch_method


@pytest.mark.django_db
@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
@patch_method(HaukiAPIClient.get_date_periods, side_effect=SoftTimeLimitExceeded())
def test_generate_reservation_series_from_allocations__soft_time_limit_fails_the_task(settings):
    settings.SENTRY_LOGGER_ALWAYS_RE_RAISE = False

    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=14),
        user=user,
    )

    with pytest.raises(SoftTimeLimitExceeded):
        generate_reservation_series_from_allocations_task(application_round.pk)
