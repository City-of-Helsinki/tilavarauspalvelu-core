# Generated by Django 5.1.1 on 2024-10-03 06:02

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0020_delete_emailtemplate"),
    ]

    operations = [
        migrations.AddField(
            model_name="generalrole",
            name="role_active",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="unitrole",
            name="role_active",
            field=models.BooleanField(default=True),
        ),
    ]
