from __future__ import annotations

import datetime
from decimal import Decimal
from typing import Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.enums import PaymentType, PriceUnit
from tilavarauspalvelu.models import ReservationUnitPricing, TaxLevel, TaxLevelRate
from utils.date_utils import local_date

from tests.factories import ReservationUnitFactory, TaxLevelFactory, TaxLevelRateFactory, UserFactory
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

    tax_level = TaxLevelFactory.create(rates__begins=local_date(), rates__percentage=Decimal(24))
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


def test_tax_level_admin__rates__add_view_shows_one_empty_rate(api_client):
    api_client.force_login(UserFactory.create_superuser())

    url = reverse("admin:tilavarauspalvelu_taxlevel_add")
    response = api_client.get(path=url)

    assert response.status_code == 200

    formset = response.context["inline_admin_formsets"][0].formset
    assert formset.total_form_count() == 1


def test_tax_level_admin__rates__change_view_shows_no_empty_rates(api_client):
    api_client.force_login(UserFactory.create_superuser())

    tax_level = TaxLevelFactory.create()

    url = reverse("admin:tilavarauspalvelu_taxlevel_change", args=[tax_level.pk])
    response = api_client.get(path=url)

    assert response.status_code == 200

    formset = response.context["inline_admin_formsets"][0].formset
    assert formset.total_form_count() == 1
    assert formset.initial_form_count() == 1


# ── Locked rates ──


def test_tax_level_admin__locked_rates__show_rate_that_began_yesterday_as_text(api_client):
    api_client.force_login(UserFactory.create_superuser())
    yesterday = local_date() - datetime.timedelta(days=1)

    tax_level = TaxLevelFactory.create(rates__begins=yesterday, rates__percentage=Decimal(24))

    url = reverse("admin:tilavarauspalvelu_taxlevel_change", args=[tax_level.pk])
    response = api_client.get(path=url)

    assert response.status_code == 200

    form = response.context["inline_admin_formsets"][0].formset.forms[0]
    assert str(form["begins"]) == f"<p>{yesterday.strftime('%d.%m.%Y')}</p>"
    assert str(form["percentage"]) == "<p>24.00</p>"
    assert str(form["DELETE"]) == '<input type="hidden" name="rates-0-DELETE" disabled id="id_rates-0-DELETE">'


def test_tax_level_admin__locked_rates__change_rate_that_began_yesterday(api_client):
    api_client.force_login(UserFactory.create_superuser())
    yesterday = local_date() - datetime.timedelta(days=1)
    two_days_ago = local_date() - datetime.timedelta(days=2)

    tax_level = TaxLevelFactory.create(rates__begins=yesterday, rates__percentage=Decimal(24))
    rate = tax_level.rates.get()

    url = reverse("admin:tilavarauspalvelu_taxlevel_change", args=[tax_level.pk])
    data = {
        **tax_level_form_data(tax_level),
        **existing_rate_form_data(0, rate),
        "rates-0-begins": two_days_ago.isoformat(),
        "rates-0-percentage": "30",
        **management_form_data("rates", total_forms=1, initial_forms=1),
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    rates = list(TaxLevelRate.objects.filter(tax_level=tax_level).values_list("begins", "percentage"))
    assert rates == [(yesterday, Decimal(24))]


def test_tax_level_admin__locked_rates__delete_rate_that_began_yesterday(api_client):
    api_client.force_login(UserFactory.create_superuser())
    yesterday = local_date() - datetime.timedelta(days=1)

    tax_level = TaxLevelFactory.create(rates__begins=yesterday, rates__percentage=Decimal(24))
    rate = tax_level.rates.get()

    url = reverse("admin:tilavarauspalvelu_taxlevel_change", args=[tax_level.pk])
    data = {
        **tax_level_form_data(tax_level),
        **existing_rate_form_data(0, rate, delete=True),
        "rates-1-tax_level": tax_level.pk,
        "rates-1-begins": local_date().isoformat(),
        "rates-1-percentage": "25.5",
        **management_form_data("rates", total_forms=2, initial_forms=1),
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    rates = list(TaxLevelRate.objects.filter(tax_level=tax_level).values_list("begins", "percentage"))
    assert rates == [
        (yesterday, Decimal(24)),
        (local_date(), Decimal("25.5")),
    ]


def test_tax_level_admin__locked_rates__change_rate_that_begins_today(api_client):
    api_client.force_login(UserFactory.create_superuser())

    tax_level = TaxLevelFactory.create(rates__begins=local_date(), rates__percentage=Decimal(24))
    rate = tax_level.rates.get()

    url = reverse("admin:tilavarauspalvelu_taxlevel_change", args=[tax_level.pk])
    data = {
        **tax_level_form_data(tax_level),
        **existing_rate_form_data(0, rate),
        "rates-0-percentage": "25.5",
        **management_form_data("rates", total_forms=1, initial_forms=1),
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    rates = list(TaxLevelRate.objects.filter(tax_level=tax_level).values_list("begins", "percentage"))
    assert rates == [(local_date(), Decimal("25.5"))]


# ── List ──


def test_tax_level_admin__list__current_and_next_percentage(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tomorrow = local_date() + datetime.timedelta(days=1)
    next_week = local_date() + datetime.timedelta(days=7)

    tax_level = TaxLevelFactory.create(rates__percentage=Decimal(24))
    TaxLevelRateFactory.create(tax_level=tax_level, begins=next_week, percentage=Decimal(30))
    TaxLevelRateFactory.create(tax_level=tax_level, begins=tomorrow, percentage=Decimal("25.5"))

    url = reverse("admin:tilavarauspalvelu_taxlevel_changelist")
    response = api_client.get(path=url)

    assert response.status_code == 200

    model_admin = response.context["cl"].model_admin
    rows = [
        [
            model_admin.current_percentage(tax_level),
            model_admin.next_percentage(tax_level),
            model_admin.next_percentage_begins(tax_level),
        ]
        for tax_level in response.context["cl"].result_list
    ]
    assert rows == [["24.00%", "25.50%", tomorrow]]


def test_tax_level_admin__list__no_next_percentage(api_client):
    api_client.force_login(UserFactory.create_superuser())

    TaxLevelFactory.create(rates__percentage=Decimal(24))

    url = reverse("admin:tilavarauspalvelu_taxlevel_changelist")
    response = api_client.get(path=url)

    assert response.status_code == 200

    model_admin = response.context["cl"].model_admin
    rows = [
        [
            model_admin.current_percentage(tax_level),
            model_admin.next_percentage(tax_level),
            model_admin.next_percentage_begins(tax_level),
        ]
        for tax_level in response.context["cl"].result_list
    ]
    assert rows == [["24.00%", "-", None]]


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
