# Generated by Django 5.0.7 on 2024-07-28 19:43

import django.db.models.deletion
from django.db import migrations, models

import merchants.validators


class Migration(migrations.Migration):
    dependencies = [
        ("merchants", "0017_migrate_nullable_fields"),
        ("reservations", "0072_alter_reservation_begin_alter_reservation_end"),
    ]

    operations = [
        migrations.AlterField(
            model_name="paymentaccounting",
            name="balance_profit_center",
            field=models.CharField(max_length=10),
        ),
        migrations.AlterField(
            model_name="paymentaccounting",
            name="company_code",
            field=models.CharField(max_length=4, validators=[merchants.validators.is_numeric]),
        ),
        migrations.AlterField(
            model_name="paymentaccounting",
            name="internal_order",
            field=models.CharField(blank=True, default="", max_length=10, validators=[merchants.validators.is_numeric]),
        ),
        migrations.AlterField(
            model_name="paymentaccounting",
            name="main_ledger_account",
            field=models.CharField(max_length=6, validators=[merchants.validators.is_numeric]),
        ),
        migrations.AlterField(
            model_name="paymentaccounting",
            name="name",
            field=models.CharField(max_length=128),
        ),
        migrations.AlterField(
            model_name="paymentaccounting",
            name="operation_area",
            field=models.CharField(blank=True, default="", max_length=6, validators=[merchants.validators.is_numeric]),
        ),
        migrations.AlterField(
            model_name="paymentaccounting",
            name="profit_center",
            field=models.CharField(blank=True, default="", max_length=7, validators=[merchants.validators.is_numeric]),
        ),
        migrations.AlterField(
            model_name="paymentaccounting",
            name="project",
            field=models.CharField(
                blank=True,
                default="",
                max_length=16,
                validators=[merchants.validators.validate_accounting_project, merchants.validators.is_numeric],
            ),
        ),
        migrations.AlterField(
            model_name="paymentaccounting",
            name="vat_code",
            field=models.CharField(max_length=2),
        ),
        migrations.AlterField(
            model_name="paymentmerchant",
            name="id",
            field=models.UUIDField(primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name="paymentmerchant",
            name="name",
            field=models.CharField(max_length=128),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="checkout_url",
            field=models.CharField(blank=True, default="", max_length=512),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="language",
            field=models.CharField(choices=[("fi", "Finnish"), ("sv", "Swedish"), ("en", "English")], max_length=8),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="payment_id",
            field=models.CharField(blank=True, default="", max_length=128),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="payment_type",
            field=models.CharField(
                choices=[("ON_SITE", "On site"), ("ONLINE", "Online"), ("INVOICE", "Invoice")], max_length=128
            ),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="price_net",
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="price_total",
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="price_vat",
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="processed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="receipt_url",
            field=models.CharField(blank=True, default="", max_length=512),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="refund_id",
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="remote_id",
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="reservation",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="payment_order",
                to="reservations.reservation",
            ),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="reservation_user_uuid",
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="paymentorder",
            name="status",
            field=models.CharField(
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
        migrations.AlterField(
            model_name="paymentproduct",
            name="id",
            field=models.UUIDField(primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name="paymentproduct",
            name="merchant",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="products",
                to="merchants.paymentmerchant",
            ),
        ),
    ]
