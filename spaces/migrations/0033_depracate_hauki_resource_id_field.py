# Generated by Django 4.2.6 on 2023-10-24 21:52

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spaces', '0032_migrate_hauki_resource_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='unit',
            name='hauki_resource_id',
        ),
    ]
