# Generated by Django 3.1.7 on 2021-04-12 04:16

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0032_applicationeventscheduleresult"),
    ]

    operations = [
        migrations.AddField(
            model_name="applicationeventscheduleresult",
            name="basket",
            field=models.ForeignKey(
                null=True, on_delete=django.db.models.deletion.SET_NULL, to="applications.ApplicationRoundBasket"
            ),
        ),
    ]
