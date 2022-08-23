# Generated by Django 3.2.15 on 2022-08-23 06:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0030_alter_reservation_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='reservee_language',
            field=models.CharField(blank=True, choices=[('fi', 'Finnish'), ('en', 'English'), ('sv', 'Swedish'), ('', '')], default='', max_length=255, verbose_name='Preferred language of reservee'),
        ),
    ]
