from __future__ import annotations

import pytest
from django.urls import reverse

from tests.factories import (
    ApplicationFactory,
    ReservationFactory,
    ReservationSeriesFactory,
    ReservationUnitFactory,
    UserFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Related object lists ──


def test_admin_related_links__user__shows_only_their_reservations(api_client):
    admin_user = UserFactory.create_superuser()
    api_client.force_login(admin_user)

    user = UserFactory.create()
    reservation = ReservationFactory.create(user=user, reservation_unit=ReservationUnitFactory.create())
    ReservationFactory.create(user=UserFactory.create(), reservation_unit=ReservationUnitFactory.create())

    url = reverse("admin:tilavarauspalvelu_user_show_reservations", args=[user.pk])
    response = api_client.get(url, follow=True)

    assert response.status_code == 200
    assert list(response.context["cl"].result_list) == [reservation]


def test_admin_related_links__user__shows_only_their_reservation_series(api_client):
    admin_user = UserFactory.create_superuser()
    api_client.force_login(admin_user)

    user = UserFactory.create()
    reservation_series = ReservationSeriesFactory.create(user=user)
    ReservationSeriesFactory.create(user=UserFactory.create())

    url = reverse("admin:tilavarauspalvelu_user_show_reservation_series", args=[user.pk])
    response = api_client.get(url, follow=True)

    assert response.status_code == 200
    assert list(response.context["cl"].result_list) == [reservation_series]


def test_admin_related_links__user__shows_only_their_applications(api_client):
    admin_user = UserFactory.create_superuser()
    api_client.force_login(admin_user)

    user = UserFactory.create()
    application = ApplicationFactory.create(user=user)
    ApplicationFactory.create(user=UserFactory.create())

    url = reverse("admin:tilavarauspalvelu_user_show_applications", args=[user.pk])
    response = api_client.get(url, follow=True)

    assert response.status_code == 200
    assert list(response.context["cl"].result_list) == [application]


def test_admin_related_links__reservation_unit__shows_only_its_reservations(api_client):
    admin_user = UserFactory.create_superuser()
    api_client.force_login(admin_user)

    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=reservation_unit)
    ReservationFactory.create(reservation_unit=ReservationUnitFactory.create())

    url = reverse("admin:tilavarauspalvelu_reservationunit_show_reservations", args=[reservation_unit.pk])
    response = api_client.get(url, follow=True)

    assert response.status_code == 200
    assert list(response.context["cl"].result_list) == [reservation]


# ── Staff UI ──


def test_admin_related_links__reservation__opens_staff_ui(api_client, settings):
    settings.EMAIL_VARAAMO_EXT_LINK = "https://varaamo.hel.fi/"

    admin_user = UserFactory.create_superuser()
    api_client.force_login(admin_user)

    reservation = ReservationFactory.create(reservation_unit=ReservationUnitFactory.create())

    url = reverse("admin:tilavarauspalvelu_reservation_open_in_staff_ui", args=[reservation.pk])
    response = api_client.get(url)

    assert response.status_code == 302
    assert response["Location"] == f"https://varaamo.hel.fi/kasittely/reservations/{reservation.pk}"


def test_admin_related_links__application__opens_staff_ui(api_client, settings):
    settings.EMAIL_VARAAMO_EXT_LINK = "https://varaamo.hel.fi/"

    admin_user = UserFactory.create_superuser()
    api_client.force_login(admin_user)

    application = ApplicationFactory.create()

    url = reverse("admin:tilavarauspalvelu_application_open_in_staff_ui", args=[application.pk])
    response = api_client.get(url)

    assert response.status_code == 302
    assert response["Location"] == f"https://varaamo.hel.fi/kasittely/applications/{application.pk}"


def test_admin_related_links__reservation_unit__opens_staff_ui(api_client, settings):
    settings.EMAIL_VARAAMO_EXT_LINK = "https://varaamo.hel.fi/"

    admin_user = UserFactory.create_superuser()
    api_client.force_login(admin_user)

    reservation_unit = ReservationUnitFactory.create()

    url = reverse("admin:tilavarauspalvelu_reservationunit_open_in_staff_ui", args=[reservation_unit.pk])
    response = api_client.get(url)

    assert response.status_code == 302
    assert response["Location"] == (
        f"https://varaamo.hel.fi/kasittely/units/{reservation_unit.unit.pk}/reservation-units/{reservation_unit.pk}"
    )
