# Generated by Django 3.1.13 on 2021-12-10 13:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0034_fix_reservation_start_interval_help_text'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservationunit',
            name='buffer_time_after',
            field=models.DurationField(blank=True, null=True, verbose_name='Buffer time after reservation'),
        ),
        migrations.AddField(
            model_name='reservationunit',
            name='buffer_time_before',
            field=models.DurationField(blank=True, null=True, verbose_name='Buffer time before reservation'),
        ),
    ]
