# Generated by Django 5.1.2 on 2024-10-21 10:10

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0022_user_sent_email_about_deactivating_permissions"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="sent_email_about_anonymization",
            field=models.BooleanField(blank=True, default=False),
        ),
    ]
