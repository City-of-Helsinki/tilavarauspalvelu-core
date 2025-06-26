from __future__ import annotations

import pytest
from django.contrib.admin import AdminSite
from django.test import RequestFactory

from tilavarauspalvelu.admin.reservation_unit.admin import ReservationUnitAdmin
from tilavarauspalvelu.enums import (
    AccessType,
    ReservationFormType,
    ReservationKind,
    ReservationStartInterval,
    TermsOfUseTypeChoices,
)
from tilavarauspalvelu.models import ReservationUnit

from tests.factories import ReservationUnitFactory, TermsOfUseFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def get_valid_data(reservation_unit: ReservationUnit):
    return {
        "unit": reservation_unit.unit.pk,
        "name_fi": reservation_unit.name_fi,
        "description": reservation_unit.description,
        "reservation_start_interval": ReservationStartInterval.INTERVAL_15_MINUTES.value,
        "authentication": "weak",
        "reservation_kind": ReservationKind.DIRECT_AND_SEASON,
        "access_type": AccessType.UNRESTRICTED,
        "reservation_form": ReservationFormType.CONTACT_INFO_FORM,
    }


def test_reservation_unit_admin__terms_validation__pricing_terms__accepts_type_pricing():
    reservation_unit = ReservationUnitFactory.create()

    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["pricing_terms"] = pricing_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert form.is_valid(), form.errors


def test_reservation_unit_admin__terms_validation__pricing_terms__errors_when_type_not_pricing():
    reservation_unit = ReservationUnitFactory.create()

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.GENERIC)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["pricing_terms"] = wrong_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid(), form.errors


def test_reservation_unit_admin__terms_validation__payment_terms__accepts_type_payment():
    reservation_unit = ReservationUnitFactory.create()

    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["payment_terms"] = payment_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert form.is_valid(), form.errors


def test_reservation_unit_admin__terms_validation__payment_terms__errors_when_type_not_payment():
    reservation_unit = ReservationUnitFactory.create()

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.GENERIC)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["payment_terms"] = wrong_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid(), form.errors


def test_reservation_unit_admin__terms_validation__cancellation_terms__accepts_type_cancellation():
    reservation_unit = ReservationUnitFactory.create()

    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["cancellation_terms"] = cancellation_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert form.is_valid(), form.errors


def test_reservation_unit_admin__terms_validation__cancellation_terms__errors_when_type_not_cancellation():
    reservation_unit = ReservationUnitFactory.create()

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.GENERIC)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["cancellation_terms"] = wrong_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid(), form.errors


def test_reservation_unit_admin__terms_validation__service_specific_terms__accepts_type_service():
    reservation_unit = ReservationUnitFactory.create()

    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["service_specific_terms"] = service_specific_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert form.is_valid(), form.errors


def test_reservation_unit_admin__terms_validation__service_specific_terms__errors_when_type_not_service():
    reservation_unit = ReservationUnitFactory.create()

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.GENERIC)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data(reservation_unit=reservation_unit)
    data["service_specific_terms"] = wrong_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid(), form.errors
