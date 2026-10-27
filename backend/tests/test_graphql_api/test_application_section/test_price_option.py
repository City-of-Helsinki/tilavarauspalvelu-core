from __future__ import annotations

import pytest
from graphql_relay import to_global_id

from tilavarauspalvelu.models import Application, ApplicationSection
from utils.date_utils import local_datetime

from tests.factories import ApplicationFactory, ApplicationSectionFactory, PriceOptionFactory
from tests.test_graphql_api.test_application.helpers import CREATE_MUTATION as CREATE_APPLICATION_MUTATION
from tests.test_graphql_api.test_application.helpers import get_application_create_data
from tests.test_graphql_api.test_application_section.helpers import (
    CREATE_MUTATION,
    UPDATE_MUTATION,
    get_application_section_create_data,
    section_query,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Create ──


def test_application_section__create__with_offered_price_option(graphql):
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.force_login(application.user)

    data = get_application_section_create_data(application=application)
    price_option = PriceOptionFactory.create_for_application_round(application.application_round)
    data["priceOption"] = price_option.pk
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response
    section = ApplicationSection.objects.get(application=application)
    assert section.price_option == price_option


def test_application_section__create__without_price_option(graphql):
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.force_login(application.user)

    data = get_application_section_create_data(application=application)
    PriceOptionFactory.create_for_application_round(application.application_round)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response
    section = ApplicationSection.objects.get(application=application)
    assert section.price_option is None


def test_application_section__create__price_option_not_offered(graphql):
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.force_login(application.user)

    data = get_application_section_create_data(application=application)
    price_option = PriceOptionFactory.create()
    data["priceOption"] = price_option.pk
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == [
        f"Price option {price_option.pk} is not offered by the application round.",
    ]
    assert not ApplicationSection.objects.filter(application=application).exists()


def test_application_section__create_with_application__price_option_not_offered(graphql):
    application_round = ApplicationFactory.create_in_status_draft_no_sections().application_round
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    data = get_application_create_data(application_round, create_sections=True)
    price_option = PriceOptionFactory.create()
    data["applicationSections"][0]["priceOption"] = price_option.pk
    response = graphql(CREATE_APPLICATION_MUTATION, input_data=data)

    assert response.field_error_messages("applicationSections.0.nonFieldErrors") == [
        f"Price option {price_option.pk} is not offered by the application round.",
    ]
    assert not Application.objects.filter(application_round=application_round, user__is_superuser=True).exists()


def test_application_section__create_with_application__offered_price_option(graphql):
    application_round = ApplicationFactory.create_in_status_draft_no_sections().application_round
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    data = get_application_create_data(application_round, create_sections=True)
    price_option = PriceOptionFactory.create_for_application_round(application_round)
    data["applicationSections"][0]["priceOption"] = price_option.pk
    response = graphql(CREATE_APPLICATION_MUTATION, input_data=data)

    assert response.has_errors is False, response
    section = ApplicationSection.objects.get(application__pk=response.first_query_object["pk"])
    assert section.price_option == price_option


# ── Update ──


def test_application_section__update__price_option(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated()
    application_round = section.application.application_round
    application_round.reservation_units.add(section.reservation_unit_options.first().reservation_unit)
    price_option = PriceOptionFactory.create_for_application_round(application_round)
    graphql.force_login(section.application.user)

    response = graphql(UPDATE_MUTATION, input_data={"pk": section.pk, "priceOption": price_option.pk})

    assert response.has_errors is False, response
    section.refresh_from_db()
    assert section.price_option == price_option


def test_application_section__update__price_option_not_offered(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated()
    price_option = PriceOptionFactory.create()
    graphql.force_login(section.application.user)

    response = graphql(UPDATE_MUTATION, input_data={"pk": section.pk, "priceOption": price_option.pk})

    assert response.field_error_messages() == [
        f"Price option {price_option.pk} is not offered by the application round.",
    ]
    section.refresh_from_db()
    assert section.price_option is None


# ── Query ──


def test_application_section__query__price_option(graphql):
    price_option = PriceOptionFactory.create(name="Adults")
    section = ApplicationSectionFactory.create_in_status_unallocated(price_option=price_option)
    graphql.login_with_superuser()

    global_id = to_global_id("ApplicationSectionNode", section.pk)
    query = section_query(fields="priceOption { pk nameFi }", id=global_id)
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceOption": {"pk": price_option.pk, "nameFi": "Adults"}}
