# Generated by Django 3.2.18 on 2023-05-05 07:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0049_reservation_verbose_name_changes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reservation',
            name='non_subsidised_price',
            field=models.DecimalField(decimal_places=2, default=0, help_text='The non subsidised price of this reservation including VAT', max_digits=20, verbose_name='Non subsidised price'),
        ),
        migrations.AlterField(
            model_name='reservationstatistic',
            name='non_subsidised_price',
            field=models.DecimalField(decimal_places=2, default=0, help_text='The non subsidised price of the reservation excluding VAT', max_digits=20, verbose_name='Non subsidised price'),
        ),
    ]
