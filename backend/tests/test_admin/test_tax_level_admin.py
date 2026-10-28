from __future__ import annotations

import datetime
from decimal import Decimal
from typing import Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.models import TaxLevel, TaxLevelRate
from utils.date_utils import local_date

from tests.factories import TaxLevelFactory, UserFactory
from tests.test_admin.helpers import collect_admin_form_errors, management_form_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def tax_level_form_data(tax_level: TaxLevel) -> dict[str, Any]:
    return {
        "name": tax_level.name,
        "name_fi": tax_level.name_fi,
        "name_en": tax_level.name_en,
        "name_sv": tax_level.name_sv,
    }


def existing_rate_form_data(index: int, rate: TaxLevelRate, *, delete: bool = False) -> dict[str, Any]:
    data = {
        f"rates-{index}-id": rate.pk,
        f"rates-{index}-tax_level": rate.tax_level.pk,
        f"rates-{index}-begins": rate.begins.isoformat(),
        f"rates-{index}-percentage": str(rate.percentage),
    }
    if delete:
        data[f"rates-{index}-DELETE"] = "on"
    return data


# ── Tax level rates ──


def test_tax_level_admin__rates__add_future_rate(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tomorrow = local_date() + datetime.timedelta(days=1)

    tax_level = TaxLevelFactory.create(rates__percentage=Decimal(24))
    rate = tax_level.rates.get()

    url = reverse("admin:tilavarauspalvelu_taxlevel_change", args=[tax_level.pk])
    data = {
        **tax_level_form_data(tax_level),
        **existing_rate_form_data(0, rate),
        "rates-1-tax_level": tax_level.pk,
        "rates-1-begins": tomorrow.isoformat(),
        "rates-1-percentage": "25.5",
        **management_form_data("rates", total_forms=2, initial_forms=1),
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    rates = list(TaxLevelRate.objects.filter(tax_level=tax_level).values_list("begins", "percentage"))
    assert rates == [
        (rate.begins, Decimal(24)),
        (tomorrow, Decimal("25.5")),
    ]


def test_tax_level_admin__rates__add_two_rates_with_same_date(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tomorrow = local_date() + datetime.timedelta(days=1)

    tax_level = TaxLevelFactory.create(rates__percentage=Decimal(24))
    rate = tax_level.rates.get()

    url = reverse("admin:tilavarauspalvelu_taxlevel_change", args=[tax_level.pk])
    data = {
        **tax_level_form_data(tax_level),
        **existing_rate_form_data(0, rate),
        "rates-1-tax_level": tax_level.pk,
        "rates-1-begins": tomorrow.isoformat(),
        "rates-1-percentage": "25.5",
        "rates-2-tax_level": tax_level.pk,
        "rates-2-begins": tomorrow.isoformat(),
        "rates-2-percentage": "27",
        **management_form_data("rates", total_forms=3, initial_forms=1),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Please correct the duplicate data for begins.",
        },
        {
            "code": "",
            "message": "Please correct the duplicate values below.",
        },
    ]

    rates = list(TaxLevelRate.objects.filter(tax_level=tax_level).values_list("begins", "percentage"))
    assert rates == [(rate.begins, Decimal(24))]


def test_tax_level_admin__rates__delete_only_rate_in_effect_today(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tomorrow = local_date() + datetime.timedelta(days=1)

    tax_level = TaxLevelFactory.create(rates__percentage=Decimal(24))
    rate = tax_level.rates.get()

    url = reverse("admin:tilavarauspalvelu_taxlevel_change", args=[tax_level.pk])
    data = {
        **tax_level_form_data(tax_level),
        **existing_rate_form_data(0, rate, delete=True),
        "rates-1-tax_level": tax_level.pk,
        "rates-1-begins": tomorrow.isoformat(),
        "rates-1-percentage": "25.5",
        **management_form_data("rates", total_forms=2, initial_forms=1),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "At least one rate in effect today is required.",
        },
    ]

    rates = list(TaxLevelRate.objects.filter(tax_level=tax_level).values_list("begins", "percentage"))
    assert rates == [(rate.begins, Decimal(24))]


def test_tax_level_admin__rates__create_tax_level_with_future_rate_only(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tomorrow = local_date() + datetime.timedelta(days=1)

    url = reverse("admin:tilavarauspalvelu_taxlevel_add")
    data = {
        "name": "Uusi",
        "name_fi": "Uusi",
        "rates-0-begins": tomorrow.isoformat(),
        "rates-0-percentage": "14",
        **management_form_data("rates", total_forms=1),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "At least one rate in effect today is required.",
        },
    ]

    assert TaxLevel.objects.count() == 0
