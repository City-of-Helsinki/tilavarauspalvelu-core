# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations

from utils.migration import AlterModelTable


class Migration(migrations.Migration):
    dependencies = [
        ("reservation_units", "0092_add_base_manager_name_to_all_models"),
    ]

    operations = [
        AlterModelTable(
            name="equipment",
            table="equipment",
        ),
        AlterModelTable(
            name="equipmentcategory",
            table="equipment_category",
        ),
        AlterModelTable(
            name="introduction",
            table="introduction",
        ),
        AlterModelTable(
            name="keyword",
            table="keyword",
        ),
        AlterModelTable(
            name="keywordcategory",
            table="keyword_category",
        ),
        AlterModelTable(
            name="keywordgroup",
            table="keyword_group",
        ),
        AlterModelTable(
            name="purpose",
            table="purpose",
        ),
        AlterModelTable(
            name="qualifier",
            table="qualifier",
        ),
        AlterModelTable(
            name="reservationunit",
            table="reservation_unit",
        ),
        AlterModelTable(
            name="reservationunitcancellationrule",
            table="reservation_unit_cancellation_rule",
        ),
        AlterModelTable(
            name="reservationunitimage",
            table="reservation_unit_image",
        ),
        AlterModelTable(
            name="reservationunitpaymenttype",
            table="reservation_unit_payment_type",
        ),
        AlterModelTable(
            name="reservationunitpricing",
            table="reservation_unit_pricing",
        ),
        AlterModelTable(
            name="reservationunittype",
            table="reservation_unit_type",
        ),
        AlterModelTable(
            name="taxpercentage",
            table="tax_percentage",
        ),
    ]
