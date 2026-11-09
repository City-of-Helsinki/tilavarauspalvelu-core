from __future__ import annotations

from typing import TYPE_CHECKING, Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.models import SalesItem

from tests.factories import SalesItemFactory, TaxLevelFactory, UserFactory
from tests.test_admin.helpers import collect_admin_form_errors

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TaxLevel

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def sales_item_form_data(*, tax_level: TaxLevel, material: str) -> dict[str, Any]:
    return {
        "name": "Muut tilavuokrat alv 25.5 %",
        "tax_level": tax_level.pk,
        "main_ledger_account": "340025",
        "material": material,
    }


# ── Material ──


def test_sales_item_admin__add(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tax_level = TaxLevelFactory.create()

    url = reverse("admin:tilavarauspalvelu_salesitem_add")
    data = sales_item_form_data(tax_level=tax_level, material="10000116")
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    sales_item = SalesItem.objects.get()
    assert sales_item.name == "Muut tilavuokrat alv 25.5 %"
    assert sales_item.tax_level == tax_level
    assert sales_item.main_ledger_account == "340025"
    assert sales_item.material == "10000116"


def test_sales_item_admin__material_is_optional(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tax_level = TaxLevelFactory.create()
    SalesItemFactory.create(material="")

    url = reverse("admin:tilavarauspalvelu_salesitem_add")
    data = sales_item_form_data(tax_level=tax_level, material="")
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    assert list(SalesItem.objects.values_list("material", flat=True)) == ["", ""]


def test_sales_item_admin__material_is_unique(api_client):
    api_client.force_login(UserFactory.create_superuser())
    tax_level = TaxLevelFactory.create()
    SalesItemFactory.create(material="10000116")

    url = reverse("admin:tilavarauspalvelu_salesitem_add")
    data = sales_item_form_data(tax_level=tax_level, material="10000116")

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Another sales item already has this material",
        },
    ]
    assert SalesItem.objects.count() == 1
