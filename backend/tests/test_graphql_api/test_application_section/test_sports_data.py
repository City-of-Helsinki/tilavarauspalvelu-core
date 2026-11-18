from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ApplicationFormType
from tilavarauspalvelu.models import Application, ApplicationSection
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationFactory,
    ApplicationRoundFactory,
    ApplicationSectionFactory,
    ParticipantGenderFactory,
    SportFactory,
)
from tests.test_graphql_api.test_application.helpers import CREATE_MUTATION as CREATE_APPLICATION_MUTATION
from tests.test_graphql_api.test_application.helpers import UPDATE_MUTATION as UPDATE_APPLICATION_MUTATION
from tests.test_graphql_api.test_application.helpers import get_application_create_data
from tests.test_graphql_api.test_application_section.helpers import (
    CREATE_MUTATION,
    UPDATE_MUTATION,
    get_application_section_create_data,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Create ──


def test_application_section__create__sports_form__all_sports_data(graphql):
    application = ApplicationFactory.create_in_status_draft_no_sections(
        application_round__application_form=ApplicationFormType.SPORTS_FORM,
    )
    sport = SportFactory.create()
    participant_gender = ParticipantGenderFactory.create()
    graphql.force_login(application.user)

    data = get_application_section_create_data(application=application)
    data["sport"] = sport.pk
    data["participantGender"] = participant_gender.pk
    data["leagueLevel"] = "3. divisioona"
    data["multipleReservationsPerDayWish"] = "Kaksi vuoroa lauantaisin"
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response
    section = ApplicationSection.objects.get(application=application)
    assert section.sport == sport
    assert section.sport_other == ""
    assert section.participant_gender == participant_gender
    assert section.league_level == "3. divisioona"
    assert section.multiple_reservations_per_day_wish == "Kaksi vuoroa lauantaisin"


def test_application_section__create__sports_form__sport_and_other_sport(graphql):
    application = ApplicationFactory.create_in_status_draft_no_sections(
        application_round__application_form=ApplicationFormType.SPORTS_FORM,
    )
    graphql.force_login(application.user)

    data = get_application_section_create_data(application=application)
    data["sport"] = SportFactory.create().pk
    data["sportOther"] = "Kabaddi"
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == [
        "Application section cannot have both a sport and an other sport set.",
    ]
    assert not ApplicationSection.objects.filter(application=application).exists()


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("sportOther", "Kabaddi"),
        ("leagueLevel", "3. divisioona"),
        ("multipleReservationsPerDayWish", "Kaksi vuoroa lauantaisin"),
    ],
)
def test_application_section__create__default_form__sports_text_not_allowed(graphql, field, value):
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.force_login(application.user)

    data = get_application_section_create_data(application=application)
    data[field] = value
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == [
        "Sports data can only be given when the application round uses the sports application form.",
    ]
    assert not ApplicationSection.objects.filter(application=application).exists()


def test_application_section__create__default_form__sport_not_allowed(graphql):
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.force_login(application.user)

    data = get_application_section_create_data(application=application)
    data["sport"] = SportFactory.create().pk
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == [
        "Sports data can only be given when the application round uses the sports application form.",
    ]
    assert not ApplicationSection.objects.filter(application=application).exists()


def test_application_section__create__default_form__participant_gender_not_allowed(graphql):
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.force_login(application.user)

    data = get_application_section_create_data(application=application)
    data["participantGender"] = ParticipantGenderFactory.create().pk
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == [
        "Sports data can only be given when the application round uses the sports application form.",
    ]
    assert not ApplicationSection.objects.filter(application=application).exists()


def test_application_section__create__default_form__empty_sports_data(graphql):
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.force_login(application.user)

    data = get_application_section_create_data(application=application)
    data["sport"] = None
    data["sportOther"] = ""
    data["participantGender"] = None
    data["leagueLevel"] = ""
    data["multipleReservationsPerDayWish"] = ""
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response
    assert ApplicationSection.objects.filter(application=application).exists()


