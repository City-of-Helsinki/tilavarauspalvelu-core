# Generated by Django 3.0.10 on 2021-03-02 07:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0008_reservationunit_unit'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservationunit',
            name='description',
            field=models.TextField(blank=True, default='', max_length=512, verbose_name='Description'),
        ),
    ]
