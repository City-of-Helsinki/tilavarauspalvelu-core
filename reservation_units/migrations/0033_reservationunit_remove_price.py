# Generated by Django 3.1.13 on 2021-12-08 08:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0032_reservationunit_reservation_start_interval'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='reservationunit',
            name='price',
        ),
    ]
