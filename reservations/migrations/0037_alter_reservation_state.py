# Generated by Django 3.2.16 on 2022-11-08 07:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0036_reservation_non_subsidised_prices'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reservation',
            name='state',
            field=models.CharField(choices=[('created', 'created'), ('cancelled', 'cancelled'), ('requires_handling', 'requires_handling'), ('waiting_for_payment', 'waiting_for_payment'), ('confirmed', 'confirmed'), ('denied', 'denied')], default='created', max_length=32, verbose_name='State'),
        ),
    ]
