# Generated by Django 4.2.1 on 2023-06-19 13:28

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0064_add_db_indexes"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="applicationevent",
            name="district",
        ),
    ]
