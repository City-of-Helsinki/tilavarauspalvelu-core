from __future__ import annotations

from typing import TYPE_CHECKING, Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.enums import ApplicationFormType

from tests.factories import ApplicationSectionFactory, SportFactory, UserFactory
from tests.test_admin.helpers import collect_admin_form_errors, management_form_data

if TYPE_CHECKING:
    from rest_framework.test import APIClient

    from tilavarauspalvelu.models import ApplicationSection

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def section_form_data(section: ApplicationSection, **overrides: Any) -> dict[str, Any]:
    data = {
        "name": section.name,
        "num_persons": section.num_persons,
        "age_group": section.age_group_id or "",
        "purpose": section.purpose_id or "",
        "sport": section.sport_id or "",
        "sport_other": section.sport_other,
        "participant_gender": section.participant_gender_id or "",
        "league_level": section.league_level,
        "multiple_reservations_per_day_wish": section.multiple_reservations_per_day_wish,
        "reservation_min_duration": str(section.reservation_min_duration),
        "reservation_max_duration": str(section.reservation_max_duration),
        "reservations_begin_date": section.reservations_begin_date.isoformat(),
        "reservations_end_date": section.reservations_end_date.isoformat(),
        "applied_reservations_per_week": section.applied_reservations_per_week,
        **management_form_data("suitable_time_ranges"),
        **management_form_data("reservation_unit_options"),
    }
    data.update(overrides)
    return data


# ── Sports data ──


def test_application_section_admin__sports_form__switch_from_sport_to_other_sport(api_client: APIClient) -> None:
    section = ApplicationSectionFactory.create_in_status_unallocated(
        application__application_round__application_form=ApplicationFormType.SPORTS_FORM,
        sport=SportFactory.create(),
    )
    api_client.force_login(UserFactory.create_superuser())

    url = reverse("admin:tilavarauspalvelu_applicationsection_change", args=[section.pk])
    data = section_form_data(section, sport="", sport_other="Kabaddi")
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    section.refresh_from_db()
    assert section.sport is None
    assert section.sport_other == "Kabaddi"


def test_application_section_admin__sports_form__sport_and_other_sport(api_client: APIClient) -> None:
    sport = SportFactory.create()
    section = ApplicationSectionFactory.create_in_status_unallocated(
        application__application_round__application_form=ApplicationFormType.SPORTS_FORM,
        sport=sport,
    )
    api_client.force_login(UserFactory.create_superuser())

    url = reverse("admin:tilavarauspalvelu_applicationsection_change", args=[section.pk])
    data = section_form_data(section, sport_other="Kabaddi")

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Application section cannot have both a sport and an other sport set.",
        },
    ]
    section.refresh_from_db()
    assert section.sport == sport
    assert section.sport_other == ""


def test_application_section_admin__default_form__sports_data_not_allowed(api_client: APIClient) -> None:
    section = ApplicationSectionFactory.create_in_status_unallocated()
    api_client.force_login(UserFactory.create_superuser())

    url = reverse("admin:tilavarauspalvelu_applicationsection_change", args=[section.pk])
    data = section_form_data(section, league_level="3. divisioona")

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Sports data can only be given when the application round uses the sports application form.",
        },
    ]
    section.refresh_from_db()
    assert section.league_level == ""


def test_application_section_admin__default_form__empty_sports_data(api_client: APIClient) -> None:
    section = ApplicationSectionFactory.create_in_status_unallocated()
    api_client.force_login(UserFactory.create_superuser())

    url = reverse("admin:tilavarauspalvelu_applicationsection_change", args=[section.pk])
    data = section_form_data(section, name="Uusi nimi")
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    section.refresh_from_db()
    assert section.name == "Uusi nimi"
