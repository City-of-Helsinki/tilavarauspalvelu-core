# Generated by Django 5.0.6 on 2024-05-29 12:36

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0071_rejectedoccurrence"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reservation",
            name="begin",
            field=models.DateTimeField(db_index=True),
        ),
        migrations.AlterField(
            model_name="reservation",
            name="end",
            field=models.DateTimeField(db_index=True),
        ),
    ]
