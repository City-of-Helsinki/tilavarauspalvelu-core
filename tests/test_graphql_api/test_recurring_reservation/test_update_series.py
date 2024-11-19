import pytest

from tests.factories import (
    AgeGroupFactory,
    CityFactory,
    RecurringReservationFactory,
    ReservationFactory,
    ReservationPurposeFactory,
)
from tilavarauspalvelu.enums import CustomerTypeChoice
from tilavarauspalvelu.models import Reservation, ReservationStatistic

from .helpers import UPDATE_SERIES_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__update_series(graphql):
    age_group_1 = AgeGroupFactory.create(minimum=18, maximum=100)
    age_group_2 = AgeGroupFactory.create(minimum=0, maximum=17)
    purpose_1 = ReservationPurposeFactory.create()
    purpose_2 = ReservationPurposeFactory.create()
    city_1 = CityFactory.create()
    city_2 = CityFactory.create()

    recurring_reservation = RecurringReservationFactory.create(
        name="Recurring reservation",
        description="Recurring reservation description",
        age_group=age_group_1,
        reservations__name="Hello",
        reservations__purpose=purpose_1,
        reservations__home_city=city_1,
        reservations__age_group=age_group_1,
    )

    data = {
        "pk": recurring_reservation.id,
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
            "reserveeId": "id",
            "reserveeFirstName": "User",
            "reserveeLastName": "Admin",
            "reserveeEmail": "user@admin.com",
            "reserveePhone": "0123456789",
            "reserveeOrganisationName": "org",
            "reserveeAddressStreet": "street",
            "reserveeAddressCity": "city",
            "reserveeAddressZip": "cip",
            "reserveeIsUnregisteredAssociation": False,
            "reserveeLanguage": "FI",
            "reserveeType": CustomerTypeChoice.BUSINESS.upper(),
            "billingFirstName": "Bill",
            "billingLastName": "Admin",
            "billingEmail": "bill@admin.com",
            "billingPhone": "9876543210",
            "billingAddressStreet": "lane",
            "billingAddressCity": "town",
            "billingAddressZip": "postal",
            "purpose": purpose_2.pk,
            "homeCity": city_2.pk,
            "ageGroup": age_group_2.pk,
        },
    }

    graphql.login_with_superuser()
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.name == "New name"
    assert recurring_reservation.description == "New description"
    assert recurring_reservation.age_group == age_group_2

    reservation: Reservation = recurring_reservation.reservations.first()
    assert reservation.name == "foo"
    assert reservation.description == "bar"
    assert reservation.num_persons == 12
    assert reservation.working_memo == "memo"
    assert reservation.applying_for_free_of_charge is True
    assert reservation.free_of_charge_reason == "reason"
    assert reservation.reservee_id == "id"
    assert reservation.reservee_first_name == "User"
    assert reservation.reservee_last_name == "Admin"
    assert reservation.reservee_email == "user@admin.com"
    assert reservation.reservee_phone == "0123456789"
    assert reservation.reservee_organisation_name == "org"
    assert reservation.reservee_address_street == "street"
    assert reservation.reservee_address_city == "city"
    assert reservation.reservee_address_zip == "cip"
    assert reservation.reservee_is_unregistered_association is False
    assert reservation.reservee_language == "fi"
    assert reservation.reservee_type == CustomerTypeChoice.BUSINESS
    assert reservation.billing_first_name == "Bill"
    assert reservation.billing_last_name == "Admin"
    assert reservation.age_group == age_group_2
    assert reservation.purpose == purpose_2
    assert reservation.home_city == city_2


def test_recurring_reservations__update_series__skip_reservations(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    reservation_1 = ReservationFactory.create(name="foo", recurring_reservation=recurring_reservation)
    reservation_2 = ReservationFactory.create(name="foo", recurring_reservation=recurring_reservation)

    data = {
        "pk": recurring_reservation.id,
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


def test_recurring_reservations__update_series__update_statistics(graphql, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    recurring_reservation = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(num_persons=1, recurring_reservation=recurring_reservation)

    stat: ReservationStatistic | None = ReservationStatistic.objects.filter(reservation=reservation).first()
    assert stat is not None
    assert stat.num_persons == 1

    data = {
        "pk": recurring_reservation.id,
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
