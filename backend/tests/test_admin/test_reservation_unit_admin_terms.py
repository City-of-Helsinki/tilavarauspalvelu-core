from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from django.contrib.admin import AdminSite
from django.test import RequestFactory
from django.urls import reverse

from tilavarauspalvelu.admin.reservation_unit.admin import ReservationUnitAdmin
from tilavarauspalvelu.enums import (
    AccessType,
    AuthenticationType,
    ReservationFormType,
    ReservationKind,
    ReservationStartInterval,
    TermsOfUseTypeChoices,
)
from tilavarauspalvelu.models import ReservationUnit
from utils.date_utils import local_date

from tests.factories import (
    PriceComponentFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    TermsOfUseFactory,
    UserFactory,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TermsOfUse

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
    assert form.errors["cancellation_terms"] == [
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
    assert form.errors["service_specific_terms"] == [
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
    reservation_unit = create_reservation_unit_with_price(amount=Decimal(10))

    form = create_admin_form(reservation_unit=reservation_unit, payment_terms=None)

    assert not form.is_valid()
    assert form.errors["payment_terms"] == [
        "Payment terms are required for direct booking of paid reservation units",
    ]


def test_reservation_unit_admin__terms_validation__no_payment_terms_for_direct_booking_when_free():
    reservation_unit = create_reservation_unit_with_price(amount=Decimal(0))

    form = create_admin_form(reservation_unit=reservation_unit, payment_terms=None)

    assert form.is_valid(), form.errors


def test_reservation_unit_admin__terms_validation__no_payment_terms_for_direct_booking_when_paid_price_has_ended():
    reservation_unit = create_reservation_unit_with_price(
        amount=Decimal(10),
        valid_until=local_date() - datetime.timedelta(days=1),
    )

    form = create_admin_form(reservation_unit=reservation_unit, payment_terms=None)

    assert form.is_valid(), form.errors


# ── Pricing groups ──


def test_reservation_unit_admin__pricing_groups__link_to_pricing_group(api_client):
    reservation_unit = create_reservation_unit_with_price(amount=Decimal(10))
    pricing_group_row = reservation_unit.reservation_unit_pricing_groups.get()
    api_client.force_login(UserFactory.create_superuser())

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    response = api_client.get(url)

    assert response.status_code == 200
    pricing_group_url = reverse(
        "admin:tilavarauspalvelu_pricinggroup_change", args=[pricing_group_row.pricing_group_id]
    )
    assert f'href="{pricing_group_url}"' in response.content.decode()


# ── Helpers ──


def create_reservation_unit_with_price(
    *,
    amount: Decimal,
    valid_until: datetime.date | None = None,
) -> ReservationUnit:
    reservation_unit = ReservationUnitFactory.create(
        payment_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT),
        cancellation_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION),
        service_specific_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE),
        pricing_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING),
    )
    begins = local_date() - datetime.timedelta(days=30)
    pricing_group = PricingGroupFactory.create(unit_group=None)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=begins,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=begins,
        valid_until=valid_until,
        amount=amount,
    )
    return reservation_unit


def create_admin_form(*, reservation_unit: ReservationUnit, payment_terms: TermsOfUse | None):
    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")
    request.user = UserFactory.create_superuser()

    data = get_valid_data(reservation_unit=reservation_unit)
    data["pricing_terms"] = reservation_unit.pricing_terms
    data["payment_terms"] = payment_terms
    data["cancellation_terms"] = reservation_unit.cancellation_terms
    data["service_specific_terms"] = reservation_unit.service_specific_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    return ReservationUnitModelForm(instance=reservation_unit, data=data)
