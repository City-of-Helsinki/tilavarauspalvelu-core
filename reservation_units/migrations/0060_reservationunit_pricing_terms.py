# Generated by Django 3.2.13 on 2022-06-20 05:55

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("terms_of_use", "0002_alter_termsofuse_terms_type"),
        ("reservation_units", "0059_reservationunit_is_archived"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservationunit",
            name="pricing_terms",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="pricing_terms_reservation_unit",
                to="terms_of_use.TermsOfUse",
                verbose_name="Pricing terms",
            ),
        ),
    ]
