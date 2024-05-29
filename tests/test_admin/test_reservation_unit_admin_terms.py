import pytest
from django.contrib.admin import AdminSite
from django.test import RequestFactory

from reservation_units.admin.reservation_unit import ReservationUnitAdmin
from reservation_units.enums import ReservationKind, ReservationStartInterval
from reservation_units.models import ReservationUnit
from terms_of_use.models import TermsOfUse
from tests.factories import ReservationUnitFactory, TermsOfUseFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def get_valid_data():
    return {
        "name": "test",
        "description": "testing besthing",
        "reservation_start_interval": ReservationStartInterval.INTERVAL_15_MINUTES.value,
        "authentication": "weak",
        "reservation_kind": ReservationKind.DIRECT_AND_SEASON,
    }


def test_reservation_unit_admin__terms_validation__pricing_terms__accepts_type_pricing():
    reservation_unit = ReservationUnitFactory.create()

    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUse.TERMS_TYPE_PRICING)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data()
    data["pricing_terms"] = pricing_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert form.is_valid()


def test_reservation_unit_admin__terms_validation__pricing_terms__errors_when_type_not_pricing():
    reservation_unit = ReservationUnitFactory.create()

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUse.TERMS_TYPE_GENERIC)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data()
    data["pricing_terms"] = wrong_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()


def test_reservation_unit_admin__terms_validation__payment_terms__accepts_type_payment():
    reservation_unit = ReservationUnitFactory.create()

    payment_terms = TermsOfUseFactory.create(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data()
    data["payment_terms"] = payment_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert form.is_valid()


def test_reservation_unit_admin__terms_validation__payment_terms__errors_when_type_not_payment():
    reservation_unit = ReservationUnitFactory.create()

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUse.TERMS_TYPE_GENERIC)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data()
    data["payment_terms"] = wrong_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()


def test_reservation_unit_admin__terms_validation__cancellation_terms__accepts_type_cancellation():
    reservation_unit = ReservationUnitFactory.create()

    cancellation_terms = TermsOfUseFactory.create(terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data()
    data["cancellation_terms"] = cancellation_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert form.is_valid()


def test_reservation_unit_admin__terms_validation__cancellation_terms__errors_when_type_not_cancellation():
    reservation_unit = ReservationUnitFactory.create()

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUse.TERMS_TYPE_GENERIC)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data()
    data["cancellation_terms"] = wrong_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()


def test_reservation_unit_admin__terms_validation__service_specific_terms__accepts_type_service():
    reservation_unit = ReservationUnitFactory.create()

    service_specific_terms = TermsOfUseFactory.create(terms_type=TermsOfUse.TERMS_TYPE_SERVICE)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data()
    data["service_specific_terms"] = service_specific_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert form.is_valid()


def test_reservation_unit_admin__terms_validation__service_specific_terms__errors_when_type_not_service():
    reservation_unit = ReservationUnitFactory.create()

    wrong_terms = TermsOfUseFactory.create(terms_type=TermsOfUse.TERMS_TYPE_GENERIC)

    request = RequestFactory().get(f"/admin/reservation_units/reservationunit/{reservation_unit.id}/change/")

    data = get_valid_data()
    data["service_specific_terms"] = wrong_terms

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
    ReservationUnitModelForm = reservation_unit_admin.get_form(request, obj=reservation_unit)
    form = ReservationUnitModelForm(instance=reservation_unit, data=data)

    assert not form.is_valid()
