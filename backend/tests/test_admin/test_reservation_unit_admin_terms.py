from __future__ import annotations

from decimal import Decimal

import pytest
from django.contrib.admin import AdminSite
from django.test import RequestFactory

from tilavarauspalvelu.admin.reservation_unit.admin import ReservationUnitAdmin
from tilavarauspalvelu.enums import (
    AccessType,
    AuthenticationType,
    ReservationFormType,
    ReservationKind,
    ReservationStartInterval,
    TermsOfUseTypeChoices,
)
from tilavarauspalvelu.models import ReservationUnit, ReservationUnitPricing

from tests.factories import ReservationUnitFactory, ReservationUnitPricingFactory, TermsOfUseFactory, UserFactory
from tests.test_admin.helpers import management_form_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def get_valid_data(reservation_unit: ReservationUnit):
    return {
        "unit": reservation_unit.unit.pk,
        "name_fi": reservation_unit.name_fi,
        "description": reservation_unit.description,
        "reservation_start_interval": ReservationStartInterval.INTERVAL_15_MINUTES,
        "authentication": AuthenticationType.WEAK,
        "reservation_kind": ReservationKind.DIRECT_AND_SEASON,
        "access_type": AccessType.UNRESTRICTED,
        "reservation_form": ReservationFormType.CONTACT_INFO_FORM,
    }


def test_reservation_unit_admin__terms_validation__success():
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    reservation_unit = ReservationUnitFactory.create(
        payment_terms=payment_terms,
        cancellation_terms=cancellation_terms,
        service_specific_terms=service_specific_terms,
        pricing_terms=pricing_terms,
    )

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["reservation_kind"] = ReservationKind.SEASON
    data["pricing_terms"] = pricing_terms
    data["payment_terms"] = payment_terms
    data["cancellation_terms"] = cancellation_terms
    data["service_specific_terms"] = service_specific_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert form.is_valid(), form.errors


def test_reservation_unit_admin__terms_validation__pricing_terms_incorrect_type():
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.GENERIC)

    reservation_unit = ReservationUnitFactory.create(
        payment_terms=payment_terms,
        cancellation_terms=cancellation_terms,
        service_specific_terms=service_specific_terms,
        pricing_terms=pricing_terms,
    )

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["reservation_kind"] = ReservationKind.SEASON
    data["pricing_terms"] = wrong_terms
    data["payment_terms"] = payment_terms
    data["cancellation_terms"] = cancellation_terms
    data["service_specific_terms"] = service_specific_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()
    assert form.errors["pricing_terms"] == [
        "Select a valid choice. That choice is not one of the available choices.",
    ]


def test_reservation_unit_admin__terms_validation__payment_terms_incorrect_type():
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.GENERIC)

    reservation_unit = ReservationUnitFactory.create(
        payment_terms=payment_terms,
        cancellation_terms=cancellation_terms,
        service_specific_terms=service_specific_terms,
        pricing_terms=pricing_terms,
    )

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["reservation_kind"] = ReservationKind.SEASON
    data["pricing_terms"] = pricing_terms
    data["payment_terms"] = wrong_terms
    data["cancellation_terms"] = cancellation_terms
    data["service_specific_terms"] = service_specific_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()
    assert form.errors["payment_terms"] == [
        "Select a valid choice. That choice is not one of the available choices.",
    ]


def test_reservation_unit_admin__terms_validation__cancellation_terms_incorrect_type():
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.GENERIC)

    reservation_unit = ReservationUnitFactory.create(
        payment_terms=payment_terms,
        cancellation_terms=cancellation_terms,
        service_specific_terms=service_specific_terms,
        pricing_terms=pricing_terms,
    )

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["reservation_kind"] = ReservationKind.SEASON
    data["pricing_terms"] = pricing_terms
    data["payment_terms"] = payment_terms
    data["cancellation_terms"] = wrong_terms
    data["service_specific_terms"] = service_specific_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()
    assert form.errors["cancellation_terms"] == [
        "Select a valid choice. That choice is not one of the available choices.",
        "Cancellation terms are required for direct booking",
    ]


