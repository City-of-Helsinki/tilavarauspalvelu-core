from __future__ import annotations

import uuid
from inspect import cleandoc
from typing import Any

import django.db.models.deletion
from django.contrib.postgres.fields import ArrayField
from django.db import migrations, models

import tilavarauspalvelu.enums
from utils.db import NowTT  # noqa: TID251


class StrChoiceField(models.CharField):
    """CharField for TextChoices that automatically sets 'max_length' to the length of the longest choice."""

    def __init__(self, enum: type[models.Choices], **kwargs: Any) -> None:
        self.enum = enum
        kwargs["max_length"] = max(len(val) for val, _ in enum.choices)
        kwargs["choices"] = enum.choices
        super().__init__(**kwargs)

    def deconstruct(self) -> tuple[str, str, list[Any], dict[str, Any]]:
        name, path, args, kwargs = super().deconstruct()
        kwargs["enum"] = self.enum
        return name, path, args, kwargs


def create_reservation_unit_hierarchy():
    # "SELECT 1;" for syntax highlighting
    return cleandoc(
        """
        SELECT 1;

        CREATE MATERIALIZED VIEW reservation_unit_hierarchy AS
            SELECT
                subquery.reservation_unit_id,
                subquery.related_reservation_unit_ids
            FROM (
                SELECT
                    target_reservation_unit.id as reservation_unit_id,
                    (
                        SELECT
                            ARRAY_AGG(DISTINCT reservation_ids.id)
                        FROM (
                            SELECT
                                agg_res_unit.id
                            FROM "reservation_unit" agg_res_unit
                            LEFT OUTER JOIN reservation_unit_spaces res_space ON (
                                agg_res_unit.id = res_space.reservationunit_id
                            )
                            LEFT OUTER JOIN reservation_unit_resources res_resource ON (
                                agg_res_unit.id = res_resource.reservationunit_id
                            )
                            WHERE (
                                agg_res_unit.id = target_reservation_unit.id
                                OR res_space.space_id IN (
                                    SELECT
                                        UNNEST((
                                            SELECT
                                                ARRAY_AGG(id)
                                            FROM (
                                                SELECT
                                                    family_space.id
                                                FROM "space" family_space
                                                WHERE (
                                                    (
                                                        family_space.lft <= (target_space.lft)
                                                        AND family_space.rght >= (target_space.rght)
                                                        AND family_space.tree_id = (target_space.tree_id)
                                                    )
                                                    OR (
                                                        family_space.lft >= (target_space.lft)
                                                        AND family_space.rght <= (target_space.rght)
                                                        AND family_space.tree_id = (target_space.tree_id)
                                                    )
                                                )
                                                ORDER BY family_space.tree_id, family_space.lft
                                            ) space_ids
                                        )) AS all_families
                                    FROM
                                        "space" target_space
                                    INNER JOIN reservation_unit_spaces target_rus ON (
                                        target_space.id = target_rus.space_id
                                    )
                                    WHERE target_rus.reservationunit_id = target_reservation_unit.id
                                    ORDER BY target_space.tree_id, target_space.lft
                                )
                                OR res_resource.resource_id IN (
                                    SELECT
                                        resource.id
                                    FROM "resource" resource
                                    INNER JOIN reservation_unit_resources ON (
                                        resource.id = reservation_unit_resources.resource_id
                                    )
                                    WHERE reservation_unit_resources.reservationunit_id = target_reservation_unit.id
                                    ORDER BY agg_res_unit.id
                                )
                            )
                            ORDER BY agg_res_unit.rank, agg_res_unit.id
                        ) reservation_ids
                    ) AS related_reservation_unit_ids
                FROM "reservation_unit" target_reservation_unit
            ) subquery;

        CREATE UNIQUE INDEX reservation_unit_hierarchy_reservation_unit_id ON reservation_unit_hierarchy (
            reservation_unit_id
        );
        """
    )


def remove_reservation_unit_hierarchy():
    return cleandoc(
        """
        DROP INDEX IF EXISTS reservation_unit_hierarchy_reservation_unit_id;
        DROP MATERIALIZED VIEW IF EXISTS reservation_unit_hierarchy;
        """
    )


def create_affecting_reservations() -> str:
    # "SELECT 1;" for syntax highlighting
    return cleandoc(
        """
        SELECT 1;

        CREATE MATERIALIZED VIEW affecting_time_spans AS
            SELECT
                res.reservation_id,
                array_agg(res.ru_id ORDER BY res.ru_id) AS affected_reservation_unit_ids,
                res.buffered_start_datetime,
                res.buffered_end_datetime,
                res.buffer_time_before,
                res.buffer_time_after,
                res.is_blocking
            FROM (
                SELECT DISTINCT
                    r.id as reservation_id,
                    unnest(ruh.related_reservation_unit_ids) as ru_id,
                    (r.begin - r.buffer_time_before) as buffered_start_datetime,
                    (r.end + r.buffer_time_after) as buffered_end_datetime,
                    r.buffer_time_before as buffer_time_before,
                    r.buffer_time_after as buffer_time_after,
                    (CASE WHEN UPPER(r."type") = 'BLOCKED' THEN true ELSE false END) as is_blocking
                FROM reservation r
                INNER JOIN "reservation_reservation_unit" rru ON r.id = rru.reservation_id
                INNER JOIN "reservation_unit_hierarchy" ruh ON rru.reservationunit_id = ruh.reservation_unit_id
                WHERE (
                    (r.end + r.buffer_time_after)::date >= NOW_TT()::date
                    AND UPPER(r.state) IN ('CREATED', 'CONFIRMED', 'WAITING_FOR_PAYMENT', 'REQUIRES_HANDLING')
                )
            ) res
            GROUP BY
                res.reservation_id,
                res.buffered_start_datetime,
                res.buffered_end_datetime,
                res.buffer_time_before,
                res.buffer_time_after,
                res.is_blocking
            ORDER BY res.buffered_start_datetime, res.reservation_id;

        CREATE UNIQUE INDEX idx_reservation_id ON affecting_time_spans (reservation_id);
        CREATE INDEX idx_affected_reservation_unit_ids on affecting_time_spans USING GIN (
            affected_reservation_unit_ids gin__int_ops
        );
        CREATE INDEX idx_buffered_start_datetime ON affecting_time_spans (buffered_start_datetime);
        CREATE INDEX idx_buffered_end_datetime ON affecting_time_spans (buffered_end_datetime);
        """
    )


def remove_affecting_reservations() -> str:
    return cleandoc(
        """
        DROP INDEX IF EXISTS idx_buffered_end_datetime;
        DROP INDEX IF EXISTS idx_buffered_start_datetime;
        DROP INDEX IF EXISTS idx_affected_reservation_unit_ids;
        DROP INDEX IF EXISTS idx_reservation_id;
        DROP MATERIALIZED VIEW IF EXISTS affecting_time_spans;
        """
    )


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
                    StrChoiceField(
                        choices=[("EXCEPTION", "Exception"), ("WARNING", "Warning"), ("NORMAL", "Normal")],
                        enum=tilavarauspalvelu.enums.BannerNotificationLevel,
                        max_length=9,
                    ),
                ),
                (
                    "target",
                    StrChoiceField(
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
        migrations.RunSQL(sql=create_reservation_unit_hierarchy(), reverse_sql=remove_reservation_unit_hierarchy()),
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
        migrations.RunSQL(sql=create_affecting_reservations(), reverse_sql=remove_affecting_reservations()),
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
