from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import (
    AccessType,
    AuthenticationType,
    ReservationFormType,
    ResourceLocationType,
    TermsOfUseTypeChoices,
)
from tilavarauspalvelu.models import ReservationUnit
from tilavarauspalvelu.typing import error_codes
from utils.auditlog_util import AuditLogger

from tests.factories import (
    ReservationUnitFactory,
    ResourceFactory,
    SpaceFactory,
    TermsOfUseFactory,
    UnitFactory,
    UserFactory,
)

from .helpers import UPDATE_MUTATION, get_draft_update_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def setUpTestData():
    AuditLogger.register(ReservationUnit)


# ── Fields ──


def test_reservation_unit__update__name(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit, nameFi="foo")

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.name_fi == "foo"


def test_reservation_unit__update__reservation_form(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit, reservationForm=ReservationFormType.AGE_GROUP_FORM.value)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.reservation_form == ReservationFormType.AGE_GROUP_FORM


def test_reservation_unit__update__reservation_form__null(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit, reservationForm=None)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is True, response
    assert response.error_message() == "Mutation was unsuccessful."


def test_reservation_unit__update__terms_of_use(graphql):
    graphql.login_with_superuser()

    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(
        reservation_unit,
        paymentTerms=payment_terms.pk,
        cancellationTerms=cancellation_terms.pk,
        serviceSpecificTerms=service_specific_terms.pk,
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_terms == payment_terms
    assert reservation_unit.cancellation_terms == cancellation_terms
    assert reservation_unit.service_specific_terms == service_specific_terms


def test_reservation_unit__update__instructions(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(
        reservation_unit,
        reservationPendingInstructionsFi="Pending instructions fi",
        reservationPendingInstructionsSv="Pending instructions sv",
        reservationPendingInstructionsEn="Pending instructions en",
        reservationConfirmedInstructionsFi="Confirmed instructions fi",
        reservationConfirmedInstructionsSv="Confirmed instructions sv",
        reservationConfirmedInstructionsEn="Confirmed instructions en",
        reservationCancelledInstructionsFi="Cancelled instructions fi",
        reservationCancelledInstructionsSv="Cancelled instructions sv",
        reservationCancelledInstructionsEn="Cancelled instructions en",
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.reservation_pending_instructions_fi == data["reservationPendingInstructionsFi"]
    assert reservation_unit.reservation_pending_instructions_sv == data["reservationPendingInstructionsSv"]
    assert reservation_unit.reservation_pending_instructions_en == data["reservationPendingInstructionsEn"]
    assert reservation_unit.reservation_confirmed_instructions_fi == data["reservationConfirmedInstructionsFi"]
    assert reservation_unit.reservation_confirmed_instructions_sv == data["reservationConfirmedInstructionsSv"]
    assert reservation_unit.reservation_confirmed_instructions_en == data["reservationConfirmedInstructionsEn"]
    assert reservation_unit.reservation_cancelled_instructions_fi == data["reservationCancelledInstructionsFi"]
    assert reservation_unit.reservation_cancelled_instructions_sv == data["reservationCancelledInstructionsSv"]
    assert reservation_unit.reservation_cancelled_instructions_en == data["reservationCancelledInstructionsEn"]


def test_reservation_unit__update__authentication(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit, authentication=AuthenticationType.STRONG.value.upper())

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.authentication == AuthenticationType.STRONG.value


def test_reservation_unit__update__errors_with_invalid_authentication(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit, authentication="invalid")

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Variable '$input' got invalid value 'invalid'")

    reservation_unit.refresh_from_db()
    assert reservation_unit.authentication != "invalid"


def test_reservation_unit__update__errors_with_empty_name(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit, name="")

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("name") == ["This field may not be blank."]

    reservation_unit.refresh_from_db()
    assert reservation_unit.name_fi != ""


# ── Unit ──


def test_reservation_unit__update__unit_admin__move_to_other_unit(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    original_unit = reservation_unit.unit
    other_unit = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[original_unit])
    graphql.force_login(admin)

    data = get_draft_update_input_data(reservation_unit, unit=other_unit.pk)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("unit") == ["Reservation unit cannot be moved to another unit."]

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert reservation_unit.unit == original_unit


def test_reservation_unit__update__superuser__move_to_other_unit(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    original_unit = reservation_unit.unit
    other_unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = get_draft_update_input_data(reservation_unit, unit=other_unit.pk)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("unit") == ["Reservation unit cannot be moved to another unit."]

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert reservation_unit.unit == original_unit


def test_reservation_unit__update__unit_admin__same_unit(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    admin = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(admin)

    data = get_draft_update_input_data(reservation_unit, unit=reservation_unit.unit.pk, nameFi="foo")
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    updated_reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert updated_reservation_unit.name_fi == "foo"
    assert updated_reservation_unit.unit == reservation_unit.unit


# ── Spaces and resources ──


def test_reservation_unit__update__unit_admin__space_of_own_unit(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    own_space = SpaceFactory.create(unit=reservation_unit.unit)
    admin = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(admin)

    data = get_draft_update_input_data(reservation_unit, spaces=[own_space.pk])
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert list(reservation_unit.spaces.all()) == [own_space]


def test_reservation_unit__update__unit_admin__space_of_other_unit(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    other_space = SpaceFactory.create()
    admin = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(admin)

    data = get_draft_update_input_data(reservation_unit, spaces=[other_space.pk])
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("spaces") == ["Reservation unit can only have spaces of its own unit."]

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert list(reservation_unit.spaces.all()) == []


def test_reservation_unit__update__superuser__space_of_other_unit(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    other_space = SpaceFactory.create()
    graphql.login_with_superuser()

    data = get_draft_update_input_data(reservation_unit, spaces=[other_space.pk])
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("spaces") == ["Reservation unit can only have spaces of its own unit."]

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert list(reservation_unit.spaces.all()) == []


def test_reservation_unit__update__keeps_existing_space_of_other_unit(graphql):
    other_space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=True, spaces=[other_space])
    admin = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(admin)

    data = get_draft_update_input_data(reservation_unit, spaces=[other_space.pk])
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert list(reservation_unit.spaces.all()) == [other_space]


def test_reservation_unit__update__unit_admin__resource_of_other_unit(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    other_resource = ResourceFactory.create()
    admin = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(admin)

    data = get_draft_update_input_data(reservation_unit, resources=[other_resource.pk])
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("resources") == [
        "Reservation unit can only have resources in spaces of its own unit."
    ]

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert list(reservation_unit.resources.all()) == []


def test_reservation_unit__update__unit_admin__resource_without_space(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    resource = ResourceFactory.create(space=None, location_type=ResourceLocationType.MOVABLE)
    admin = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(admin)

    data = get_draft_update_input_data(reservation_unit, resources=[resource.pk])
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("resources") == [
        "Reservation unit can only have resources in spaces of its own unit."
    ]

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert list(reservation_unit.resources.all()) == []


# ── Publish ──


def test_reservation_unit__update__publish(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        name="foo",
        name_fi="foo",
        name_sv="foo",
        name_en="foo",
        description="foo",
        description_fi="foo",
        description_sv="foo",
        description_en="foo",
        pricings__highest_price=20,
        access_types__access_type=AccessType.UNRESTRICTED,
    )
    data = get_draft_update_input_data(reservation_unit, isDraft=False)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_draft is False


def test_reservation_unit__update__publish__no_pricings_fails(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        name="foo",
        name_fi="foo",
        name_sv="foo",
        name_en="foo",
        description="foo",
        description_fi="foo",
        description_sv="foo",
        description_en="foo",
        pricings=[],
    )
    data = get_draft_update_input_data(reservation_unit, isDraft=False)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is True, response
    assert response.field_error_codes()[0] == error_codes.RESERVATION_UNIT_PRICINGS_MISSING