def test_application_section__create_with_application__sports_form__sport(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open(
        application_form=ApplicationFormType.SPORTS_FORM,
    )
    sport = SportFactory.create()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    data = get_application_create_data(application_round, create_sections=True)
    data["applicationSections"][0]["sport"] = sport.pk
    response = graphql(CREATE_APPLICATION_MUTATION, input_data=data)

    assert response.has_errors is False, response
    section = ApplicationSection.objects.get(application__pk=response.first_query_object["pk"])
    assert section.sport == sport


def test_application_section__create_with_application__default_form__sports_data_not_allowed(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    data = get_application_create_data(application_round, create_sections=True)
    data["applicationSections"][0]["sportOther"] = "Kabaddi"
    response = graphql(CREATE_APPLICATION_MUTATION, input_data=data)

    assert response.field_error_messages("applicationSections.0.nonFieldErrors") == [
        "Sports data can only be given when the application round uses the sports application form.",
    ]
    assert not Application.objects.filter(application_round=application_round).exists()


# ── Update ──


def test_application_section__update__sports_form__other_sport_when_sport_is_saved(graphql):
    sport = SportFactory.create()
    section = ApplicationSectionFactory.create_in_status_unallocated(
        application__application_round__application_form=ApplicationFormType.SPORTS_FORM,
        sport=sport,
    )
    graphql.force_login(section.application.user)

    response = graphql(UPDATE_MUTATION, input_data={"pk": section.pk, "sportOther": "Kabaddi"})

    assert response.field_error_messages() == [
        "Application section cannot have both a sport and an other sport set.",
    ]
    section.refresh_from_db()
    assert section.sport == sport
    assert section.sport_other == ""


def test_application_section__update__sports_form__switch_from_sport_to_other_sport(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated(
        application__application_round__application_form=ApplicationFormType.SPORTS_FORM,
        sport=SportFactory.create(),
    )
    graphql.force_login(section.application.user)

    response = graphql(UPDATE_MUTATION, input_data={"pk": section.pk, "sport": None, "sportOther": "Kabaddi"})

    assert response.has_errors is False, response
    section.refresh_from_db()
    assert section.sport is None
    assert section.sport_other == "Kabaddi"


def test_application_section__update_with_application__sports_form__each_section_uses_its_own_data(graphql):
    application = ApplicationFactory.create_in_status_draft_no_sections(
        application_round__application_form=ApplicationFormType.SPORTS_FORM,
    )
    first_section = ApplicationSectionFactory.create_in_status_unallocated(application=application)
    second_section = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        sport=SportFactory.create(),
    )
    graphql.force_login(application.user)

    input_data = {
        "pk": application.pk,
        "applicationSections": [
            {"pk": first_section.pk},
            {"pk": second_section.pk, "sportOther": "Kabaddi"},
        ],
    }
    response = graphql(UPDATE_APPLICATION_MUTATION, input_data=input_data)

    assert response.field_error_messages("applicationSections.1.nonFieldErrors") == [
        "Application section cannot have both a sport and an other sport set.",
    ]
    second_section.refresh_from_db()
    assert second_section.sport_other == ""


def test_application_section__update__sports_form__free_text_is_saved_as_written(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated(
        application__application_round__application_form=ApplicationFormType.SPORTS_FORM,
    )
    graphql.force_login(section.application.user)

    input_data = {
        "pk": section.pk,
        "sportOther": "<i>Kabaddi</i>",
        "leagueLevel": "Tytöt & pojat <18v",
        "multipleReservationsPerDayWish": "Kaksi vuoroa, jos 1 < 2 & 3 > 2",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response
    section.refresh_from_db()
    assert section.sport_other == "<i>Kabaddi</i>"
    assert section.league_level == "Tytöt & pojat <18v"
    assert section.multiple_reservations_per_day_wish == "Kaksi vuoroa, jos 1 < 2 & 3 > 2"


def test_application_section__update__default_form__sports_data_not_allowed(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.force_login(section.application.user)

    response = graphql(UPDATE_MUTATION, input_data={"pk": section.pk, "leagueLevel": "3. divisioona"})

    assert response.field_error_messages() == [
        "Sports data can only be given when the application round uses the sports application form.",
    ]
    section.refresh_from_db()
    assert section.league_level == ""
