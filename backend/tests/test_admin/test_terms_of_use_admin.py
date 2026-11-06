from __future__ import annotations

from typing import TYPE_CHECKING, Any

import pytest

from tilavarauspalvelu.admin.terms_of_use.admin import TermsOfUseAdminForm
from tilavarauspalvelu.enums import TermsOfUseTypeChoices

from tests.factories import ApplicationRoundFactory, ReservationUnitFactory, TermsOfUseFactory

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TermsOfUse

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def form_data(terms_of_use: TermsOfUse, *, terms_type: TermsOfUseTypeChoices) -> dict[str, Any]:
    return {
        "id": terms_of_use.id,
        "name": terms_of_use.name,
        "text": terms_of_use.text,
        "terms_type": terms_type,
    }


# ── Terms type change ──


def test_terms_of_use_admin__terms_type__can_change_when_not_in_use():
    terms_of_use = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT)

    data = form_data(terms_of_use, terms_type=TermsOfUseTypeChoices.PRICING)
    form = TermsOfUseAdminForm(instance=terms_of_use, data=data)

    assert form.is_valid(), form.errors
    form.save()

    terms_of_use.refresh_from_db()
    assert terms_of_use.terms_type == TermsOfUseTypeChoices.PRICING


def test_terms_of_use_admin__terms_type__other_fields_can_change_when_in_use():
    terms_of_use = TermsOfUseFactory.create(name="Old name", terms_type=TermsOfUseTypeChoices.PRICING)
    ReservationUnitFactory.create(pricing_terms=terms_of_use)

    data = form_data(terms_of_use, terms_type=TermsOfUseTypeChoices.PRICING)
    data["name"] = "New name"
    form = TermsOfUseAdminForm(instance=terms_of_use, data=data)

    assert form.is_valid(), form.errors
    form.save()

    terms_of_use.refresh_from_db()
    assert terms_of_use.name == "New name"


def test_terms_of_use_admin__terms_type__cannot_change_when_used_by_reservation_unit():
    terms_of_use = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    ReservationUnitFactory.create(pricing_terms=terms_of_use)

    data = form_data(terms_of_use, terms_type=TermsOfUseTypeChoices.PAYMENT)
    form = TermsOfUseAdminForm(instance=terms_of_use, data=data)

    assert not form.is_valid()
    assert form.errors["terms_type"] == [
        "Terms type cannot be changed while reservation units or application rounds use these terms.",
    ]

    terms_of_use.refresh_from_db()
    assert terms_of_use.terms_type == TermsOfUseTypeChoices.PRICING


def test_terms_of_use_admin__terms_type__cannot_change_when_used_by_application_round():
    terms_of_use = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.RECURRING)
    ApplicationRoundFactory.create(terms_of_use=terms_of_use)

    data = form_data(terms_of_use, terms_type=TermsOfUseTypeChoices.GENERIC)
    form = TermsOfUseAdminForm(instance=terms_of_use, data=data)

    assert not form.is_valid()
    assert form.errors["terms_type"] == [
        "Terms type cannot be changed while reservation units or application rounds use these terms.",
    ]

    terms_of_use.refresh_from_db()
    assert terms_of_use.terms_type == TermsOfUseTypeChoices.RECURRING
