from __future__ import annotations

import hashlib
import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

from utils.date_utils import local_date


class PaymentProductMigrationError(Exception):
    pass


def add_reservation_units_and_sales_items_to_products(apps, schema_editor):
    """
    Give each product the reservation unit that uses it, and the sales item of the base price of that unit today.
    This is the sales item whose accounting verkkokauppa has for the product.
    The product ids do not change.
    """
    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    ReservationUnitPricingGroup = apps.get_model("tilavarauspalvelu", "ReservationUnitPricingGroup")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")
    PaymentProduct = apps.get_model("tilavarauspalvelu", "PaymentProduct")

    today = local_date()

    reservation_units = (
        ReservationUnit.objects
        .filter(payment_product__isnull=False)
        .select_related("payment_product")
        .order_by("pk")
    )
    products = []

    for reservation_unit in reservation_units:
        product = reservation_unit.payment_product
        product.reservation_unit_id = reservation_unit.pk

        pricing_group_row = (
            ReservationUnitPricingGroup.objects
            .filter(reservation_unit=reservation_unit, begins__lte=today)
            .order_by("-begins")
            .first()
        )
        if pricing_group_row is not None:
            # Many base prices can be in effect, such as one for each price option. The highest price is used.
            component = (
                PriceComponent.objects
                .filter(
                    models.Q(valid_until__isnull=True) | models.Q(valid_until__gt=today),
                    pricing_group=pricing_group_row.pricing_group_id,
                    kind="BASE",
                    valid_from__lte=today,
                    sales_item__isnull=False,
                )
                .order_by("-amount")
                .first()
            )
            if component is not None:
                product.sales_item_id = component.sales_item_id

        products.append(product)

    PaymentProduct.objects.bulk_update(products, fields=["reservation_unit", "sales_item"])


def link_products_of_old_merchants_to_their_reservation_units(apps, schema_editor):
    """
    Give the reservation unit to each product that no reservation unit uses.
    Such a product was made for an earlier merchant of the reservation unit. Verkkokauppa made its id
    from the namespace, the pk of the reservation unit and the id of the merchant, so the id tells the unit.
    """
    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    PaymentProduct = apps.get_model("tilavarauspalvelu", "PaymentProduct")

    products = list(PaymentProduct.objects.filter(reservation_unit__isnull=True).order_by("pk"))
    if not products:
        return

    reservation_unit_pks = list(ReservationUnit.objects.order_by("pk").values_list("pk", flat=True))

    unmatched_product_ids: list[str] = []
    for product in products:
        reservation_unit_pk = None
        if product.merchant_id is not None:
            reservation_unit_pk = next(
                (
                    pk
                    for pk in reservation_unit_pks
                    if verkkokauppa_product_id(entity_id=str(pk), merchant_id=str(product.merchant_id)) == product.pk
                ),
                None,
            )

        if reservation_unit_pk is None:
            unmatched_product_ids.append(str(product.pk))
            continue

        product.reservation_unit_id = reservation_unit_pk

    # Real payments are made only in production, so in other environments these products can be deleted by hand.
    if unmatched_product_ids:
        msg = f"No reservation unit found for payment products: {unmatched_product_ids}"
        raise PaymentProductMigrationError(msg)

    PaymentProduct.objects.bulk_update(products, fields=["reservation_unit"])


def verkkokauppa_product_id(*, entity_id: str, merchant_id: str) -> uuid.UUID:
    """The product id that verkkokauppa makes with Java 'UUID.nameUUIDFromBytes' in 'UUIDGenerator'."""
    first = _verkkokauppa_type3_uuid(namespace=settings.VERKKOKAUPPA_NAMESPACE, name=entity_id)
    return _verkkokauppa_type3_uuid(namespace=str(first), name=merchant_id)


def _verkkokauppa_type3_uuid(*, namespace: str, name: str) -> uuid.UUID:
    namespace_uuid = uuid.UUID(bytes=hashlib.md5(namespace.encode(), usedforsecurity=False).digest(), version=3)
    data = namespace_uuid.bytes + name.encode()
    return uuid.UUID(bytes=hashlib.md5(data, usedforsecurity=False).digest(), version=3)


def set_payment_products_of_reservation_units(apps, schema_editor):
    """
    Give each reservation unit one of its products, preferably one of its current merchant.
    Among equal products, the one with the lowest id is used.
    """
    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    PaymentProduct = apps.get_model("tilavarauspalvelu", "PaymentProduct")

    reservation_units = ReservationUnit.objects.select_related("unit").order_by("pk")
    merchant_ids = {
        reservation_unit.pk: reservation_unit.payment_merchant_id or reservation_unit.unit.payment_merchant_id
        for reservation_unit in reservation_units
    }

    product_ids_by_reservation_unit: dict[int, object] = {}
    products = list(PaymentProduct.objects.order_by("pk").values_list("pk", "reservation_unit_id", "merchant_id"))
    for product_id, reservation_unit_id, merchant_id in products:
        if merchant_id == merchant_ids.get(reservation_unit_id):
            product_ids_by_reservation_unit.setdefault(reservation_unit_id, product_id)

    for product_id, reservation_unit_id, _merchant_id in products:
        product_ids_by_reservation_unit.setdefault(reservation_unit_id, product_id)

    for reservation_unit_id, product_id in product_ids_by_reservation_unit.items():
        ReservationUnit.objects.filter(pk=reservation_unit_id).update(payment_product_id=product_id)


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0198_sales_item_unique_material_and_main_ledger_account"),
    ]

    operations = [
        migrations.AddField(
            model_name="paymentproduct",
            name="reservation_unit",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="payment_products",
                to="tilavarauspalvelu.reservationunit",
            ),
        ),
        migrations.AddField(
            model_name="paymentproduct",
            name="sales_item",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="payment_products",
                to="tilavarauspalvelu.salesitem",
            ),
        ),
        migrations.RunPython(
            code=add_reservation_units_and_sales_items_to_products,
            reverse_code=set_payment_products_of_reservation_units,
        ),
        migrations.RunPython(
            code=link_products_of_old_merchants_to_their_reservation_units,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.RemoveField(
            model_name="reservationunit",
            name="payment_product",
        ),
        migrations.AlterField(
            model_name="paymentproduct",
            name="reservation_unit",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="payment_products",
                to="tilavarauspalvelu.reservationunit",
            ),
        ),
        migrations.AddConstraint(
            model_name="paymentproduct",
            constraint=models.UniqueConstraint(
                fields=("reservation_unit", "sales_item", "merchant"),
                name="payment_product_unique_reservation_unit_sales_item_merchant",
                nulls_distinct=False,
                violation_error_message="A product already exists for this reservation unit, sales item and merchant.",
            ),
        ),
    ]
