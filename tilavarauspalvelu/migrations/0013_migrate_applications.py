import datetime

import django.contrib.postgres.fields
import django.core.validators
import django.db.models.constraints
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import tilavarauspalvelu.enums
import tilavarauspalvelu.models.organisation.model
import tilavarauspalvelu.utils.validators
import utils.fields.model


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0012_migrate_reservation_units"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="Address",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("street_address", models.TextField(max_length=80)),
                ("street_address_fi", models.TextField(max_length=80, null=True)),
                ("street_address_en", models.TextField(max_length=80, null=True)),
                ("street_address_sv", models.TextField(max_length=80, null=True)),
                ("post_code", models.CharField(max_length=32)),
                ("city", models.TextField(max_length=80)),
                ("city_fi", models.TextField(max_length=80, null=True)),
                ("city_en", models.TextField(max_length=80, null=True)),
                ("city_sv", models.TextField(max_length=80, null=True)),
            ],
            options={
                "verbose_name": "Address",
                "verbose_name_plural": "Addresses",
                "db_table": "address",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="AllocatedTimeSlot",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "day_of_the_week",
                    utils.fields.model.StrChoiceField(
                        choices=[
                            ("MONDAY", "Monday"),
                            ("TUESDAY", "Tuesday"),
                            ("WEDNESDAY", "Wednesday"),
                            ("THURSDAY", "Thursday"),
                            ("FRIDAY", "Friday"),
                            ("SATURDAY", "Saturday"),
                            ("SUNDAY", "Sunday"),
                        ],
                        enum=tilavarauspalvelu.enums.Weekday,
                        max_length=9,
                    ),
                ),
                ("begin_time", models.TimeField()),
                ("end_time", models.TimeField()),
            ],
            options={
                "verbose_name": "Allocated Time Slot",
                "verbose_name_plural": "Allocated Time Slots",
                "db_table": "allocated_time_slot",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="City",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=100)),
                ("name_fi", models.CharField(max_length=100, null=True)),
                ("name_en", models.CharField(max_length=100, null=True)),
                ("name_sv", models.CharField(max_length=100, null=True)),
                ("municipality_code", models.CharField(default="", max_length=30)),
            ],
            options={
                "verbose_name": "City",
                "verbose_name_plural": "Cities",
                "db_table": "city",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Person",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("first_name", models.CharField(max_length=50)),
                ("last_name", models.CharField(max_length=50)),
                ("email", models.EmailField(blank=True, max_length=254, null=True)),
                ("phone_number", models.CharField(blank=True, max_length=50, null=True)),
            ],
            options={
                "verbose_name": "Person",
                "verbose_name_plural": "Persons",
                "db_table": "person",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ApplicationRound",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                ("criteria", models.TextField(default="")),
                ("criteria_fi", models.TextField(default="", null=True)),
                ("criteria_en", models.TextField(default="", null=True)),
                ("criteria_sv", models.TextField(default="", null=True)),
                ("notes_when_applying", models.TextField(blank=True, default="")),
                ("notes_when_applying_fi", models.TextField(blank=True, default="", null=True)),
                ("notes_when_applying_en", models.TextField(blank=True, default="", null=True)),
                ("notes_when_applying_sv", models.TextField(blank=True, default="", null=True)),
                ("application_period_begin", models.DateTimeField()),
                ("application_period_end", models.DateTimeField()),
                ("reservation_period_begin", models.DateField()),
                ("reservation_period_end", models.DateField()),
                ("public_display_begin", models.DateTimeField()),
                ("public_display_end", models.DateTimeField()),
                ("handled_date", models.DateTimeField(blank=True, default=None, null=True)),
                ("sent_date", models.DateTimeField(blank=True, default=None, null=True)),
                (
                    "purposes",
                    models.ManyToManyField(
                        related_name="application_rounds", to="tilavarauspalvelu.reservationpurpose"
                    ),
                ),
                (
                    "reservation_units",
                    models.ManyToManyField(related_name="application_rounds", to="tilavarauspalvelu.reservationunit"),
                ),
                (
                    "terms_of_use",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="application_rounds",
                        to="tilavarauspalvelu.termsofuse",
                    ),
                ),
            ],
            options={
                "verbose_name": "Application Round",
                "verbose_name_plural": "Application Rounds",
                "db_table": "application_round",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Application",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "applicant_type",
                    utils.fields.model.StrChoiceField(
                        choices=[
                            ("INDIVIDUAL", "Individual"),
                            ("ASSOCIATION", "Association"),
                            ("COMMUNITY", "Community"),
                            ("COMPANY", "Company"),
                        ],
                        db_index=True,
                        enum=tilavarauspalvelu.enums.ApplicantTypeChoice,
                        max_length=11,
                        null=True,
                    ),
                ),
                ("created_date", models.DateTimeField(auto_now_add=True)),
                ("last_modified_date", models.DateTimeField(auto_now=True)),
                ("cancelled_date", models.DateTimeField(blank=True, default=None, null=True)),
                ("sent_date", models.DateTimeField(blank=True, default=None, null=True)),
                (
                    "in_allocation_notification_sent_date",
                    models.DateTimeField(blank=True, default=None, null=True),
                ),
                (
                    "results_ready_notification_sent_date",
                    models.DateTimeField(blank=True, default=None, null=True),
                ),
                ("additional_information", models.TextField(blank=True, null=True)),
                ("working_memo", models.TextField(blank=True, default="")),
                (
                    "billing_address",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="applications",
                        to="tilavarauspalvelu.address",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="applications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "application_round",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="applications",
                        to="tilavarauspalvelu.applicationround",
                    ),
                ),
                (
                    "home_city",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="applications",
                        to="tilavarauspalvelu.city",
                    ),
                ),
            ],
            options={
                "verbose_name": "Application",
                "verbose_name_plural": "Applications",
                "db_table": "application",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ApplicationSection",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=100)),
                ("num_persons", models.PositiveIntegerField()),
                ("reservations_begin_date", models.DateField()),
                ("reservations_end_date", models.DateField()),
                ("reservation_min_duration", models.DurationField()),
                ("reservation_max_duration", models.DurationField()),
                ("applied_reservations_per_week", models.PositiveIntegerField()),
                (
                    "age_group",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="application_sections",
                        to="tilavarauspalvelu.agegroup",
                    ),
                ),
                (
                    "application",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="application_sections",
                        to="tilavarauspalvelu.application",
                    ),
                ),
                (
                    "purpose",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="application_sections",
                        to="tilavarauspalvelu.reservationpurpose",
                    ),
                ),
            ],
            options={
                "verbose_name": "Application Section",
                "verbose_name_plural": "Application Sections",
                "db_table": "application_section",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Organisation",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                ("email", models.EmailField(blank=True, default="", max_length=254)),
                ("identifier", models.CharField(max_length=255, null=True)),
                (
                    "year_established",
                    models.PositiveIntegerField(
                        blank=True,
                        null=True,
                        validators=[tilavarauspalvelu.models.organisation.model.year_not_in_future],
                    ),
                ),
                ("active_members", models.PositiveIntegerField(null=True)),
                ("core_business", models.TextField(blank=True)),
                ("core_business_fi", models.TextField(blank=True, null=True)),
                ("core_business_en", models.TextField(blank=True, null=True)),
                ("core_business_sv", models.TextField(blank=True, null=True)),
                (
                    "organisation_type",
                    utils.fields.model.StrChoiceField(
                        choices=[
                            ("COMPANY", "Company"),
                            ("REGISTERED_ASSOCIATION", "Registered association"),
                            ("PUBLIC_ASSOCIATION", "Public association"),
                            ("UNREGISTERED_ASSOCIATION", "Unregistered association"),
                            ("MUNICIPALITY_CONSORTIUM", "Municipality consortium"),
                            ("RELIGIOUS_COMMUNITY", "Religious community"),
                        ],
                        default="COMPANY",
                        enum=tilavarauspalvelu.enums.OrganizationTypeChoice,
                        max_length=24,
                    ),
                ),
                (
                    "address",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="organisations",
                        to="tilavarauspalvelu.address",
                    ),
                ),
            ],
            options={
                "verbose_name": "Organisation",
                "verbose_name_plural": "Organisations",
                "db_table": "organisation",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationUnitOption",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("preferred_order", models.PositiveIntegerField()),
                ("rejected", models.BooleanField(blank=True, default=False)),
                ("locked", models.BooleanField(blank=True, default=False)),
                (
                    "application_section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reservation_unit_options",
                        to="tilavarauspalvelu.applicationsection",
                    ),
                ),
                (
                    "reservation_unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="reservation_unit_options",
                        to="tilavarauspalvelu.reservationunit",
                    ),
                ),
            ],
            options={
                "verbose_name": "Reservation Unit Option",
                "verbose_name_plural": "Reservation Unit Options",
                "db_table": "reservation_unit_option",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="SuitableTimeRange",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "priority",
                    utils.fields.model.StrChoiceField(
                        choices=[("PRIMARY", "Primary"), ("SECONDARY", "Secondary")],
                        enum=tilavarauspalvelu.enums.Priority,
                        max_length=9,
                    ),
                ),
                (
                    "day_of_the_week",
                    utils.fields.model.StrChoiceField(
                        choices=[
                            ("MONDAY", "Monday"),
                            ("TUESDAY", "Tuesday"),
                            ("WEDNESDAY", "Wednesday"),
                            ("THURSDAY", "Thursday"),
                            ("FRIDAY", "Friday"),
                            ("SATURDAY", "Saturday"),
                            ("SUNDAY", "Sunday"),
                        ],
                        enum=tilavarauspalvelu.enums.Weekday,
                        max_length=9,
                    ),
                ),
                ("begin_time", models.TimeField()),
                ("end_time", models.TimeField()),
                (
                    "application_section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="suitable_time_ranges",
                        to="tilavarauspalvelu.applicationsection",
                    ),
                ),
            ],
            options={
                "verbose_name": "Suitable Time Range",
                "verbose_name_plural": "Suitable Time Ranges",
                "db_table": "suitable_time_range",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ApplicationRoundTimeSlot",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "weekday",
                    utils.fields.model.IntChoiceField(
                        enum=tilavarauspalvelu.enums.WeekdayChoice,
                        validators=[
                            django.core.validators.MinValueValidator(
                                limit_value=0, message="Value must be between 0 and 6."
                            ),
                            django.core.validators.MaxValueValidator(
                                limit_value=6, message="Value must be between 0 and 6."
                            ),
                        ],
                    ),
                ),
                ("closed", models.BooleanField(default=False)),
                (
                    "reservable_times",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=django.contrib.postgres.fields.hstore.HStoreField(),
                        blank=True,
                        default=list,
                        size=None,
                        validators=[tilavarauspalvelu.utils.validators.validate_reservable_times],
                    ),
                ),
                (
                    "reservation_unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="application_round_time_slots",
                        to="tilavarauspalvelu.reservationunit",
                    ),
                ),
            ],
            options={
                "verbose_name": "Application Round Time Slot",
                "verbose_name_plural": "Application Round Time Slots",
                "db_table": "application_round_time_slot",
                "ordering": ["reservation_unit", "weekday"],
                "base_manager_name": "objects",
                "constraints": [
                    models.UniqueConstraint(
                        deferrable=django.db.models.constraints.Deferrable["DEFERRED"],
                        fields=("reservation_unit", "weekday"),
                        name="unique_reservation_unit_weekday",
                        violation_error_message="A reservation unit can only have one timeslot per weekday.",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(
                            models.Q(("closed", True), ("reservable_times__len", 0)),
                            models.Q(("closed", False), models.Q(("reservable_times__len", 0), _negated=True)),
                            _connector="OR",
                        ),
                        name="closed_no_slots_check",
                        violation_error_message=(
                            "Closed timeslots cannot have reservable times, but open timeslots must."
                        ),
                    ),
                ],
            },
        ),
        # Add relations.
        migrations.AddField(
            model_name="application",
            name="organisation",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="applications",
                to="tilavarauspalvelu.organisation",
            ),
        ),
        migrations.AddField(
            model_name="application",
            name="contact_person",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="applications",
                to="tilavarauspalvelu.person",
            ),
        ),
        migrations.AddField(
            model_name="allocatedtimeslot",
            name="reservation_unit_option",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="allocated_time_slots",
                to="tilavarauspalvelu.reservationunitoption",
            ),
        ),
        migrations.AddField(
            model_name="recurringreservation",
            name="allocated_time_slot",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="recurring_reservation",
                to="tilavarauspalvelu.allocatedtimeslot",
            ),
        ),
        migrations.AddField(
            model_name="reservation",
            name="home_city",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="home_city_reservation",
                to="tilavarauspalvelu.city",
            ),
        ),
        migrations.AddField(
            model_name="reservationstatistic",
            name="home_city",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservation_statistics",
                to="tilavarauspalvelu.city",
            ),
        ),
        # Add constraints.
        migrations.AddConstraint(
            model_name="applicationsection",
            constraint=models.CheckConstraint(
                condition=models.Q(("reservations_begin_date__lte", models.F("reservations_end_date"))),
                name="begin_date_before_end_date",
                violation_error_message="Reservations begin date must be before reservations end date.",
            ),
        ),
        migrations.AddConstraint(
            model_name="applicationsection",
            constraint=models.CheckConstraint(
                condition=models.Q(("reservation_min_duration__lte", models.F("reservation_max_duration"))),
                name="min_duration_not_greater_than_max_duration",
                violation_error_message=("Reservation min duration cannot be greater than reservation max duration."),
            ),
        ),
        migrations.AddConstraint(
            model_name="applicationsection",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    ("applied_reservations_per_week__gte", 1), ("applied_reservations_per_week__lte", 7)
                ),
                name="applied_reservations_per_week_from_1_to_7",
                violation_error_message="Can only apply from 1 to 7 reservations per week.",
            ),
        ),
        migrations.AddConstraint(
            model_name="applicationsection",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    (
                        "reservation_max_duration__in",
                        [
                            datetime.timedelta(seconds=1800),
                            datetime.timedelta(seconds=3600),
                            datetime.timedelta(seconds=5400),
                            datetime.timedelta(seconds=7200),
                            datetime.timedelta(seconds=9000),
                            datetime.timedelta(seconds=10800),
                            datetime.timedelta(seconds=12600),
                            datetime.timedelta(seconds=14400),
                            datetime.timedelta(seconds=16200),
                            datetime.timedelta(seconds=18000),
                            datetime.timedelta(seconds=19800),
                            datetime.timedelta(seconds=21600),
                            datetime.timedelta(seconds=23400),
                            datetime.timedelta(seconds=25200),
                            datetime.timedelta(seconds=27000),
                            datetime.timedelta(seconds=28800),
                            datetime.timedelta(seconds=30600),
                            datetime.timedelta(seconds=32400),
                            datetime.timedelta(seconds=34200),
                            datetime.timedelta(seconds=36000),
                            datetime.timedelta(seconds=37800),
                            datetime.timedelta(seconds=39600),
                            datetime.timedelta(seconds=41400),
                            datetime.timedelta(seconds=43200),
                            datetime.timedelta(seconds=45000),
                            datetime.timedelta(seconds=46800),
                            datetime.timedelta(seconds=48600),
                            datetime.timedelta(seconds=50400),
                            datetime.timedelta(seconds=52200),
                            datetime.timedelta(seconds=54000),
                            datetime.timedelta(seconds=55800),
                            datetime.timedelta(seconds=57600),
                            datetime.timedelta(seconds=59400),
                            datetime.timedelta(seconds=61200),
                            datetime.timedelta(seconds=63000),
                            datetime.timedelta(seconds=64800),
                            datetime.timedelta(seconds=66600),
                            datetime.timedelta(seconds=68400),
                            datetime.timedelta(seconds=70200),
                            datetime.timedelta(seconds=72000),
                            datetime.timedelta(seconds=73800),
                            datetime.timedelta(seconds=75600),
                            datetime.timedelta(seconds=77400),
                            datetime.timedelta(seconds=79200),
                            datetime.timedelta(seconds=81000),
                            datetime.timedelta(seconds=82800),
                            datetime.timedelta(seconds=84600),
                            datetime.timedelta(days=1),
                        ],
                    ),
                    (
                        "reservation_min_duration__in",
                        [
                            datetime.timedelta(seconds=1800),
                            datetime.timedelta(seconds=3600),
                            datetime.timedelta(seconds=5400),
                            datetime.timedelta(seconds=7200),
                            datetime.timedelta(seconds=9000),
                            datetime.timedelta(seconds=10800),
                            datetime.timedelta(seconds=12600),
                            datetime.timedelta(seconds=14400),
                            datetime.timedelta(seconds=16200),
                            datetime.timedelta(seconds=18000),
                            datetime.timedelta(seconds=19800),
                            datetime.timedelta(seconds=21600),
                            datetime.timedelta(seconds=23400),
                            datetime.timedelta(seconds=25200),
                            datetime.timedelta(seconds=27000),
                            datetime.timedelta(seconds=28800),
                            datetime.timedelta(seconds=30600),
                            datetime.timedelta(seconds=32400),
                            datetime.timedelta(seconds=34200),
                            datetime.timedelta(seconds=36000),
                            datetime.timedelta(seconds=37800),
                            datetime.timedelta(seconds=39600),
                            datetime.timedelta(seconds=41400),
                            datetime.timedelta(seconds=43200),
                            datetime.timedelta(seconds=45000),
                            datetime.timedelta(seconds=46800),
                            datetime.timedelta(seconds=48600),
                            datetime.timedelta(seconds=50400),
                            datetime.timedelta(seconds=52200),
                            datetime.timedelta(seconds=54000),
                            datetime.timedelta(seconds=55800),
                            datetime.timedelta(seconds=57600),
                            datetime.timedelta(seconds=59400),
                            datetime.timedelta(seconds=61200),
                            datetime.timedelta(seconds=63000),
                            datetime.timedelta(seconds=64800),
                            datetime.timedelta(seconds=66600),
                            datetime.timedelta(seconds=68400),
                            datetime.timedelta(seconds=70200),
                            datetime.timedelta(seconds=72000),
                            datetime.timedelta(seconds=73800),
                            datetime.timedelta(seconds=75600),
                            datetime.timedelta(seconds=77400),
                            datetime.timedelta(seconds=79200),
                            datetime.timedelta(seconds=81000),
                            datetime.timedelta(seconds=82800),
                            datetime.timedelta(seconds=84600),
                            datetime.timedelta(days=1),
                        ],
                    ),
                ),
                name="durations_multiple_of_30_minutes_max_24_hours",
                violation_error_message=(
                    "Reservation min and max durations must be multiples of 30 minutes, " "up to a maximum of 24 hours."
                ),
            ),
        ),
        migrations.AddConstraint(
            model_name="reservationunitoption",
            constraint=models.UniqueConstraint(
                deferrable=django.db.models.constraints.Deferrable["DEFERRED"],
                fields=("application_section", "preferred_order"),
                name="unique_application_section_preferred_order",
                violation_error_message="Preferred order must be unique for each application section",
            ),
        ),
        migrations.AddConstraint(
            model_name="allocatedtimeslot",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    ("begin_time__lt", models.F("end_time")),
                    models.Q(("end_time__hour", 0), models.Q(("begin_time__hour", 0), _negated=True)),
                    _connector="OR",
                ),
                name="begin_time_before_end_time_allocated",
                violation_error_message="Begin time must be before end time.",
            ),
        ),
        migrations.AddConstraint(
            model_name="suitabletimerange",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    ("begin_time__lt", models.F("end_time")),
                    models.Q(("end_time__hour", 0), models.Q(("begin_time__hour", 0), _negated=True)),
                    _connector="OR",
                ),
                name="begin_time_before_end_time_suitable",
                violation_error_message="Begin time must be before end time.",
            ),
        ),
        migrations.AddConstraint(
            model_name="suitabletimerange",
            constraint=models.CheckConstraint(
                condition=models.Q(("begin_time__minute", 0), ("end_time__minute", 0)),
                name="begin_and_end_time_multiple_of_60_minutes_suitable",
                violation_error_message="Begin and end times must be a multiples of 60 minutes.",
            ),
        ),
    ]
