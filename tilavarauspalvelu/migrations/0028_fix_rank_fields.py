# Generated by Django 5.1.1 on 2024-09-26 14:42

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0027_modify_pricing_fieds"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="equipmentcategory",
            options={
                "base_manager_name": "objects",
                "ordering": ["rank"],
                "verbose_name": "equipment category",
                "verbose_name_plural": "equipment categories",
            },
        ),
        migrations.AlterModelOptions(
            name="reservationpurpose",
            options={
                "base_manager_name": "objects",
                "ordering": ["rank"],
                "verbose_name": "reservation purpose",
                "verbose_name_plural": "reservation purposes",
            },
        ),
        migrations.AddField(
            model_name="reservationpurpose",
            name="rank",
            field=models.PositiveIntegerField(db_index=True, default=0),
        ),
        migrations.AlterField(
            model_name="equipmentcategory",
            name="rank",
            field=models.PositiveIntegerField(db_index=True, default=0),
        ),
        migrations.AlterField(
            model_name="purpose",
            name="rank",
            field=models.PositiveIntegerField(db_index=True, default=0),
        ),
        migrations.AlterField(
            model_name="reservationdenyreason",
            name="rank",
            field=models.PositiveIntegerField(db_index=True, default=0),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="rank",
            field=models.PositiveIntegerField(db_index=True, default=0),
        ),
        migrations.AlterField(
            model_name="reservationunittype",
            name="rank",
            field=models.PositiveIntegerField(db_index=True, default=0),
        ),
        migrations.AlterField(
            model_name="unit",
            name="rank",
            field=models.PositiveIntegerField(db_index=True, default=0),
        ),
    ]
