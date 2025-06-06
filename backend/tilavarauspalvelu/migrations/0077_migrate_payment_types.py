# Generated by Django 5.1.8 on 2025-04-17 10:02
from __future__ import annotations

from django.contrib.postgres.aggregates import ArrayAgg
from django.db import migrations


def forwards_func(apps, schema_editor):
    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")

    reservation_units = ReservationUnit.objects.annotate(
        payment_type_codes=ArrayAgg("payment_types__code", distinct=True),
    )

    for reservation_unit in reservation_units:
        payment_type: str | None = None
        payment_types: list[str] = reservation_unit.payment_type_codes

        # This is fine as invoicing wasn't available before this migration
        # and was always meant to be used together with online payments.
        if "INVOICE" in payment_types:
            payment_type = "ONLINE_OR_INVOICE"

        elif "ONLINE" in payment_types:
            payment_type = "ONLINE"

        elif "ON_SITE" in payment_types:
            payment_type = "ON_SITE"

        reservation_unit.pricings.update(payment_type=payment_type)

    PaymentOrder = apps.get_model("tilavarauspalvelu", "PaymentOrder")

    PaymentOrder.objects.filter(payment_type="INVOICE").update(payment_type="ONLINE_OR_INVOICE")


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0076_change_payment_type_invoice"),
    ]

    operations = [
        migrations.RunPython(forwards_func, migrations.RunPython.noop),
    ]
