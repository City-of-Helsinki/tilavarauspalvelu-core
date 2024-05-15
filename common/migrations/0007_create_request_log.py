# Generated by Django 5.0.4 on 2024-05-15 10:33

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("common", "0006_sqllog"),
    ]

    operations = [
        migrations.CreateModel(
            name="RequestLog",
            fields=[
                ("request_id", models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ("path", models.TextField(editable=False)),
                ("body", models.TextField(blank=True, editable=False, null=True)),
                ("duration_ms", models.PositiveBigIntegerField(default=0)),
                ("created", models.DateTimeField()),
            ],
            options={
                "verbose_name": "Request log",
                "verbose_name_plural": "Request logs",
                "db_table": "request_log",
                "base_manager_name": "objects",
            },
        ),
        migrations.AddField(
            model_name="sqllog",
            name="request_log",
            field=models.ForeignKey(
                default=None,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sql_logs",
                to="common.requestlog",
            ),
            preserve_default=False,
        ),
    ]