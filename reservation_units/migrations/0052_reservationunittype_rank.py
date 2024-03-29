# Generated by Django 3.2.12 on 2022-05-18 10:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0051_equipmentcategory_rank'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservationunittype',
            name='rank',
            field=models.PositiveIntegerField(blank=True, help_text='Order number to be used in api sorting.', null=True, verbose_name='Order number'),
        ),
    ]
