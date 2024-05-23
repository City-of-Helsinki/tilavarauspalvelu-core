import pytest
from dateutil.relativedelta import relativedelta

from common.date_utils import local_datetime
from reservations.models import ReservationStatistic
from reservations.pruning import prune_reservation_statistics
from tests.factories import ReservationFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_prune_reservation_statistics__deletes_in_the_given_time():
    five_years_ago = local_datetime() - relativedelta(years=5)
    four_years_ago = local_datetime() - relativedelta(years=4)

    delete = ReservationFactory.create(created_at=five_years_ago, name="DELETE ME")
    keep = ReservationFactory.create(created_at=four_years_ago, name="KEEP ME")

    prune_reservation_statistics()

    assert ReservationStatistic.objects.filter(reservation=delete).exists() is False
    assert ReservationStatistic.objects.filter(reservation=keep).count() == 1
