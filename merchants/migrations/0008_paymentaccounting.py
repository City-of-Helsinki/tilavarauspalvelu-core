# Generated by Django 3.2.16 on 2022-12-02 07:57
from django.core.exceptions import ValidationError
from django.db import migrations, models


def validate_accounting_project(project_value: str) -> None:
    allowed_lengths = [7, 10, 12, 14, 16]
    if len(project_value) not in allowed_lengths:
        raise ValidationError(
            f"Value must be string of one of the following lenghts: {', '.join(map(str, allowed_lengths))}"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("merchants", "0007_rename_order_id_to_remote_id"),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentAccounting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=128, verbose_name="Accounting name")),
                ("company_code", models.CharField(max_length=4, verbose_name="Company code")),
                ("main_ledger_account", models.CharField(max_length=6, verbose_name="Main ledger account")),
                ("vat_code", models.CharField(max_length=2, verbose_name="VAT code")),
                (
                    "internal_order",
                    models.CharField(blank=True, max_length=10, null=True, verbose_name="Internal order"),
                ),
                ("profit_center", models.CharField(blank=True, max_length=7, null=True, verbose_name="Profit center")),
                (
                    "project",
                    models.CharField(
                        blank=True,
                        max_length=16,
                        null=True,
                        validators=[validate_accounting_project],
                        verbose_name="Project",
                    ),
                ),
                (
                    "operation_area",
                    models.CharField(blank=True, max_length=6, null=True, verbose_name="Operation area"),
                ),
            ],
            options={
                "db_table": "payment_accounting",
            },
        ),
    ]
