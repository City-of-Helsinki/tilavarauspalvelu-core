from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.enums import ApplicationFormType
from tilavarauspalvelu.models import Application
from utils.date_utils import local_datetime

from tests.factories import ApplicationFactory, ApplicationRoundFactory

from .helpers import CREATE_MUTATION, UPDATE_MUTATION, get_application_create_data

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Create ──


def test_application__create__sports_form__organisation_active_members(graphql: GraphQLClient) -> None:
    application_round = ApplicationRoundFactory.create_in_status_open(
        application_form=ApplicationFormType.SPORTS_FORM,
    )
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    input_data["organisationActiveMembers"] = 25
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response
    application = Application.objects.get(application_round=application_round)
    assert application.organisation_active_members == 25


def test_application__create__default_form__organisation_active_members_not_allowed(graphql: GraphQLClient) -> None:
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    input_data["organisationActiveMembers"] = 25
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.field_error_messages() == [
        "Active members can only be given when the application round uses the sports application form.",
    ]
    assert not Application.objects.filter(application_round=application_round).exists()


def test_application__create__default_form__organisation_active_members_null(graphql: GraphQLClient) -> None:
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    input_data["organisationActiveMembers"] = None
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response
    assert Application.objects.filter(application_round=application_round).exists()


# ── Update ──


def test_application__update__sports_form__organisation_active_members(graphql: GraphQLClient) -> None:
    application = ApplicationFactory.create_in_status_draft(
        application_round__application_form=ApplicationFormType.SPORTS_FORM,
    )
    graphql.login_with_superuser()

    input_data = {"pk": application.pk, "organisationActiveMembers": 25}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.organisation_active_members == 25


def test_application__update__default_form__organisation_active_members_not_allowed(graphql: GraphQLClient) -> None:
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_with_superuser()

    input_data = {"pk": application.pk, "organisationActiveMembers": 25}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.field_error_messages() == [
        "Active members can only be given when the application round uses the sports application form.",
    ]
    application.refresh_from_db()
    assert application.organisation_active_members is None
