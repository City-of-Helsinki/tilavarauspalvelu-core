from __future__ import annotations

import os
from typing import Any

from django.conf import settings
from django.core.management import BaseCommand, CommandError
from django.db import models, transaction

from tilavarauspalvelu.integrations.verkkokauppa.merchants.types import CreateMerchantParams
from tilavarauspalvelu.integrations.verkkokauppa.product.exceptions import CreateProductError
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import PaymentMerchant, PaymentProduct, ReservationUnit, Unit

from .data_creation.create_reservation_related_things import TEST_PAYMENT_MERCHANT_NAME


class Command(BaseCommand):
    help = (
        "Makes sure that the test payment merchant from 'create_test_data' exists in Verkkokauppa, "
        "and creates a Verkkokauppa product for each paid reservation unit that uses the merchant. "
        "If the merchant does not exist in Verkkokauppa, creates a new one and moves the units to it. "
        "Runs only in the dev environment."
    )

    def handle(self, *args: Any, **options: Any) -> None:
        if os.getenv("DJANGO_SETTINGS_ENVIRONMENT") != "Development":
            msg = "This command changes the payment merchant of units, so it can run only in the dev environment."
            raise CommandError(msg)

        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            msg = "The Verkkokauppa API is mocked, so there is nothing to refresh."
            raise CommandError(msg)

        merchant = PaymentMerchant.objects.filter(name=TEST_PAYMENT_MERCHANT_NAME).first()
        if merchant is None:
            msg = f"No payment merchant '{TEST_PAYMENT_MERCHANT_NAME}'. Run 'create_test_data' first."
            raise CommandError(msg)

        merchant_info = VerkkokauppaAPIClient.get_merchant(merchant_uuid=merchant.id)
        if merchant_info is None:
            self.stdout.write(f"Merchant {merchant.id} does not exist in Verkkokauppa. Creating a new one.")
            merchant = _replace_merchant_with_new_verkkokauppa_merchant(old_merchant=merchant)
            self.stdout.write(
                f"Created merchant {merchant.id}. "
                f"Update 'TEST_PAYMENT_MERCHANT_ID' to this value, so that 'create_test_data' uses it."
            )

        reservation_units = ReservationUnit.objects.filter(
            models.Q(payment_merchant=merchant)
            | models.Q(payment_merchant__isnull=True, unit__payment_merchant=merchant)
        ).select_related("payment_merchant", "payment_product", "unit__payment_merchant")

        failed_pks: list[int] = []
        for reservation_unit in reservation_units:
            try:
                reservation_unit.actions.refresh_reservation_unit_product_mapping()
            except CreateProductError as error:
                failed_pks.append(reservation_unit.pk)
                self.stderr.write(f"Reservation unit {reservation_unit.pk}: {error}")

        self.stdout.write(f"Refreshed the products of {len(reservation_units) - len(failed_pks)} reservation units.")
        if failed_pks:
            msg = f"Could not create a product for reservation units: {failed_pks}"
            raise CommandError(msg)


# Internals


def _replace_merchant_with_new_verkkokauppa_merchant(*, old_merchant: PaymentMerchant) -> PaymentMerchant:
    params = CreateMerchantParams(
        name=TEST_PAYMENT_MERCHANT_NAME,
        street="Testikatu 1",
        zip="99999",
        city="Korvatunturi",
        email="testi.osoite@osoite.fi",
        phone="+358 50 123 4567",
        url="https://varaamo.dev.hel.ninja/",
        tos_url="https://varaamo.dev.hel.ninja/v1/terms_of_use_pdf/",
        # The merchants that work in the Verkkokauppa test environment use these values.
        business_id="0201256-6",
        shop_id="1071053",
        paytrail_merchant_id="1071053",
    )
    api_merchant = VerkkokauppaAPIClient.create_merchant(params=params)

    with transaction.atomic():
        new_merchant = PaymentMerchant.objects.create(id=api_merchant.id, name=TEST_PAYMENT_MERCHANT_NAME)
        Unit.objects.filter(payment_merchant=old_merchant).update(payment_merchant=new_merchant)
        ReservationUnit.objects.filter(payment_merchant=old_merchant).update(payment_merchant=new_merchant)
        PaymentProduct.objects.filter(merchant=old_merchant).update(merchant=new_merchant)
        old_merchant.delete()

    return new_merchant
