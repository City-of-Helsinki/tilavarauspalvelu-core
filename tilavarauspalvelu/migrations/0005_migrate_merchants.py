from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models

import tilavarauspalvelu.validators


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0004_migrate_terms_of_use"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="PaymentAccounting",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=128)),
                (
                    "company_code",
                    models.CharField(max_length=4, validators=[tilavarauspalvelu.validators.is_numeric]),
                ),
                (
                    "main_ledger_account",
                    models.CharField(max_length=6, validators=[tilavarauspalvelu.validators.is_numeric]),
                ),
                ("vat_code", models.CharField(max_length=2)),
                (
                    "internal_order",
                    models.CharField(
                        blank=True,
                        default="",
                        max_length=10,
                        validators=[tilavarauspalvelu.validators.is_numeric],
                    ),
                ),
                (
                    "profit_center",
                    models.CharField(
                        blank=True,
                        default="",
                        max_length=7,
                        validators=[tilavarauspalvelu.validators.is_numeric],
                    ),
                ),
                (
                    "project",
                    models.CharField(
                        blank=True,
                        default="",
                        max_length=16,
                        validators=[
                            tilavarauspalvelu.validators.validate_accounting_project,
                            tilavarauspalvelu.validators.is_numeric,
                        ],
                    ),
                ),
                (
                    "operation_area",
                    models.CharField(
                        blank=True,
                        default="",
                        max_length=6,
                        validators=[tilavarauspalvelu.validators.is_numeric],
                    ),
                ),
                ("balance_profit_center", models.CharField(max_length=10)),
            ],
            options={
                "db_table": "payment_accounting",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="PaymentMerchant",
            fields=[
                ("id", models.UUIDField(primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=128)),
            ],
            options={
                "db_table": "payment_merchant",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="PaymentOrder",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("remote_id", models.UUIDField(blank=True, null=True)),
                ("payment_id", models.CharField(blank=True, default="", max_length=128)),
                ("refund_id", models.UUIDField(blank=True, null=True)),
                (
                    "payment_type",
                    models.CharField(
                        choices=[("ONLINE", "Online"), ("ON_SITE", "On site"), ("INVOICE", "Invoice")],
                        max_length=128,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("DRAFT", "Draft"),
                            ("EXPIRED", "Expired"),
                            ("CANCELLED", "Cancelled"),
                            ("PAID", "Paid"),
                            ("PAID_MANUALLY", "Paid manually"),
                            ("REFUNDED", "Refunded"),
                        ],
                        db_index=True,
                        max_length=128,
                    ),
                ),
                ("price_net", models.DecimalField(decimal_places=2, max_digits=10)),
                ("price_vat", models.DecimalField(decimal_places=2, max_digits=10)),
                ("price_total", models.DecimalField(decimal_places=2, max_digits=10)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("processed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "language",
                    models.CharField(choices=[("fi", "Finnish"), ("sv", "Swedish"), ("en", "English")], max_length=8),
                ),
                ("reservation_user_uuid", models.UUIDField(blank=True, null=True)),
                ("checkout_url", models.CharField(blank=True, default="", max_length=512)),
                ("receipt_url", models.CharField(blank=True, default="", max_length=512)),
            ],
            options={
                "db_table": "payment_order",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="PaymentProduct",
            fields=[
                ("id", models.UUIDField(primary_key=True, serialize=False)),
                (
                    "merchant",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="products",
                        to="tilavarauspalvelu.paymentmerchant",
                    ),
                ),
            ],
            options={
                "db_table": "payment_product",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
    ]
