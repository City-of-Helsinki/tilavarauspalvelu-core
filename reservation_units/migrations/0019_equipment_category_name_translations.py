# Generated by Django 3.1.13 on 2021-09-20 11:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0018_equipment_name_translations'),
    ]

    operations = [
        migrations.AddField(
            model_name='equipmentcategory',
            name='name_en',
            field=models.CharField(max_length=200, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='equipmentcategory',
            name='name_fi',
            field=models.CharField(max_length=200, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='equipmentcategory',
            name='name_sv',
            field=models.CharField(max_length=200, null=True, verbose_name='Name'),
        ),
    ]
