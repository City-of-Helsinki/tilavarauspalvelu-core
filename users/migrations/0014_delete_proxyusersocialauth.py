# Generated by Django 5.0.4 on 2024-04-10 12:50

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0013_alter_personalinfoviewlog_options_alter_user_options"),
    ]

    operations = [
        migrations.DeleteModel(
            name="ProxyUserSocialAuth",
        ),
    ]
