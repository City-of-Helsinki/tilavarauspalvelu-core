from __future__ import annotations

import datetime
from typing import Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.enums import TermsOfUseTypeChoices
from tilavarauspalvelu.models import ApplicationRound

from tests.factories import (
    ApplicationRoundFactory,
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    TermsOfUseFactory,
    UnitGroupFactory,
    UserFactory,
)
from tests.test_admin.helpers import collect_admin_form_errors

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


JAN_1 = datetime.date(2027, 1, 1)


# ── Helpers ──


def round_form_data(*, name: str, reservation_unit_pks: list[int]) -> dict[str, Any]:
    terms_of_use = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.RECURRING)
    purpose = ReservationPurposeFactory.create()
    return {
        "name_fi": name,
        "name_en": "",
        "name_sv": "",
        "terms_of_use": terms_of_use.pk,
        "purposes": [purpose.pk],
        "reservation_units": reservation_unit_pks,
        "application_period_begins_at_0": "2027-01-01",
        "application_period_begins_at_1": "00:00:00",
        "application_period_ends_at_0": "2027-02-01",
        "application_period_ends_at_1": "00:00:00",
        "reservation_period_begin_date": "2027-05-01",
        "reservation_period_end_date": "2027-08-31",
        "public_display_begins_at_0": "2027-01-01",
        "public_display_begins_at_1": "00:00:00",
        "public_display_ends_at_0": "2027-09-01",
        "public_display_ends_at_1": "00:00:00",
        "criteria_fi": "",
        "criteria_en": "",
        "criteria_sv": "",
        "notes_when_applying_fi": "",
        "notes_when_applying_en": "",
        "notes_when_applying_sv": "",
    }


def create_unit_with_options(*options):
    pricing_group = PricingGroupFactory.create(unit_group=options[0].unit_group)
    for option in options:
        PriceComponentFactory.create(pricing_group=pricing_group, price_option=option, valid_from=JAN_1)

    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    return reservation_unit


# ── Price options ──


def test_application_round_admin__create_with_same_price_options(api_client):
    api_client.force_login(UserFactory.create_superuser())
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group)
    first_unit = create_unit_with_options(adults)
    second_unit = create_unit_with_options(adults)

    url = reverse("admin:tilavarauspalvelu_applicationround_add")
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=[first_unit.pk, second_unit.pk],
    )
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    application_round = ApplicationRound.objects.get(name_fi="Kesä")
    assert set(application_round.reservation_units.all()) == {first_unit, second_unit}


def test_application_round_admin__create_with_different_price_options_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    juniors = PriceOptionFactory.create(unit_group=unit_group, name="Juniors")
    first_unit = create_unit_with_options(adults, juniors)
    second_unit = create_unit_with_options(adults)

    url = reverse("admin:tilavarauspalvelu_applicationround_add")
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=[first_unit.pk, second_unit.pk],
    )

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": (
                f"Reservation unit {second_unit.pk} has price options 'Adults' on 2027-05-01, "
                f"but reservation unit {first_unit.pk} has 'Adults', 'Juniors' on 2027-05-01. "
                f"All reservation units must have the same price options for the whole reservation period."
            ),
        },
    ]
    assert not ApplicationRound.objects.filter(name_fi="Kesä").exists()


def test_application_round_admin__change_that_removes_price_option_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    juniors = PriceOptionFactory.create(unit_group=unit_group, name="Juniors")
    first_unit = create_unit_with_options(adults, juniors)
    second_unit = create_unit_with_options(adults)

    application_round = ApplicationRoundFactory.create(
        name="Kesä",
        reservation_units=[first_unit],
        application_period_begins_at=datetime.datetime(2027, 1, 1, tzinfo=datetime.UTC),
        application_period_ends_at=datetime.datetime(2027, 2, 1, tzinfo=datetime.UTC),
        reservation_period_begin_date=datetime.date(2027, 5, 1),
        reservation_period_end_date=datetime.date(2027, 8, 31),
    )

    url = reverse("admin:tilavarauspalvelu_applicationround_change", args=[application_round.pk])
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=[second_unit.pk],
    )

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": (
                "The change removes price options 'Juniors' from the application round. "
                "Applicants can select them until the reservations of the round are made."
            ),
        },
    ]
    application_round.refresh_from_db()
    assert list(application_round.reservation_units.all()) == [first_unit]
