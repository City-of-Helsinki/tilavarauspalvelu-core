# Generated by Django 3.2.12 on 2022-05-04 11:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0048_alter_reservationunit_terms_of_use'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservationunit',
            name='rank',
            field=models.PositiveIntegerField(blank=True, help_text='Order number to be use in api sorting.', null=True, verbose_name='Order number'),
        ),
    ]
