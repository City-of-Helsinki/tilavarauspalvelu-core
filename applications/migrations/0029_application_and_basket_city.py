# Generated by Django 3.1.7 on 2021-04-08 07:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0028_organisation_email"),
    ]

    operations = [
        migrations.CreateModel(
            name="City",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, verbose_name="Name")),
            ],
            options={
                "db_table": "city",
            },
        ),
        migrations.AddField(
            model_name="application",
            name="home_city",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="applications.City",
                verbose_name="Home city",
            ),
        ),
        migrations.RunSQL("ALTER TABLE application_round_basket RENAME COLUMN home_city to home_city_tmp"),
        migrations.RunSQL(
            "INSERT INTO city (name) select home_city_tmp from application_round_basket where home_city_tmp is not null"
        ),
        migrations.AddField(
            model_name="applicationroundbasket",
            name="home_city",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="applications.City",
                verbose_name="Home city",
            ),
        ),
        migrations.RunSQL(
            "update application_round_basket set home_city_id = (select id from city where name = home_city_tmp)"
        ),
        migrations.RunSQL("ALTER TABLE application_round_basket drop column home_city_tmp"),
    ]
