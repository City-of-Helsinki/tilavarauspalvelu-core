from __future__ import annotations

import pytest

from tilavarauspalvelu.models import PersonalInfoViewLog

from tests.factories import ApplicationFactory

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
    graphql.login_with_superuser()

    fields = """
        pk
        applicantType
        additionalInformation
        additionalInformation
        municipality
        contactPersonFirstName
        contactPersonLastName
        contactPersonEmail
        contactPersonPhoneNumber
        organisationName
        organisationEmail
        organisationIdentifier
        organisationYearEstablished
        organisationActiveMembers
        organisationCoreBusiness
        organisationStreetAddress
        organisationPostCode
        organisationCity
        billingStreetAddress
        billingPostCode
        billingCity
        createdAt
        updatedAt
        workingMemo
        applicationRound { pk }
        user { pk }
        applicationSections { pk }
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
        "additionalInformation": application.additional_information,
        "municipality": application.municipality,
        "contactPersonFirstName": application.contact_person_first_name,
        "contactPersonLastName": application.contact_person_last_name,
        "contactPersonEmail": application.contact_person_email,
        "contactPersonPhoneNumber": application.contact_person_phone_number,
        "organisationName": application.organisation_name,
        "organisationEmail": application.organisation_email,
        "organisationIdentifier": application.organisation_identifier,
        "organisationYearEstablished": application.organisation_year_established,
        "organisationActiveMembers": application.organisation_active_members,
        "organisationCoreBusiness": application.organisation_core_business,
        "organisationStreetAddress": application.organisation_street_address,
        "organisationPostCode": application.organisation_post_code,
        "organisationCity": application.organisation_city,
        "billingStreetAddress": application.billing_street_address,
        "billingPostCode": application.billing_post_code,
        "billingCity": application.billing_city,
        "createdAt": application.created_at.isoformat(),
        "updatedAt": application.updated_at.isoformat(),
        "workingMemo": application.working_memo,
        "applicationRound": {"pk": application.application_round.pk},
        "user": {"pk": application.user.pk},
        "applicationSections": [{"pk": section.pk}],
        "status": application.status.value,
    }


def test_accessing_applicant_date_of_birth_creates_personal_info_view_log(graphql):
    # given:
    # - There is an application in the system
    # - A superuser is using the system
    ApplicationFactory.create_in_status_draft()
    graphql.login_with_superuser()

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
