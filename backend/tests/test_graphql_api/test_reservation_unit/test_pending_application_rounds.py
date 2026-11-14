import datetime

import pytest

from tilavarauspalvelu.enums import ReservationKind
from utils.date_utils import local_date, local_datetime

from tests.factories import ApplicationRoundFactory, ReservationUnitFactory, SpaceFactory

from .helpers import ARCHIVE_MUTATION, UPDATE_MUTATION, get_draft_update_input_data, get_non_draft_update_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


PENDING_ROUND_MESSAGE = (
    "Reservation unit is in application rounds whose reservations are not made yet: Kesä. "
    "It cannot be a draft, be archived, or allow only direct reservations until it is removed from these rounds."
)


# ── Helpers ──


def create_pending_round(*reservation_units):
    today = local_date()
    return ApplicationRoundFactory.create(
        name="Kesä",
        reservation_units=list(reservation_units),
        reservation_period_begin_date=today + datetime.timedelta(days=30),
        reservation_period_end_date=today + datetime.timedelta(days=120),
    )


def create_ended_round(*reservation_units):
    today = local_date()
    return ApplicationRoundFactory.create(
        name="Kevät",
        reservation_units=list(reservation_units),
        application_period_begins_at=local_datetime() - datetime.timedelta(days=200),
        application_period_ends_at=local_datetime() - datetime.timedelta(days=150),
        reservation_period_begin_date=today - datetime.timedelta(days=120),
        reservation_period_end_date=today - datetime.timedelta(days=1),
    )


# ── Update ──


def test_reservation_unit__update__to_draft_in_pending_application_round_is_rejected(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    create_pending_round(reservation_unit)

    data = get_draft_update_input_data(reservation_unit, isDraft=True)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [PENDING_ROUND_MESSAGE]

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_draft is False


def test_reservation_unit__update__to_direct_only_in_pending_application_round_is_rejected(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False, reservation_kind=ReservationKind.SEASON)
    create_pending_round(reservation_unit)

    data = get_non_draft_update_input_data(reservation_unit, reservationKind=ReservationKind.DIRECT.value)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [PENDING_ROUND_MESSAGE]

    reservation_unit.refresh_from_db()
    assert reservation_unit.reservation_kind == ReservationKind.SEASON


def test_reservation_unit__update__to_draft_in_ended_application_round(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    create_ended_round(reservation_unit)

    data = get_draft_update_input_data(reservation_unit, isDraft=True)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_draft is True


def test_reservation_unit__update__draft_that_is_already_in_pending_application_round(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    create_pending_round(reservation_unit)

    data = get_draft_update_input_data(reservation_unit, isDraft=True, nameFi="foo")
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.name_fi == "foo"


# ── Archive ──


def test_reservation_unit__archive__in_pending_application_round_is_rejected(graphql):
    graphql.login_with_superuser()

    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])
    create_pending_round(reservation_unit)

    response = graphql(ARCHIVE_MUTATION, variables={"input": {"pk": reservation_unit.pk}})

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [PENDING_ROUND_MESSAGE]

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_archived is False
    assert reservation_unit.is_draft is False


def test_reservation_unit__archive__in_ended_application_round(graphql):
    graphql.login_with_superuser()

    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])
    create_ended_round(reservation_unit)

    response = graphql(ARCHIVE_MUTATION, variables={"input": {"pk": reservation_unit.pk}})

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_archived is True
