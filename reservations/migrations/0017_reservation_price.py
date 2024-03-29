# Generated by Django 3.1.13 on 2021-12-01 13:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0016_reservation_confirmed_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='price',
            field=models.DecimalField(decimal_places=2, default=0, help_text='The price of this particular reservation', max_digits=10, verbose_name='Price'),
        ),
    ]