def test_reservation_unit_admin__terms_validation__service_specific_terms_incorrect_type():
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.GENERIC)

    reservation_unit = ReservationUnitFactory.create(
        payment_terms=payment_terms,
        cancellation_terms=cancellation_terms,
        service_specific_terms=service_specific_terms,
        pricing_terms=pricing_terms,
    )

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["reservation_kind"] = ReservationKind.SEASON
    data["pricing_terms"] = pricing_terms
    data["payment_terms"] = payment_terms
    data["cancellation_terms"] = cancellation_terms
    data["service_specific_terms"] = wrong_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()
    assert form.errors["service_specific_terms"] == [
        "Select a valid choice. That choice is not one of the available choices.",
        "Service specific terms are required for direct booking",
    ]


def test_reservation_unit_admin__terms_validation__no_cancellation_terms_for_direct_booking():
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    reservation_unit = ReservationUnitFactory.create(
        payment_terms=payment_terms,
        cancellation_terms=cancellation_terms,
        service_specific_terms=service_specific_terms,
        pricing_terms=pricing_terms,
    )

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["pricing_terms"] = pricing_terms
    data["payment_terms"] = payment_terms
    data["cancellation_terms"] = None
    data["service_specific_terms"] = service_specific_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()
    assert form.errors["cancellation_terms"] != [
        "Cancellation terms are required for direct booking",
    ]


def test_reservation_unit_admin__terms_validation__no_service_specific_terms_for_direct_booking():
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    reservation_unit = ReservationUnitFactory.create(
        payment_terms=payment_terms,
        cancellation_terms=cancellation_terms,
        service_specific_terms=service_specific_terms,
        pricing_terms=pricing_terms,
    )

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["pricing_terms"] = pricing_terms
    data["payment_terms"] = payment_terms
    data["cancellation_terms"] = cancellation_terms
    data["service_specific_terms"] = None

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()
    assert form.errors["service_specific_terms"] != [
        "Service specific terms are required for direct booking",
    ]


def test_reservation_unit_admin__terms_validation__no_pricing_terms_for_direct_booking_when_free_of_change_is_set():
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    reservation_unit = ReservationUnitFactory.create(
        payment_terms=payment_terms,
        cancellation_terms=cancellation_terms,
        service_specific_terms=service_specific_terms,
        pricing_terms=pricing_terms,
    )

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["can_apply_free_of_charge"] = True
    data["pricing_terms"] = None
    data["payment_terms"] = payment_terms
    data["cancellation_terms"] = cancellation_terms
    data["service_specific_terms"] = service_specific_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()
    assert form.errors["pricing_terms"] == [
        "Pricing terms are required for direct booking if the reservee can apply for free of charge",
    ]


def test_reservation_unit_admin__terms_validation__no_payment_terms_for_direct_booking_when_paid():
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)
    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)
    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    reservation_unit = ReservationUnitFactory.create(
        payment_terms=payment_terms,
        cancellation_terms=cancellation_terms,
        service_specific_terms=service_specific_terms,
        pricing_terms=pricing_terms,
    )

    pricings = ReservationUnitPricingFactory.create(reservation_unit=reservation_unit, highest_price=Decimal(10))

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")
    request.user = UserFactory.create_superuser()

    data = get_valid_data(reservation_unit=reservation_unit)
    data["pricing_terms"] = pricing_terms
    data["payment_terms"] = None
    data["cancellation_terms"] = cancellation_terms
    data["service_specific_terms"] = service_specific_terms

    data |= management_form_data("pricings", total_forms=1, initial_forms=1)
    data["pricings-0-id"] = pricings.id
    data["pricings-0-begins"] = pricings.begins.isoformat()
    data["pricings-0-is_activated_on_begins"] = pricings.is_activated_on_begins
    data["pricings-0-lowest_price"] = pricings.lowest_price
    data["pricings-0-highest_price"] = pricings.highest_price
    data["pricings-0-price_unit"] = pricings.price_unit.value
    data["pricings-0-payment_type"] = pricings.payment_type.value
    data["pricings-0-tax_percentage"] = pricings.tax_percentage.id

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())

    inlines = reservation_unit_admin.get_inline_instances(request, obj=reservation_unit)
    formset = next(
        (
            inline.get_formset(request, obj=reservation_unit)
            for inline in inlines
            if inline.model == ReservationUnitPricing
        ),
        None,
    )
    assert formset is not None

    formset = formset(instance=reservation_unit, data=data)

    assert not formset.is_valid()
    assert formset.non_form_errors() == [
        "Payment terms are required for direct booking of paid reservation units",
    ]
