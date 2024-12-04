# Generated by Django 5.1.3 on 2024-11-28 11:58
from __future__ import annotations

import django.contrib.postgres.search
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0049_populate_reservation_unit_vectors"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reservationunit",
            name="search_vector_en",
            field=django.contrib.postgres.search.SearchVectorField(),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="search_vector_fi",
            field=django.contrib.postgres.search.SearchVectorField(),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="search_vector_sv",
            field=django.contrib.postgres.search.SearchVectorField(),
        ),
    ]