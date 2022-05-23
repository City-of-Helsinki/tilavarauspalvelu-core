# Generated by Django 3.2.13 on 2022-05-23 10:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0054_reservationunit_reservation_kind'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservationunit',
            name='can_apply_free_of_charge',
            field=models.BooleanField(blank=True, default=False, help_text='Can reservations to this reservation unit be able to apply free of charge.', verbose_name='Can apply free of charge'),
        ),
    ]
