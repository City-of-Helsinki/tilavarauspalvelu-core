# Generated by Django 3.1.13 on 2021-08-12 10:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0014_reservationunit_contact_information'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservationunit',
            name='max_reservation_duration',
            field=models.DurationField(blank=True, null=True, verbose_name='Maximum reservation duration'),
        ),
        migrations.AddField(
            model_name='reservationunit',
            name='min_reservation_duration',
            field=models.DurationField(blank=True, null=True, verbose_name='Minimum reservation duration'),
        ),
    ]
