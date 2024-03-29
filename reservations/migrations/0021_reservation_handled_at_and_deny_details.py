# Generated by Django 3.1.13 on 2022-01-11 09:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0020_reservation_created_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='deny_details',
            field=models.TextField(blank=True, help_text='Additional details for denying the reservation', verbose_name='Deny details for this reservation'),
        ),
        migrations.AddField(
            model_name='reservation',
            name='handled_at',
            field=models.DateTimeField(blank=True, help_text='When this reservation was handled.', null=True, verbose_name='Handled at'),
        ),
    ]
