import datetime
from typing import Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.enums import ReservationKind
from tilavarauspalvelu.models import ApplicationRound

from tests.factories import ApplicationRoundFactory, ReservationUnitFactory, UserFactory
from tests.test_admin.helpers import collect_admin_form_errors, round_form_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Added reservation units ──


def test_application_round_admin__create_with_seasonal_reservation_units(api_client):
    api_client.force_login(UserFactory.create_superuser())
    season_unit = ReservationUnitFactory.create(reservation_kind=ReservationKind.SEASON)
    direct_and_season_unit = ReservationUnitFactory.create(reservation_kind=ReservationKind.DIRECT_AND_SEASON)

    url = reverse("admin:tilavarauspalvelu_applicationround_add")
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=[season_unit.pk, direct_and_season_unit.pk],
    )
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    application_round = ApplicationRound.objects.get(name_fi="Kesä")
    assert set(application_round.reservation_units.all()) == {season_unit, direct_and_season_unit}


def test_application_round_admin__create_with_draft_and_archived_reservation_units_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    draft_unit = ReservationUnitFactory.create(name="Draft hall", is_draft=True)
    archived_unit = ReservationUnitFactory.create(name="Archived hall", is_draft=True, is_archived=True)

    url = reverse("admin:tilavarauspalvelu_applicationround_add")
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=[draft_unit.pk, archived_unit.pk],
    )

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Reservation unit 'Draft hall' is a draft, so it cannot be added to an application round.",
        },
        {
            "code": "",
            "message": "Reservation unit 'Archived hall' is archived, so it cannot be added to an application round.",
        },
    ]
    assert not ApplicationRound.objects.filter(name_fi="Kesä").exists()


def test_application_round_admin__create_with_direct_only_reservation_unit_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    direct_unit = ReservationUnitFactory.create(reservation_kind=ReservationKind.DIRECT)

    url = reverse("admin:tilavarauspalvelu_applicationround_add")
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=[direct_unit.pk],
    )

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": f"Select a valid choice. {direct_unit.pk} is not one of the available choices.",
        },
    ]
    assert not ApplicationRound.objects.filter(name_fi="Kesä").exists()


def test_application_round_admin__change_keeps_saved_archived_reservation_unit(api_client):
    api_client.force_login(UserFactory.create_superuser())
    archived_unit = ReservationUnitFactory.create(is_draft=True, is_archived=True)
    new_unit = ReservationUnitFactory.create()

    application_round = ApplicationRoundFactory.create(
        name="Kesä",
        reservation_units=[archived_unit],
        reservation_period_begin_date=datetime.date(2027, 5, 1),
        reservation_period_end_date=datetime.date(2027, 8, 31),
    )

    url = reverse("admin:tilavarauspalvelu_applicationround_change", args=[application_round.pk])
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=[archived_unit.pk, new_unit.pk],
    )
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    application_round.refresh_from_db()
    assert set(application_round.reservation_units.all()) == {archived_unit, new_unit}


def test_application_round_admin__change_that_adds_draft_reservation_unit_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    saved_unit = ReservationUnitFactory.create()
    draft_unit = ReservationUnitFactory.create(name="Draft hall", is_draft=True)

    application_round = ApplicationRoundFactory.create(
        name="Kesä",
        reservation_units=[saved_unit],
        reservation_period_begin_date=datetime.date(2027, 5, 1),
        reservation_period_end_date=datetime.date(2027, 8, 31),
    )

    url = reverse("admin:tilavarauspalvelu_applicationround_change", args=[application_round.pk])
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=[saved_unit.pk, draft_unit.pk],
    )

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Reservation unit 'Draft hall' is a draft, so it cannot be added to an application round.",
        },
    ]
    application_round.refresh_from_db()
    assert list(application_round.reservation_units.all()) == [saved_unit]
