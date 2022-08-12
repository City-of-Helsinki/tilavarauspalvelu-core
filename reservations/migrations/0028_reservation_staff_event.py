# Generated by Django 3.2.13 on 2022-08-11 09:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0027_reservation_sku'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='staff_event',
            field=models.BooleanField(default=False, help_text='Indicates if reservation is internal or created by staff', null=True, verbose_name='Reservation is internal'),
        ),
    ]
