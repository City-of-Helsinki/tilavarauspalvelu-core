from __future__ import annotations

import datetime
from typing import Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.enums import AccessType
from utils.date_utils import local_date, local_datetime

from tests.factories import ApplicationRoundFactory, ReservationUnitFactory, UserFactory
from tests.test_admin.helpers import (
    collect_admin_form_errors,
    management_form_data,
    required_reservation_unit_form_data,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Pending application rounds ──


def test_reservation_unit_admin__to_draft_in_pending_application_round_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    today = local_date()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    ApplicationRoundFactory.create(
        name="Kesä",
        reservation_units=[reservation_unit],
        reservation_period_begin_date=today + datetime.timedelta(days=30),
        reservation_period_end_date=today + datetime.timedelta(days=120),
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        **required_reservation_unit_form_data(reservation_unit),
        "is_draft": "on",
        "access_types-0-access_type": AccessType.UNRESTRICTED.value,
        "access_types-0-begin_date": today.isoformat(),
        **management_form_data("access_types", total_forms=1),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": (
                "Reservation unit is in application rounds whose reservations are not made yet: Kesä. "
                "It cannot be a draft, be archived, or allow only direct reservations "
                "until it is removed from these rounds."
            ),
        },
    ]

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_draft is False


def test_reservation_unit_admin__to_draft_in_ended_application_round(api_client):
    api_client.force_login(UserFactory.create_superuser())
    today = local_date()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    ApplicationRoundFactory.create(
        name="Kevät",
        reservation_units=[reservation_unit],
        application_period_begins_at=local_datetime() - datetime.timedelta(days=200),
        application_period_ends_at=local_datetime() - datetime.timedelta(days=150),
        reservation_period_begin_date=today - datetime.timedelta(days=120),
        reservation_period_end_date=today - datetime.timedelta(days=1),
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        **required_reservation_unit_form_data(reservation_unit),
        "is_draft": "on",
        "access_types-0-access_type": AccessType.UNRESTRICTED.value,
        "access_types-0-begin_date": today.isoformat(),
        **management_form_data("access_types", total_forms=1),
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_draft is True
