# Generated by Django 3.1.13 on 2021-10-11 07:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0005_recurringreservation_not_nullable_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='abilitygroup',
            name='name_en',
            field=models.TextField(null=True, unique=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='abilitygroup',
            name='name_fi',
            field=models.TextField(null=True, unique=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='abilitygroup',
            name='name_sv',
            field=models.TextField(null=True, unique=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='reservationpurpose',
            name='custom_purpose_en',
            field=models.TextField(blank=True, null=True, verbose_name='Custom purpose'),
        ),
        migrations.AddField(
            model_name='reservationpurpose',
            name='custom_purpose_fi',
            field=models.TextField(blank=True, null=True, verbose_name='Custom purpose'),
        ),
        migrations.AddField(
            model_name='reservationpurpose',
            name='custom_purpose_sv',
            field=models.TextField(blank=True, null=True, verbose_name='Custom purpose'),
        ),
    ]
