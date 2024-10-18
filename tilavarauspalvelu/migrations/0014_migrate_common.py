# ruff: noqa: E501

import uuid

import django.db.models.deletion
from django.contrib.postgres.fields import ArrayField
from django.db import migrations, models

import tilavarauspalvelu.enums
import utils.fields.model
from tilavarauspalvelu.models import AffectingTimeSpan, ReservationUnitHierarchy
from utils.db import NowTT


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0013_migrate_applications"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="RequestLog",
            fields=[
                ("request_id", models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ("path", models.TextField(editable=False)),
                ("body", models.TextField(blank=True, editable=False, null=True)),
                ("duration_ms", models.PositiveBigIntegerField(editable=False)),
                ("created", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Request log",
                "verbose_name_plural": "Request logs",
                "db_table": "request_log",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="BannerNotification",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=100, unique=True)),
                ("message", models.TextField(blank=True, default="", max_length=1000)),
                ("message_fi", models.TextField(blank=True, default="", max_length=1000, null=True)),
                ("message_en", models.TextField(blank=True, default="", max_length=1000, null=True)),
                ("message_sv", models.TextField(blank=True, default="", max_length=1000, null=True)),
                ("draft", models.BooleanField(default=True)),
                (
                    "level",
                    utils.fields.model.StrChoiceField(
                        choices=[("EXCEPTION", "Exception"), ("WARNING", "Warning"), ("NORMAL", "Normal")],
                        enum=tilavarauspalvelu.enums.BannerNotificationLevel,
                        max_length=9,
                    ),
                ),
                (
                    "target",
                    utils.fields.model.StrChoiceField(
                        choices=[("ALL", "All"), ("STAFF", "Staff"), ("USER", "User")],
                        enum=tilavarauspalvelu.enums.BannerNotificationTarget,
                        max_length=5,
                    ),
                ),
                ("active_from", models.DateTimeField(blank=True, default=None, null=True)),
                ("active_until", models.DateTimeField(blank=True, default=None, null=True)),
            ],
            options={
                "db_table": "banner_notification",
                "ordering": ["pk"],
                "base_manager_name": "objects",
                "indexes": [
                    models.Index(
                        models.Case(
                            models.When(level="EXCEPTION", then=models.Value(1)),
                            models.When(level="WARNING", then=models.Value(2)),
                            models.When(level="NORMAL", then=models.Value(3)),
                            default=models.Value(4),
                        ),
                        name="level_priority_index",
                    ),
                    models.Index(
                        models.Case(
                            models.When(target="ALL", then=models.Value(1)),
                            models.When(target="USER", then=models.Value(2)),
                            models.When(target="STAFF", then=models.Value(3)),
                            default=models.Value(4),
                        ),
                        name="target_priority_index",
                    ),
                ],
                "constraints": [
                    models.CheckConstraint(
                        condition=models.Q(
                            ("draft", True),
                            models.Q(
                                ("draft", False),
                                ("active_from__isnull", False),
                                ("active_until__isnull", False),
                                models.Q(("message", ""), _negated=True),
                            ),
                            _connector="OR",
                        ),
                        name="non_draft_notifications_must_have_active_period_and_message",
                        violation_error_message=("Non-draft notifications must have an active period and message set."),
                    ),
                    models.CheckConstraint(
                        condition=models.Q(
                            models.Q(("active_from__isnull", True), ("active_until__isnull", True)),
                            models.Q(
                                ("active_from__isnull", False),
                                ("active_until__isnull", False),
                                ("active_until__gt", models.F("active_from")),
                            ),
                            _connector="OR",
                        ),
                        name="active_period_not_set_or_active_until_after_active_from",
                        violation_error_message=(
                            "Both 'active_from' and 'active_until' must be either empty or set. "
                            "If both are set, 'active_until' must be after 'active_from'."
                        ),
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="SQLLog",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("sql", models.TextField(db_index=True, editable=False)),
                ("duration_ns", models.PositiveBigIntegerField(editable=False)),
                ("succeeded", models.BooleanField(default=True, editable=False)),
                ("stack_info", models.TextField(blank=True, editable=False)),
                (
                    "request_log",
                    models.ForeignKey(
                        editable=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sql_logs",
                        to="tilavarauspalvelu.requestlog",
                    ),
                ),
            ],
            options={
                "verbose_name": "SQL log",
                "verbose_name_plural": "SQL logs",
                "db_table": "sql_log",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        #
        # Add test configurations table & 'NOW_TT' function
        # Added earlier so that 'affecting_time_spans' is affected in local testing.
        NowTT.migration(),
        #
        # Create the ReservationUnitHierarchy materialized view
        ReservationUnitHierarchy.create_migration(),
        # Add the model
        migrations.CreateModel(
            name="ReservationUnitHierarchy",
            fields=[
                (
                    "reservation_unit",
                    models.OneToOneField(
                        db_column="reservation_unit_id",
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        primary_key=True,
                        related_name="reservation_unit_hierarchy",
                        serialize=False,
                        to="tilavarauspalvelu.reservationunit",
                    ),
                ),
                (
                    "related_reservation_unit_ids",
                    ArrayField(base_field=models.IntegerField(), size=None),
                ),
            ],
            options={
                "db_table": "reservation_unit_hierarchy",
                "managed": False,
                "base_manager_name": "objects",
                "verbose_name": "reservation unit hierarchy",
                "verbose_name_plural": "reservation unit hierarchies",
            },
        ),
        #
        # Create the AffectingTimeSpan materialized view
        AffectingTimeSpan.create_migration(),
        # Create the model
        migrations.CreateModel(
            name="AffectingTimeSpan",
            fields=[
                (
                    "reservation",
                    models.OneToOneField(
                        db_column="reservation_id",
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        primary_key=True,
                        related_name="affecting_time_span",
                        serialize=False,
                        to="tilavarauspalvelu.reservation",
                    ),
                ),
                (
                    "affected_reservation_unit_ids",
                    ArrayField(base_field=models.IntegerField(), size=None),
                ),
                ("is_blocking", models.BooleanField()),
                ("buffered_start_datetime", models.DateTimeField()),
                ("buffered_end_datetime", models.DateTimeField()),
                ("buffer_time_before", models.DurationField(null=True)),
                ("buffer_time_after", models.DurationField(null=True)),
            ],
            options={
                "verbose_name": "affecting time span",
                "verbose_name_plural": "affecting time spans",
                "db_table": "affecting_time_spans",
                "managed": False,
                "base_manager_name": "objects",
                "ordering": ["buffered_start_datetime", "reservation_id"],
            },
        ),
    ]
