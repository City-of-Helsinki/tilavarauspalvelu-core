from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import ApplicationSectionStatusChoice
from tilavarauspalvelu.models import Application, ApplicationSection
from utils.date_utils import local_datetime

from tests.factories import ApplicationRoundFactory, ApplicationSectionFactory
from tests.factories.application_section import ApplicationSectionBuilder
from tests.test_graphql_api.test_application_section.helpers import DELETE_MUTATION, get_application_section_delete_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    "status",
    [
        ApplicationSectionStatusChoice.IN_ALLOCATION,
        ApplicationSectionStatusChoice.HANDLED,
        ApplicationSectionStatusChoice.REJECTED,
    ],
)
def test_application_section__delete__not_unallocated(graphql, status):
    # given:
    # - There is an application section with the given status
    # - A superuser is using the system
    section = ApplicationSectionBuilder().with_status(status).create()
    graphql.login_with_superuser()

    # when:
    # - User tries to delete an application section
    data = get_application_section_delete_data(section)
    response = graphql(DELETE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about deleting the section
    assert response.field_error_messages() == ["Application section has been allocated and cannot be deleted anymore."]

    assert ApplicationSection.objects.filter(pk=section.pk).exists() is True


def test_application_section__delete__resets_application_sent_at(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated(application__sent_at=local_datetime())
    graphql.force_login(section.application.user)

    data = get_application_section_delete_data(section)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    assert ApplicationSection.objects.filter(pk=section.pk).exists() is False

    application = Application.objects.get(pk=section.application.pk)
    assert application.sent_at is None


def test_application_section__delete__staff__does_not_reset_application_sent_at(graphql):
    sent_at = local_datetime()
    section = ApplicationSectionFactory.create_in_status_unallocated(application__sent_at=sent_at)
    graphql.login_with_superuser()

    data = get_application_section_delete_data(section)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    assert ApplicationSection.objects.filter(pk=section.pk).exists() is False

    application = Application.objects.get(pk=section.application.pk)
    assert application.sent_at == sent_at.astimezone(datetime.UTC)


def test_application_section__delete__application_round_not_open(graphql):
    application_round = ApplicationRoundFactory.create_in_status_upcoming()
    section = ApplicationSectionFactory.create_in_status_unallocated(application__application_round=application_round)
    graphql.login_with_superuser()

    data = get_application_section_delete_data(section)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.field_error_messages() == ["Application round is not open for applications"]

    assert ApplicationSection.objects.filter(pk=section.pk).exists() is True
