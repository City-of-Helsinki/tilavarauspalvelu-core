# Generated by Django 4.2.6 on 2023-10-24 21:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0087_migrate_hauki_resource_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='reservationunit',
            name='hauki_resource_id',
        ),
    ]
