import datetime
import re
import uuid

import django.contrib.postgres.fields
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
import graphene_django_extensions.fields.model
from django.conf import settings
from django.db import migrations, models

import tilavarauspalvelu.enums


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0010_migrate_opening_hours"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="Reservation",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("sku", models.CharField(blank=True, default="", max_length=255)),
                ("name", models.CharField(blank=True, default="", max_length=255)),
                ("description", models.CharField(blank=True, default="", max_length=255)),
                ("num_persons", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "state",
                    models.CharField(
                        choices=[
                            ("CREATED", "Created"),
                            ("CANCELLED", "Cancelled"),
                            ("REQUIRES_HANDLING", "Requires handling"),
                            ("WAITING_FOR_PAYMENT", "Waiting for payment"),
                            ("CONFIRMED", "Confirmed"),
                            ("DENIED", "Denied"),
                        ],
                        db_index=True,
                        default="CREATED",
                        max_length=32,
                    ),
                ),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("NORMAL", "Normal"),
                            ("BLOCKED", "Blocked"),
                            ("STAFF", "Staff"),
                            ("BEHALF", "Behalf"),
                            ("SEASONAL", "Seasonal"),
                        ],
                        default="NORMAL",
                        max_length=50,
                        null=True,
                    ),
                ),
                ("cancel_details", models.TextField(blank=True, default="")),
                ("handling_details", models.TextField(blank=True, default="")),
                ("working_memo", models.TextField(blank=True, default="", null=True)),
                ("begin", models.DateTimeField(db_index=True)),
                ("end", models.DateTimeField(db_index=True)),
                ("buffer_time_before", models.DurationField(blank=True, default=datetime.timedelta(0))),
                ("buffer_time_after", models.DurationField(blank=True, default=datetime.timedelta(0))),
                ("handled_at", models.DateTimeField(blank=True, null=True)),
                ("confirmed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, null=True)),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("non_subsidised_price", models.DecimalField(decimal_places=2, default=0, max_digits=20)),
                ("unit_price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("tax_percentage_value", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("applying_for_free_of_charge", models.BooleanField(blank=True, default=False)),
                ("free_of_charge_reason", models.TextField(blank=True, null=True)),
                ("reservee_id", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_first_name", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_last_name", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_email", models.EmailField(blank=True, max_length=254, null=True)),
                ("reservee_phone", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_organisation_name", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_address_street", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_address_city", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_address_zip", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_is_unregistered_association", models.BooleanField(blank=True, default=False)),
                ("reservee_used_ad_login", models.BooleanField(blank=True, default=False)),
                (
                    "reservee_language",
                    models.CharField(
                        blank=True,
                        choices=[("fi", "Finnish"), ("en", "English"), ("sv", "Swedish"), ("", "")],
                        default="",
                        max_length=255,
                    ),
                ),
                (
                    "reservee_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("BUSINESS", "Business"),
                            ("NONPROFIT", "Nonprofit"),
                            ("INDIVIDUAL", "Individual"),
                        ],
                        max_length=50,
                        null=True,
                    ),
                ),
                ("billing_first_name", models.CharField(blank=True, default="", max_length=255)),
                ("billing_last_name", models.CharField(blank=True, default="", max_length=255)),
                ("billing_email", models.EmailField(blank=True, max_length=254, null=True)),
                ("billing_phone", models.CharField(blank=True, default="", max_length=255)),
                ("billing_address_street", models.CharField(blank=True, default="", max_length=255)),
                ("billing_address_city", models.CharField(blank=True, default="", max_length=255)),
                ("billing_address_zip", models.CharField(blank=True, default="", max_length=255)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reservations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "reservation",
                "ordering": ["begin"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="AbilityGroup",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.TextField(unique=True)),
                ("name_fi", models.TextField(null=True, unique=True)),
                ("name_en", models.TextField(null=True, unique=True)),
                ("name_sv", models.TextField(null=True, unique=True)),
            ],
            options={
                "db_table": "ability_group",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="AgeGroup",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("minimum", models.PositiveIntegerField()),
                ("maximum", models.PositiveIntegerField(blank=True, null=True)),
            ],
            options={
                "db_table": "age_group",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="RecurringReservation",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(blank=True, default="", max_length=255)),
                ("description", models.CharField(blank=True, default="", max_length=500)),
                ("uuid", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("begin_date", models.DateField(null=True)),
                ("begin_time", models.TimeField(null=True)),
                ("end_date", models.DateField(null=True)),
                ("end_time", models.TimeField(null=True)),
                ("recurrence_in_days", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "weekdays",
                    models.CharField(
                        blank=True,
                        choices=[
                            (0, "Monday"),
                            (1, "Tuesday"),
                            (2, "Wednesday"),
                            (3, "Thursday"),
                            (4, "Friday"),
                            (5, "Saturday"),
                            (6, "Sunday"),
                        ],
                        default="",
                        max_length=16,
                        validators=[
                            django.core.validators.RegexValidator(
                                re.compile("^\\d+(?:,\\d+)*\\Z"),
                                code="invalid",
                                message="Enter only digits separated by commas.",
                            )
                        ],
                    ),
                ),
                (
                    "ability_group",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="recurring_reservations",
                        to="tilavarauspalvelu.abilitygroup",
                    ),
                ),
                (
                    "age_group",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="recurring_reservations",
                        to="tilavarauspalvelu.agegroup",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "recurring_reservation",
                "ordering": ["begin_date", "begin_time", "reservation_unit"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationCancelReason",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("reason", models.CharField(max_length=255)),
                ("reason_fi", models.CharField(max_length=255, null=True)),
                ("reason_en", models.CharField(max_length=255, null=True)),
                ("reason_sv", models.CharField(max_length=255, null=True)),
            ],
            options={
                "db_table": "reservation_cancel_reason",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationDenyReason",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("rank", models.PositiveBigIntegerField(blank=True, db_index=True, null=True)),
                ("reason", models.CharField(max_length=255)),
                ("reason_fi", models.CharField(max_length=255, null=True)),
                ("reason_en", models.CharField(max_length=255, null=True)),
                ("reason_sv", models.CharField(max_length=255, null=True)),
            ],
            options={
                "db_table": "reservation_deny_reason",
                "ordering": ["rank"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationMetadataField",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("field_name", models.CharField(max_length=100, unique=True)),
            ],
            options={
                "verbose_name": "Reservation metadata field",
                "verbose_name_plural": "Reservation metadata fields",
                "db_table": "reservation_metadata_field",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationPurpose",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=200)),
                ("name_fi", models.CharField(max_length=200, null=True)),
                ("name_en", models.CharField(max_length=200, null=True)),
                ("name_sv", models.CharField(max_length=200, null=True)),
            ],
            options={
                "db_table": "reservation_purpose",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
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
                    django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(), size=None),
                ),
                ("buffered_start_datetime", models.DateTimeField()),
                ("buffered_end_datetime", models.DateTimeField()),
                ("is_blocking", models.BooleanField()),
                ("buffer_time_before", models.DurationField()),
                ("buffer_time_after", models.DurationField()),
            ],
            options={
                "verbose_name": "affecting time span",
                "verbose_name_plural": "affecting time spans",
                "db_table": "affecting_time_spans",
                "ordering": ["buffered_start_datetime", "reservation_id"],
                "managed": False,
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationStatistic",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("num_persons", models.PositiveIntegerField(blank=True, null=True)),
                ("state", models.CharField(max_length=255)),
                ("reservation_type", models.CharField(max_length=255, null=True)),
                ("begin", models.DateTimeField()),
                ("end", models.DateTimeField()),
                ("buffer_time_before", models.DurationField(blank=True, default=datetime.timedelta(0))),
                ("buffer_time_after", models.DurationField(blank=True, default=datetime.timedelta(0))),
                ("reservation_handled_at", models.DateTimeField(blank=True, null=True)),
                ("reservation_confirmed_at", models.DateTimeField(null=True)),
                ("reservation_created_at", models.DateTimeField(default=django.utils.timezone.now, null=True)),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("price_net", models.DecimalField(decimal_places=6, default=0, max_digits=20)),
                ("non_subsidised_price", models.DecimalField(decimal_places=2, default=0, max_digits=20)),
                ("non_subsidised_price_net", models.DecimalField(decimal_places=6, default=0, max_digits=20)),
                ("tax_percentage_value", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("applying_for_free_of_charge", models.BooleanField(blank=True, default=False)),
                ("reservee_id", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_organisation_name", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_address_zip", models.CharField(blank=True, default="", max_length=255)),
                (
                    "reservee_is_unregistered_association",
                    models.BooleanField(blank=True, default=False, null=True),
                ),
                ("reservee_language", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_type", models.CharField(blank=True, max_length=255, null=True)),
                ("primary_reservation_unit_name", models.CharField(max_length=255)),
                ("primary_unit_tprek_id", models.CharField(max_length=255, null=True)),
                ("primary_unit_name", models.CharField(max_length=255)),
                ("deny_reason_text", models.CharField(max_length=255)),
                ("cancel_reason_text", models.CharField(max_length=255)),
                ("purpose_name", models.CharField(blank=True, default="", max_length=255)),
                ("home_city_name", models.CharField(blank=True, default="", max_length=255)),
                ("home_city_municipality_code", models.CharField(default="", max_length=255)),
                ("age_group_name", models.CharField(blank=True, default="", max_length=255)),
                ("ability_group_name", models.TextField()),
                ("updated_at", models.DateTimeField(auto_now=True, null=True)),
                ("priority", models.IntegerField(blank=True, null=True)),
                ("priority_name", models.CharField(blank=True, default="", max_length=255)),
                ("duration_minutes", models.IntegerField()),
                ("is_subsidised", models.BooleanField(default=False)),
                ("is_recurring", models.BooleanField(default=False)),
                ("recurrence_begin_date", models.DateField(null=True)),
                ("recurrence_end_date", models.DateField(null=True)),
                ("recurrence_uuid", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_uuid", models.CharField(blank=True, default="", max_length=255)),
                ("reservee_used_ad_login", models.BooleanField(blank=True, default=False)),
                ("is_applied", models.BooleanField(blank=True, default=False)),
                (
                    "ability_group",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="tilavarauspalvelu.abilitygroup",
                    ),
                ),
                (
                    "age_group",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reservation_statistics",
                        to="tilavarauspalvelu.agegroup",
                    ),
                ),
                (
                    "cancel_reason",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reservation_statistics",
                        to="tilavarauspalvelu.reservationcancelreason",
                    ),
                ),
                (
                    "deny_reason",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reservation_statistics",
                        to="tilavarauspalvelu.reservationdenyreason",
                    ),
                ),
                (
                    "purpose",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reservation_statistics",
                        to="tilavarauspalvelu.reservationpurpose",
                    ),
                ),
                (
                    "reservation",
                    models.OneToOneField(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="tilavarauspalvelu.reservation",
                    ),
                ),
            ],
            options={
                "db_table": "reservation_statistic",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationStatisticsReservationUnit",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=255)),
                ("unit_name", models.CharField(max_length=255)),
                ("unit_tprek_id", models.CharField(max_length=255, null=True)),
                (
                    "reservation_statistics",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reservation_stats_reservation_units",
                        to="tilavarauspalvelu.reservationstatistic",
                    ),
                ),
            ],
            options={
                "db_table": "reservation_statistics_reservation_unit",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="RejectedOccurrence",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("begin_datetime", models.DateTimeField()),
                ("end_datetime", models.DateTimeField()),
                (
                    "rejection_reason",
                    graphene_django_extensions.fields.model.StrChoiceField(
                        choices=[
                            ("INTERVAL_NOT_ALLOWED", "Interval not allowed"),
                            ("OVERLAPPING_RESERVATIONS", "Overlapping reservations"),
                            ("RESERVATION_UNIT_CLOSED", "Reservation unit closed"),
                        ],
                        enum=tilavarauspalvelu.enums.RejectionReadinessChoice,
                        max_length=24,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "recurring_reservation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rejected_occurrences",
                        to="tilavarauspalvelu.recurringreservation",
                    ),
                ),
            ],
            options={
                "verbose_name": "Rejected occurrence",
                "verbose_name_plural": "Rejected occurrences",
                "db_table": "rejected_occurrence",
                "ordering": ["begin_datetime", "end_datetime"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationMetadataSet",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=100, unique=True)),
                (
                    "required_fields",
                    models.ManyToManyField(
                        blank=True,
                        related_name="metadata_sets_required",
                        to="tilavarauspalvelu.reservationmetadatafield",
                    ),
                ),
                (
                    "supported_fields",
                    models.ManyToManyField(
                        related_name="metadata_sets_supported", to="tilavarauspalvelu.reservationmetadatafield"
                    ),
                ),
            ],
            options={
                "verbose_name": "Reservation metadata set",
                "verbose_name_plural": "Reservation metadata sets",
                "db_table": "reservation_metadata_set",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        # Create relations.
        migrations.AddField(
            model_name="paymentorder",
            name="reservation",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="payment_order",
                to="tilavarauspalvelu.reservation",
            ),
        ),
        migrations.AddField(
            model_name="reservation",
            name="age_group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="tilavarauspalvelu.agegroup",
            ),
        ),
        migrations.AddField(
            model_name="reservation",
            name="recurring_reservation",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="reservations",
                to="tilavarauspalvelu.recurringreservation",
            ),
        ),
        migrations.AddField(
            model_name="reservation",
            name="cancel_reason",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="reservations",
                to="tilavarauspalvelu.reservationcancelreason",
            ),
        ),
        migrations.AddField(
            model_name="reservation",
            name="deny_reason",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="reservations",
                to="tilavarauspalvelu.reservationdenyreason",
            ),
        ),
        migrations.AddField(
            model_name="reservation",
            name="purpose",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="tilavarauspalvelu.reservationpurpose",
            ),
        ),
    ]
