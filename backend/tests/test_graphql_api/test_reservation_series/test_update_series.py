from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.enums import MunicipalityChoice, ReserveeType
from tilavarauspalvelu.models import ReservationStatistic

from tests.factories import AgeGroupFactory, ReservationFactory, ReservationPurposeFactory, ReservationSeriesFactory

from .helpers import UPDATE_SERIES_MUTATION

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_series__update_series(graphql):
    age_group_1 = AgeGroupFactory.create(minimum=18, maximum=100)
    age_group_2 = AgeGroupFactory.create(minimum=0, maximum=17)
    purpose_1 = ReservationPurposeFactory.create()
    purpose_2 = ReservationPurposeFactory.create()

    reservation_series = ReservationSeriesFactory.create(
        name="Recurring reservation",
        description="Recurring reservation description",
        age_group=age_group_1,
        reservations__name="Hello",
        reservations__purpose=purpose_1,
        reservations__municipality=MunicipalityChoice.HELSINKI.value,
        reservations__age_group=age_group_1,
    )

    data = {
        "pk": reservation_series.id,
        "name": "New name",
        "description": "New description",
        "ageGroup": age_group_2.pk,
        "reservationDetails": {
            "name": "foo",
            "description": "bar",
            "numPersons": 12,
            "workingMemo": "memo",
            "applyingForFreeOfCharge": True,
            "freeOfChargeReason": "reason",
            "reserveeIdentifier": "id",
            "reserveeFirstName": "User",
            "reserveeLastName": "Admin",
            "reserveeEmail": "user@admin.com",
            "reserveePhone": "0123456789",
            "reserveeOrganisationName": "org",
            "reserveeAddressStreet": "street",
            "reserveeAddressCity": "city",
            "reserveeAddressZip": "cip",
            "reserveeType": ReserveeType.COMPANY.value,
            "billingFirstName": "Bill",
            "billingLastName": "Admin",
            "billingEmail": "bill@admin.com",
            "billingPhone": "9876543210",
            "billingAddressStreet": "lane",
            "billingAddressCity": "town",
            "billingAddressZip": "postal",
            "purpose": purpose_2.pk,
            "municipality": MunicipalityChoice.HELSINKI.value,
            "ageGroup": age_group_2.pk,
        },
    }

    graphql.login_with_superuser()
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    reservation_series.refresh_from_db()
    assert reservation_series.name == "New name"
    assert reservation_series.description == "New description"
    assert reservation_series.age_group == age_group_2

    reservation: Reservation = reservation_series.reservations.first()
    assert reservation.name == "foo"
    assert reservation.description == "bar"
    assert reservation.num_persons == 12
    assert reservation.working_memo == "memo"
    assert reservation.applying_for_free_of_charge is True
    assert reservation.free_of_charge_reason == "reason"
    assert reservation.reservee_identifier == "id"
    assert reservation.reservee_first_name == "User"
    assert reservation.reservee_last_name == "Admin"
    assert reservation.reservee_email == "user@admin.com"
    assert reservation.reservee_phone == "0123456789"
    assert reservation.reservee_organisation_name == "org"
    assert reservation.reservee_address_street == "street"
    assert reservation.reservee_address_city == "city"
    assert reservation.reservee_address_zip == "cip"
    assert reservation.reservee_type == ReserveeType.COMPANY.value
    assert reservation.billing_first_name == "Bill"
    assert reservation.billing_last_name == "Admin"
    assert reservation.age_group == age_group_2
    assert reservation.purpose == purpose_2
    assert reservation.municipality == MunicipalityChoice.HELSINKI


def test_reservation_series__update_series__skip_reservations(graphql):
    reservation_series = ReservationSeriesFactory.create()
    reservation_1 = ReservationFactory.create(name="foo", reservation_series=reservation_series)
    reservation_2 = ReservationFactory.create(name="foo", reservation_series=reservation_series)

    data = {
        "pk": reservation_series.id,
        "reservationDetails": {
            "name": "bar",
        },
        "skipReservations": [reservation_1.pk],
    }

    graphql.login_with_superuser()
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    reservation_1.refresh_from_db()
    reservation_2.refresh_from_db()
    assert reservation_1.name == "foo"
    assert reservation_2.name == "bar"


def test_reservation_series__update_series__update_statistics(graphql, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation_series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(num_persons=1, reservation_series=reservation_series)

    stat: ReservationStatistic | None = ReservationStatistic.objects.filter(reservation=reservation).first()
    assert stat is not None
    assert stat.num_persons == 1

    data = {
        "pk": reservation_series.id,
        "reservationDetails": {
            "numPersons": 2,
        },
    }

    graphql.login_with_superuser()
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    reservation.refresh_from_db()
    assert reservation.num_persons == 2

    stat.refresh_from_db()
    assert stat.num_persons == 2
