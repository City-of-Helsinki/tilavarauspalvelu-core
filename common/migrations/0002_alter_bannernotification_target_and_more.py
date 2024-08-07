# Generated by Django 4.2.4 on 2023-08-29 10:28

from django.db import migrations

import common.fields
import common.fields.model
from common.enums import BannerNotificationLevel, BannerNotificationTarget


class Migration(migrations.Migration):
    dependencies = [
        ("common", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="bannernotification",
            name="target",
            field=common.fields.model.StrChoiceField(enum=BannerNotificationTarget, max_length=5),
        ),
        migrations.AlterField(
            model_name="bannernotification",
            name="type",
            field=common.fields.model.StrChoiceField(enum=BannerNotificationLevel, max_length=9),
        ),
    ]
