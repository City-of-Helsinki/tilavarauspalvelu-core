# Generated by Django 3.2.16 on 2022-10-28 10:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0032_reservationstatistic_reservationstatisticsreservationunit'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='price_net',
            field=models.DecimalField(decimal_places=6, default=0, help_text='The price of this particular reservation excluding VAT', max_digits=20, verbose_name='Price'),
        ),
        migrations.AlterField(
            model_name='reservation',
            name='price',
            field=models.DecimalField(decimal_places=2, default=0, help_text='The price of this particular reservation including VAT', max_digits=10, verbose_name='Price'),
        ),
        migrations.AlterField(
            model_name='reservation',
            name='unit_price',
            field=models.DecimalField(decimal_places=2, default=0, help_text='The unit price of this particular reservation', max_digits=10, verbose_name='Unit price'),
        ),
    ]
