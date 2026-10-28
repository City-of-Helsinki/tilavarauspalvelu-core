from __future__ import annotations

import datetime
from typing import Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.enums import AccessType, PaymentType, PriceUnit, TermsOfUseTypeChoices
from tilavarauspalvelu.models import ReservationUnitPricing
from utils.date_utils import local_date

from tests.factories import ReservationUnitFactory, TaxLevelFactory, TermsOfUseFactory, UserFactory
from tests.test_admin.helpers import (
    collect_admin_form_errors,
    management_form_data,
    required_reservation_unit_form_data,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Pricings ──


def test_tax_level_admin__pricing_admin__tax_level_without_rate_today(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tomorrow = local_date() + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create()
    tax_level = TaxLevelFactory.create(rates__begins=tomorrow)

    url = reverse("admin:tilavarauspalvelu_reservationunitpricing_add")
    data = {
        "reservation_unit": reservation_unit.pk,
        "begins": local_date().isoformat(),
        "lowest_price": "10",
        "highest_price": "20",
        "price_unit": PriceUnit.PER_HOUR.value,
        "payment_type": PaymentType.ONLINE.value,
        "tax_level": tax_level.pk,
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "This tax level has no rate in effect today.",
        },
    ]

    assert ReservationUnitPricing.objects.count() == 0


def test_tax_level_admin__reservation_unit_pricing_inline__tax_level_without_rate_today(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tomorrow = local_date() + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(
        pricing_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING),
        payment_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT),
        cancellation_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION),
        service_specific_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE),
    )
    tax_level = TaxLevelFactory.create(rates__begins=tomorrow)

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        **required_reservation_unit_form_data(reservation_unit),
        "pricings-0-begins": local_date().isoformat(),
        "pricings-0-lowest_price": "10",
        "pricings-0-highest_price": "20",
        "pricings-0-price_unit": PriceUnit.PER_HOUR.value,
        "pricings-0-payment_type": PaymentType.ONLINE.value,
        "pricings-0-tax_level": tax_level.pk,
        **management_form_data("pricings", total_forms=1),
        "access_types-0-access_type": AccessType.UNRESTRICTED.value,
        "access_types-0-begin_date": local_date().isoformat(),
        **management_form_data("access_types", total_forms=1),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "This tax level has no rate in effect today.",
        },
    ]

    assert ReservationUnitPricing.objects.count() == 0
