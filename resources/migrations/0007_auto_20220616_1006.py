# Generated by Django 3.2.13 on 2022-06-16 07:06

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('resources', '0006_remove_resource_is_draft'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='resource',
            name='description',
        ),
        migrations.RemoveField(
            model_name='resource',
            name='description_en',
        ),
        migrations.RemoveField(
            model_name='resource',
            name='description_fi',
        ),
        migrations.RemoveField(
            model_name='resource',
            name='description_sv',
        ),
    ]
