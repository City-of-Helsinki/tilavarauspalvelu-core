from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

import pytest
from django.urls import reverse
from freezegun import freeze_time

from tilavarauspalvelu.enums import ApplicationFormType
from tilavarauspalvelu.models import ApplicationRound
from utils.date_utils import local_datetime

from tests.factories import ApplicationFactory, ApplicationRoundFactory, ReservationUnitFactory, UserFactory
from tests.test_admin.helpers import collect_admin_form_errors, round_form_data

if TYPE_CHECKING:
    from rest_framework.test import APIClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

NOW = local_datetime(2026, 11, 1)


# ── Helpers ──


def create_round(**kwargs: Any) -> ApplicationRound:
    return ApplicationRoundFactory.create(
        reservation_units=[ReservationUnitFactory.create()],
        reservation_period_begin_date=datetime.date(2027, 5, 1),
        reservation_period_end_date=datetime.date(2027, 8, 31),
        **kwargs,
    )


# ── Changing the application form ──


@freeze_time(NOW)
def test_application_round_admin__create_with_sports_form(api_client: APIClient) -> None:
    api_client.force_login(UserFactory.create_superuser())
    reservation_unit = ReservationUnitFactory.create()

    url = reverse("admin:tilavarauspalvelu_applicationround_add")
    data = round_form_data(
        name="Liikunta",
        reservation_unit_pks=[reservation_unit.pk],
        application_form=ApplicationFormType.SPORTS_FORM,
    )
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    application_round = ApplicationRound.objects.get(name="Liikunta")
    assert application_round.application_form == ApplicationFormType.SPORTS_FORM


@freeze_time(NOW)
def test_application_round_admin__change_application_form_before_application_period(api_client: APIClient) -> None:
    api_client.force_login(UserFactory.create_superuser())
    application_round = create_round(
        application_period_begins_at=NOW + datetime.timedelta(days=1),
        application_period_ends_at=datetime.datetime(2027, 2, 1, tzinfo=datetime.UTC),
    )

    url = reverse("admin:tilavarauspalvelu_applicationround_change", args=[application_round.pk])
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=list(application_round.reservation_units.values_list("pk", flat=True)),
        application_form=ApplicationFormType.SPORTS_FORM,
    )
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    application_round.refresh_from_db()
    assert application_round.application_form == ApplicationFormType.SPORTS_FORM


@freeze_time(NOW)
def test_application_round_admin__change_application_form_after_application_period_began_is_rejected(
    api_client: APIClient,
) -> None:
    api_client.force_login(UserFactory.create_superuser())
    application_round = create_round(
        application_period_begins_at=NOW - datetime.timedelta(days=1),
        application_period_ends_at=datetime.datetime(2027, 2, 1, tzinfo=datetime.UTC),
    )

    url = reverse("admin:tilavarauspalvelu_applicationround_change", args=[application_round.pk])
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=list(application_round.reservation_units.values_list("pk", flat=True)),
        application_form=ApplicationFormType.SPORTS_FORM,
    )

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Application form cannot be changed after the application period has begun.",
        },
    ]
    application_round.refresh_from_db()
    assert application_round.application_form == ApplicationFormType.DEFAULT_FORM


@freeze_time(NOW)
def test_application_round_admin__change_application_form_with_applications_is_rejected(api_client: APIClient) -> None:
    api_client.force_login(UserFactory.create_superuser())
    application_round = create_round(
        application_period_begins_at=NOW + datetime.timedelta(days=1),
        application_period_ends_at=datetime.datetime(2027, 2, 1, tzinfo=datetime.UTC),
    )
    ApplicationFactory.create(application_round=application_round)

    url = reverse("admin:tilavarauspalvelu_applicationround_change", args=[application_round.pk])
    data = round_form_data(
        name="Kesä",
        reservation_unit_pks=list(application_round.reservation_units.values_list("pk", flat=True)),
        application_form=ApplicationFormType.SPORTS_FORM,
    )

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Application form cannot be changed when the application round has applications.",
        },
    ]
    application_round.refresh_from_db()
    assert application_round.application_form == ApplicationFormType.DEFAULT_FORM


@freeze_time(NOW)
def test_application_round_admin__other_changes_allowed_after_application_period_began(api_client: APIClient) -> None:
    api_client.force_login(UserFactory.create_superuser())
    application_round = create_round(
        application_form=ApplicationFormType.SPORTS_FORM,
        application_period_begins_at=NOW - datetime.timedelta(days=1),
        application_period_ends_at=datetime.datetime(2027, 2, 1, tzinfo=datetime.UTC),
    )
    ApplicationFactory.create(application_round=application_round)

    url = reverse("admin:tilavarauspalvelu_applicationround_change", args=[application_round.pk])
    data = round_form_data(
        name="Uusi nimi",
        reservation_unit_pks=list(application_round.reservation_units.values_list("pk", flat=True)),
        application_form=ApplicationFormType.SPORTS_FORM,
    )
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    application_round.refresh_from_db()
    assert application_round.name == "Uusi nimi"
    assert application_round.application_form == ApplicationFormType.SPORTS_FORM
