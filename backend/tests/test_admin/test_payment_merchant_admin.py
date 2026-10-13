from __future__ import annotations

import pytest
from django.contrib import messages
from django.contrib.messages import get_messages
from django.urls import reverse

from tilavarauspalvelu.admin.payment_merchant.admin import MERCHANT_INFO_MISSING_MESSAGE
from tilavarauspalvelu.integrations.verkkokauppa.merchants.exceptions import GetMerchantError
from tilavarauspalvelu.integrations.verkkokauppa.merchants.types import MerchantInfo
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import PaymentMerchant

from tests.factories import PaymentMerchantFactory, UserFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Change page ──


@patch_method(
    VerkkokauppaAPIClient.get_merchant,
    return_value=MerchantInfo(
        name="Merchant",
        street="Street 1",
        zip="00100",
        city="Helsinki",
        email="merchant@example.com",
        phone="+358 40 123 4567",
        url="https://example.com",
        tos_url="https://example.com/tos",
        business_id="1234567-8",
        shop_id="shop",
    ),
)
def test_payment_merchant_admin__change_page__shows_merchant_info(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    merchant = PaymentMerchantFactory.create()

    url = reverse("admin:tilavarauspalvelu_paymentmerchant_change", args=[merchant.pk])
    response = api_client.get(url)

    assert response.status_code == 200

    form = response.context["adminform"].form
    assert form.fields["shop_id"].initial == "shop"
    assert form.fields["shop_id"].disabled is False
    assert list(get_messages(response.wsgi_request)) == []


@patch_method(VerkkokauppaAPIClient.get_merchant, return_value=None)
def test_payment_merchant_admin__change_page__merchant_not_found(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    merchant = PaymentMerchantFactory.create()

    url = reverse("admin:tilavarauspalvelu_paymentmerchant_change", args=[merchant.pk])
    response = api_client.get(url)

    assert response.status_code == 200

    form = response.context["adminform"].form
    assert all(field.disabled for field in form.fields.values())

    message_levels = [message.level for message in get_messages(response.wsgi_request)]
    assert message_levels == [messages.WARNING]


@patch_method(VerkkokauppaAPIClient.get_merchant, side_effect=GetMerchantError("Fetching merchant failed"))
def test_payment_merchant_admin__change_page__merchant_api_fails(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    merchant = PaymentMerchantFactory.create()

    url = reverse("admin:tilavarauspalvelu_paymentmerchant_change", args=[merchant.pk])
    response = api_client.get(url)

    assert response.status_code == 200

    form = response.context["adminform"].form
    assert all(field.disabled for field in form.fields.values())

    message_levels = [message.level for message in get_messages(response.wsgi_request)]
    assert message_levels == [messages.WARNING]


# ── Saving ──


@patch_method(VerkkokauppaAPIClient.get_merchant, return_value=None)
def test_payment_merchant_admin__save__blocked_when_merchant_not_found(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    merchant = PaymentMerchantFactory.create(name="Original name")

    url = reverse("admin:tilavarauspalvelu_paymentmerchant_change", args=[merchant.pk])
    with patch_method(VerkkokauppaAPIClient.update_merchant) as update_merchant:
        response = api_client.post(url, data={"name": "New name"})

    assert response.status_code == 200
    assert update_merchant.called is False

    errors = response.context["adminform"].form.non_field_errors().as_data()
    assert [error.message for error in errors] == [MERCHANT_INFO_MISSING_MESSAGE]

    merchant = PaymentMerchant.objects.get(pk=merchant.pk)
    assert merchant.name == "Original name"
