import pytest
from django.test import override_settings

from tests.factories import ApplicationFactory
from tests.helpers import UserType
from users.models import PersonalInfoViewLog

from .helpers import applications_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_can_query_application__all_fields(graphql):
    # given:
    # - There are two applications in the system, one with events and one without
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    section = application.application_sections.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        applicantType
        organisation {
            pk
        }
        applicationRound {
            pk
        }
        user {
            pk
        }
        contactPerson {
            pk
        }
        applicationSections {
            pk
        }
        billingAddress {
            pk
        }
        homeCity {
            pk
        }
        createdDate
        lastModifiedDate
        additionalInformation
        workingMemo
        status
    """

    # when:
    # - User tries to search for applications with all fields
    query = applications_query(fields=fields)
    response = graphql(query)

    # then:
    # - The response contains the selected fields from both applications
    assert len(response.edges) == 1, response
    assert response.node(0) == {
        "pk": application.pk,
        "applicantType": application.applicant_type,
        "organisation": {
            "pk": application.organisation.pk,
        },
        "applicationRound": {
            "pk": application.application_round.pk,
        },
        "user": {
            "pk": application.user.pk,
        },
        "contactPerson": {
            "pk": application.contact_person.pk,
        },
        "applicationSections": [
            {
                "pk": section.pk,
            },
        ],
        "status": application.status.value,
        "billingAddress": {
            "pk": application.billing_address.pk,
        },
        "homeCity": {
            "pk": application.home_city.pk,
        },
        "createdDate": application.created_date.isoformat(),
        "lastModifiedDate": application.last_modified_date.isoformat(),
        "additionalInformation": application.additional_information,
        "workingMemo": application.working_memo,
    }


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
def test_accessing_applicant_date_of_birth_creates_personal_info_view_log(graphql):
    # given:
    # - There is an application in the system
    # - A superuser is using the system
    ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to access the date of birth of the applicant
    fields = """
        user {
            dateOfBirth
        }
    """
    query = applications_query(fields=fields)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - A personal info view log is created
    assert response.has_errors is False, response
    assert PersonalInfoViewLog.objects.count() == 1
