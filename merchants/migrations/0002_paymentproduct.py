# Generated by Django 3.2.15 on 2022-09-30 09:15

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("merchants", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentProduct",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        help_text="Value comes from the Product Experience API",
                        primary_key=True,
                        serialize=False,
                        verbose_name="Product ID",
                    ),
                ),
                (
                    "merchant",
                    models.ForeignKey(
                        help_text="Merchant used for payments",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="products",
                        to="merchants.PaymentMerchant",
                        verbose_name="Payment merchant",
                    ),
                ),
            ],
            options={
                "db_table": "payment_product",
            },
        ),
    ]
