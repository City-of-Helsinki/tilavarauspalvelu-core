from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import ApplicantTypeChoice, Priority, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from utils.date_utils import local_datetime, local_start_of_day, local_time

from tests.factories import ApplicationFactory, OrganisationFactory, SuitableTimeRangeFactory
from tests.helpers import patch_method

from .helpers import SEND_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_application_received_email)
def test_send_application__draft(graphql):
    application = ApplicationFactory.create_application_ready_for_sending()

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response

    application.refresh_from_db()
    assert application.sent_date is not None

    assert EmailService.send_application_received_email.called is True


@patch_method(EmailService.send_application_received_email)
def test_send_application__sent(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(sent_date=local_datetime())

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response.errors

    application.refresh_from_db()
    assert application.sent_date is not None

    assert EmailService.send_application_received_email.called is True


def test_send_application__cancelled(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(cancelled_date=local_datetime())

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application in status 'CANCELLED' cannot be sent."]


def test_send_application__expired(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_round__application_period_begin=local_start_of_day() - datetime.timedelta(days=4),
        application_round__application_period_end=local_start_of_day() - datetime.timedelta(days=2),
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application in status 'EXPIRED' cannot be sent."]


def test_send_application__no_sections(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(application_sections=[])

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application requires application sections before it can be sent."]


def test_send_application__no_contact_person(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(contact_person=None)

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application contact person is required."]


def test_send_application__no_billing_address(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(billing_address=None)

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application billing address is required."]


def test_send_application__no_purpose(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(application_sections__purpose=None)
    section = application.application_sections.first()

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [f"Application section {section.pk} must have its purpose set."]


def test_send_application__no_age_group(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(application_sections__age_group=None)
    section = application.application_sections.first()

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [f"Application section {section.pk} must have age group set."]


def test_send_application__no_suitable_time_ranges(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_sections__suitable_time_ranges=[],
    )
    section = application.application_sections.first()

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Application section {section.pk} must have at least one suitable time range selected."
    ]


def test_send_application__no_reservation_unit_options(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_sections__reservation_unit_options=[],
    )
    section = application.application_sections.first()

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Application section {section.pk} must have at least one reservation unit option selected."
    ]


def test_send_application__section_empty_name(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(application_sections__name="")
    section = application.application_sections.first()

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [f"Application section {section.pk} name cannot be empty."]


def test_send_application__section_num_persons_zero(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(application_sections__num_persons=0)
    section = application.application_sections.first()

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [f"Application section {section.pk} must be for at least one person."]


def test_send_application__section_suitable_time_range_too_short(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_sections__reservation_min_duration=datetime.timedelta(hours=2),
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.MONDAY,
        application_sections__suitable_time_ranges__begin_time=local_time(10, 0),
        application_sections__suitable_time_ranges__end_time=local_time(11, 0),
    )
    section = application.application_sections.first()

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Suitable time ranges for Monday in application section {section.pk} "
        f"do not contain a contiguous time range that is at least as long as the "
        f"requested minimum reservation duration of 2 h."
    ]


def test_send_application__section_suitable_time_range__combined_are_long_enough(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_sections__reservation_min_duration=datetime.timedelta(hours=2),
        application_sections__suitable_time_ranges=[],
    )
    section = application.application_sections.first()

    SuitableTimeRangeFactory.create(
        application_section=section,
        priority=Priority.SECONDARY,  # Priority doesn't matter.
        day_of_the_week=Weekday.MONDAY,
        begin_time=local_time(10, 0),
        end_time=local_time(11, 0),
    )
    SuitableTimeRangeFactory.create(
        application_section=section,
        priority=Priority.PRIMARY,  # Priority doesn't matter.
        day_of_the_week=Weekday.MONDAY,
        begin_time=local_time(11, 0),
        end_time=local_time(12, 0),
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response.errors


def test_send_application__section_suitable_time_range__not_contiguous(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_sections__reservation_min_duration=datetime.timedelta(hours=2),
        application_sections__suitable_time_ranges=[],
    )
    section = application.application_sections.first()

    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=local_time(10, 0),
        end_time=local_time(11, 0),
    )
    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=local_time(12, 0),
        end_time=local_time(13, 0),
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Suitable time ranges for Monday in application section {section.pk} "
        f"do not contain a contiguous time range that is at least as long as the "
        f"requested minimum reservation duration of 2 h."
    ]


def test_send_application__section_suitable_time_range__different_days(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_sections__reservation_min_duration=datetime.timedelta(hours=2),
        application_sections__suitable_time_ranges=[],
    )
    section = application.application_sections.first()

    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=local_time(10, 0),
        end_time=local_time(11, 0),
    )
    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.TUESDAY,
        begin_time=local_time(11, 0),
        end_time=local_time(12, 0),
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Suitable time ranges for Monday in application section {section.pk} "
        f"do not contain a contiguous time range that is at least as long as the "
        f"requested minimum reservation duration of 2 h.",
        #
        f"Suitable time ranges for Tuesday in application section {section.pk} "
        f"do not contain a contiguous time range that is at least as long as the "
        f"requested minimum reservation duration of 2 h.",
    ]


def test_send_application__section_suitable_time_range__not_enough_suitable_ranges(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_sections__applied_reservations_per_week=2,
    )
    section = application.application_sections.first()

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Application section {section.pk} must have suitable time ranges on at least as many days "
        f"as requested reservations per week. Counted 1 but expected at least 2."
    ]


def test_send_application__section_suitable_time_range__only_count_different_days(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_sections__applied_reservations_per_week=2,
        application_sections__suitable_time_ranges=[],
    )
    section = application.application_sections.first()

    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=local_time(10, 0),
        end_time=local_time(11, 0),
    )
    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=local_time(11, 0),
        end_time=local_time(12, 0),
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Application section {section.pk} must have suitable time ranges on at least as many days "
        f"as requested reservations per week. Counted 1 but expected at least 2."
    ]


def test_send_application__contact_person_first_name_missing(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(contact_person__first_name="")

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application contact person must have a first name."]


def test_send_application__contact_person_last_name_missing(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(contact_person__last_name="")

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application contact person must have a last name."]


def test_send_application__contact_person_email_missing(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(contact_person__email=None)

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application contact person must have an email address."]


def test_send_application__contact_person_phone_number_missing(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(contact_person__phone_number=None)

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application contact person must have a phone number."]


def test_send_application__billing_address_street_address_missing(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(billing_address__street_address="")

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application billing address must have a street address."]


def test_send_application__billing_address_post_code_missing(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(billing_address__post_code="")

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application billing address must have a post code."]


def test_send_application__billing_address_city_missing(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(billing_address__city="")

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application billing address must have a city."]


@pytest.mark.parametrize(
    "applicant_type",
    [
        ApplicantTypeChoice.ASSOCIATION,
        ApplicantTypeChoice.COMMUNITY,
        ApplicantTypeChoice.COMPANY,
    ],
)
def test_send_application__no_organisation(graphql, applicant_type):
    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=applicant_type,
        organisation=None,
        home_city__name="Helsinki",
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application organisation is required."]


@patch_method(EmailService.send_application_received_email)
def test_send_application__community_applicant(graphql):
    org = OrganisationFactory.create_for_community_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response.errors

    application.refresh_from_db()
    assert application.sent_date is not None

    assert EmailService.send_application_received_email.called is True


def test_send_application__community_applicant__contact_person_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        contact_person=None,
        organisation=org,
        home_city__name="Helsinki",
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application contact person is required."]


def test_send_application__community_applicant__org_name_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant(name="")

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application organisation must have a name."]


def test_send_application__community_applicant__org_core_business_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant(core_business="")

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application organisation must have a core business."]


def test_send_application__community_applicant__missing_home_city(graphql):
    org = OrganisationFactory.create_for_community_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application home city is required with organisation."]


def test_send_application__community_applicant__address_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant(address=None)

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application organisation address is required."]


def test_send_application__community_applicant__address_street_address_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant(address__street_address="")

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application organisation address must have a street address."]


def test_send_application__community_applicant__address_post_code_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant(address__post_code="")

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application organisation address must have a post code."]


def test_send_application__community_applicant__address_city_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant(address__city="")

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application organisation address must have a city."]


def test_send_application__community_applicant__billing_address(graphql):
    org = OrganisationFactory.create_for_community_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address__street_address="Billing address",
        billing_address__post_code="54321",
        billing_address__city="City",
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response.errors


def test_send_application__community_applicant__billing_address__street_address_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address__street_address="",
        billing_address__post_code="54321",
        billing_address__city="City",
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application billing address must have a street address."]


def test_send_application__community_applicant__billing_address__post_code_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address__street_address="Billing address",
        billing_address__post_code="",
        billing_address__city="City",
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application billing address must have a post code."]


def test_send_application__community_applicant__billing_address__city_missing(graphql):
    org = OrganisationFactory.create_for_community_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        organisation=org,
        home_city__name="Helsinki",
        billing_address__street_address="Billing address",
        billing_address__post_code="54321",
        billing_address__city="",
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application billing address must have a city."]


@patch_method(EmailService.send_application_received_email)
def test_send_application__association_applicant(graphql):
    org = OrganisationFactory.create_for_association_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.ASSOCIATION,
        organisation=org,
        home_city__name="Helsinki",
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response.errors

    application.refresh_from_db()
    assert application.sent_date is not None

    assert EmailService.send_application_received_email.called is True


@patch_method(EmailService.send_application_received_email)
def test_send_application__company_applicant(graphql):
    org = OrganisationFactory.create_for_company_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMPANY,
        organisation=org,
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response.errors

    application.refresh_from_db()
    assert application.sent_date is not None

    assert EmailService.send_application_received_email.called is True


def test_send_application__company_applicant__no_contact_person(graphql):
    org = OrganisationFactory.create_for_company_applicant()

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMPANY,
        organisation=org,
        contact_person=None,
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == ["Application contact person is required."]


def test_send_application__company_applicant__identifier_missing(graphql):
    org = OrganisationFactory.create_for_company_applicant(identifier=None)

    application = ApplicationFactory.create_application_ready_for_sending(
        applicant_type=ApplicantTypeChoice.COMPANY,
        organisation=org,
        billing_address=None,
    )

    graphql.login_with_superuser()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is True
    assert response.field_error_messages() == [
        "Application organisation must have an identifier.",
    ]
