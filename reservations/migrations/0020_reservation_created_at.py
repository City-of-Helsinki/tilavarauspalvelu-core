# Generated by Django 3.1.14 on 2022-01-07 09:20

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0019_reservationmetadata'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now, null=True, verbose_name='Created at'),
        ),
    ]
