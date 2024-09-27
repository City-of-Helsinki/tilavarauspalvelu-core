import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0009_migrate_email_template"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="OriginHaukiResource",
            fields=[
                ("id", models.IntegerField(primary_key=True, serialize=False, unique=True)),
                ("opening_hours_hash", models.CharField(blank=True, max_length=64)),
                ("latest_fetched_date", models.DateField(blank=True, null=True)),
            ],
            options={
                "db_table": "origin_hauki_resource",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservableTimeSpan",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("start_datetime", models.DateTimeField()),
                ("end_datetime", models.DateTimeField()),
                (
                    "resource",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reservable_time_spans",
                        to="tilavarauspalvelu.originhaukiresource",
                    ),
                ),
            ],
            options={
                "db_table": "reservable_time_span",
                "ordering": ["resource", "start_datetime", "end_datetime"],
                "base_manager_name": "objects",
                "constraints": [
                    models.CheckConstraint(
                        condition=models.Q(("start_datetime__lt", models.F("end_datetime"))),
                        name="reservable_time_span_start_before_end",
                        violation_error_message="`start_datetime` must be before `end_datetime`.",
                    )
                ],
            },
        ),
        # Create relations.
        migrations.AddField(
            model_name="unit",
            name="origin_hauki_resource",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="units",
                to="tilavarauspalvelu.originhaukiresource",
            ),
        ),
    ]
