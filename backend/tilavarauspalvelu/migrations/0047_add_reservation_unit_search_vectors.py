# Generated by Django 5.1.3 on 2024-11-28 11:58
from __future__ import annotations

import django.contrib.postgres.search
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0046_alter_reservationunit_managers"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservationunit",
            name="search_vector_en",
            field=django.contrib.postgres.search.SearchVectorField(null=True),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="search_vector_fi",
            field=django.contrib.postgres.search.SearchVectorField(null=True),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="search_vector_sv",
            field=django.contrib.postgres.search.SearchVectorField(null=True),
        ),
    ]
