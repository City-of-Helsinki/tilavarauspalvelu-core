# Generated by Django 5.0.4 on 2024-04-08 08:47

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("reservation_units", "0098_alter_reservationunit_options_and_more"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="equipment",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="equipmentcategory",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="keyword",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="keywordcategory",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="keywordgroup",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="qualifier",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="reservationunitcancellationrule",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="reservationunitimage",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="reservationunitpaymenttype",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="reservationunitpricing",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="taxpercentage",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
    ]
