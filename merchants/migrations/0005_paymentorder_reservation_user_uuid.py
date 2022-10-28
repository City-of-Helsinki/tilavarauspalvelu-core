# Generated by Django 3.2.16 on 2022-10-28 06:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('merchants', '0004_paymentorder_reservation'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymentorder',
            name='reservation_user_uuid',
            field=models.UUIDField(blank=True, null=True, verbose_name='Reservation user UUID'),
        ),
    ]
