import datetime
import uuid

import django.contrib.postgres.fields
import django.db.models.deletion
import easy_thumbnails.fields
import elasticsearch_django.models
from django.conf import settings
from django.db import migrations, models

import tilavarauspalvelu.models.reservation_unit_pricing.model


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0011_migrate_reservations"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="ReservationUnit",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("sku", models.CharField(blank=True, default="", max_length=255)),
                ("uuid", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("rank", models.PositiveIntegerField(blank=True, null=True)),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                ("description", models.TextField(blank=True, default="")),
                ("description_fi", models.TextField(blank=True, default="", null=True)),
                ("description_en", models.TextField(blank=True, default="", null=True)),
                ("description_sv", models.TextField(blank=True, default="", null=True)),
                ("contact_information", models.TextField(blank=True, default="")),
                ("terms_of_use", models.TextField(blank=True, max_length=2000, null=True)),
                ("terms_of_use_fi", models.TextField(blank=True, max_length=2000, null=True)),
                ("terms_of_use_en", models.TextField(blank=True, max_length=2000, null=True)),
                ("terms_of_use_sv", models.TextField(blank=True, max_length=2000, null=True)),
                ("reservation_pending_instructions", models.TextField(blank=True, default="")),
                ("reservation_pending_instructions_fi", models.TextField(blank=True, default="", null=True)),
                ("reservation_pending_instructions_en", models.TextField(blank=True, default="", null=True)),
                ("reservation_pending_instructions_sv", models.TextField(blank=True, default="", null=True)),
                ("reservation_confirmed_instructions", models.TextField(blank=True, default="")),
                ("reservation_confirmed_instructions_fi", models.TextField(blank=True, default="", null=True)),
                ("reservation_confirmed_instructions_en", models.TextField(blank=True, default="", null=True)),
                ("reservation_confirmed_instructions_sv", models.TextField(blank=True, default="", null=True)),
                ("reservation_cancelled_instructions", models.TextField(blank=True, default="")),
                ("reservation_cancelled_instructions_fi", models.TextField(blank=True, default="", null=True)),
                ("reservation_cancelled_instructions_en", models.TextField(blank=True, default="", null=True)),
                ("reservation_cancelled_instructions_sv", models.TextField(blank=True, default="", null=True)),
                ("surface_area", models.IntegerField(blank=True, null=True)),
                ("min_persons", models.PositiveIntegerField(blank=True, null=True)),
                ("max_persons", models.PositiveIntegerField(blank=True, null=True)),
                ("max_reservations_per_user", models.PositiveIntegerField(blank=True, null=True)),
                ("reservations_min_days_before", models.PositiveIntegerField(blank=True, null=True)),
                ("reservations_max_days_before", models.PositiveIntegerField(blank=True, null=True)),
                ("reservation_begins", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("reservation_ends", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("publish_begins", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("publish_ends", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("min_reservation_duration", models.DurationField(blank=True, null=True)),
                ("max_reservation_duration", models.DurationField(blank=True, null=True)),
                ("buffer_time_before", models.DurationField(blank=True, default=datetime.timedelta(0))),
                ("buffer_time_after", models.DurationField(blank=True, default=datetime.timedelta(0))),
                ("is_draft", models.BooleanField(blank=True, db_index=True, default=False)),
                ("is_archived", models.BooleanField(db_index=True, default=False)),
                ("require_introduction", models.BooleanField(default=False)),
                ("require_reservation_handling", models.BooleanField(blank=True, default=False)),
                ("reservation_block_whole_day", models.BooleanField(blank=True, default=False)),
                ("can_apply_free_of_charge", models.BooleanField(blank=True, default=False)),
                ("allow_reservations_without_opening_hours", models.BooleanField(default=False)),
                (
                    "authentication",
                    models.CharField(choices=[("weak", "Weak"), ("strong", "Strong")], default="weak", max_length=20),
                ),
                (
                    "reservation_start_interval",
                    models.CharField(
                        choices=[
                            ("interval_15_mins", "15 minutes"),
                            ("interval_30_mins", "30 minutes"),
                            ("interval_60_mins", "60 minutes"),
                            ("interval_90_mins", "90 minutes"),
                            ("interval_120_mins", "2 hours"),
                            ("interval_180_mins", "3 hours"),
                            ("interval_240_mins", "4 hours"),
                            ("interval_300_mins", "5 hours"),
                            ("interval_360_mins", "6 hours"),
                            ("interval_420_mins", "7 hours"),
                        ],
                        default="interval_15_mins",
                        max_length=20,
                    ),
                ),
                (
                    "reservation_kind",
                    models.CharField(
                        choices=[
                            ("direct", "Direct"),
                            ("season", "Season"),
                            ("direct_and_season", "Direct and season"),
                        ],
                        db_index=True,
                        default="direct_and_season",
                        max_length=20,
                    ),
                ),
                (
                    "cancellation_terms",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="cancellation_terms_reservation_unit",
                        to="tilavarauspalvelu.termsofuse",
                    ),
                ),
                (
                    "metadata_set",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reservation_units",
                        to="tilavarauspalvelu.reservationmetadataset",
                    ),
                ),
                (
                    "origin_hauki_resource",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reservation_units",
                        to="tilavarauspalvelu.originhaukiresource",
                    ),
                ),
                (
                    "payment_accounting",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="reservation_units",
                        to="tilavarauspalvelu.paymentaccounting",
                    ),
                ),
                (
                    "payment_merchant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="reservation_units",
                        to="tilavarauspalvelu.paymentmerchant",
                    ),
                ),
                (
                    "payment_product",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="reservation_units",
                        to="tilavarauspalvelu.paymentproduct",
                    ),
                ),
                (
                    "payment_terms",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payment_terms_reservation_unit",
                        to="tilavarauspalvelu.termsofuse",
                    ),
                ),
                (
                    "pricing_terms",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="pricing_terms_reservation_unit",
                        to="tilavarauspalvelu.termsofuse",
                    ),
                ),
                (
                    "resources",
                    models.ManyToManyField(
                        blank=True, related_name="reservation_units", to="tilavarauspalvelu.resource"
                    ),
                ),
                (
                    "service_specific_terms",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="service_specific_terms_reservation_unit",
                        to="tilavarauspalvelu.termsofuse",
                    ),
                ),
                (
                    "services",
                    models.ManyToManyField(
                        blank=True, related_name="reservation_units", to="tilavarauspalvelu.service"
                    ),
                ),
                (
                    "spaces",
                    models.ManyToManyField(blank=True, related_name="reservation_units", to="tilavarauspalvelu.space"),
                ),
                (
                    "unit",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="tilavarauspalvelu.unit",
                    ),
                ),
            ],
            options={
                "verbose_name": "Reservation Unit",
                "verbose_name_plural": "Reservation Units",
                "db_table": "reservation_unit",
                "ordering": ["rank", "id"],
                "base_manager_name": "objects",
            },
            bases=(elasticsearch_django.models.SearchDocumentMixin, models.Model),
        ),
        migrations.CreateModel(
            name="Equipment",
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
                "db_table": "equipment",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="EquipmentCategory",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=200)),
                ("name_fi", models.CharField(max_length=200, null=True)),
                ("name_en", models.CharField(max_length=200, null=True)),
                ("name_sv", models.CharField(max_length=200, null=True)),
                ("rank", models.PositiveIntegerField(blank=True, null=True)),
            ],
            options={
                "db_table": "equipment_category",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="KeywordCategory",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
            ],
            options={
                "db_table": "keyword_category",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="KeywordGroup",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                (
                    "keyword_category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="keyword_groups",
                        to="tilavarauspalvelu.keywordcategory",
                    ),
                ),
            ],
            options={
                "db_table": "keyword_group",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Purpose",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=200)),
                ("name_fi", models.CharField(max_length=200, null=True)),
                ("name_en", models.CharField(max_length=200, null=True)),
                ("name_sv", models.CharField(max_length=200, null=True)),
                ("rank", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "image",
                    easy_thumbnails.fields.ThumbnailerImageField(
                        null=True, upload_to="reservation_unit_purpose_images"
                    ),
                ),
            ],
            options={
                "db_table": "purpose",
                "ordering": ["rank"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Qualifier",
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
                "db_table": "qualifier",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationUnitCancellationRule",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                (
                    "can_be_cancelled_time_before",
                    models.DurationField(blank=True, default=datetime.timedelta(days=1), null=True),
                ),
                ("needs_handling", models.BooleanField(default=False)),
            ],
            options={
                "db_table": "reservation_unit_cancellation_rule",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationUnitPaymentType",
            fields=[
                ("code", models.CharField(max_length=32, primary_key=True, serialize=False)),
            ],
            options={
                "db_table": "reservation_unit_payment_type",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationUnitType",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                ("rank", models.PositiveIntegerField(blank=True, null=True)),
            ],
            options={
                "db_table": "reservation_unit_type",
                "ordering": ["rank"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="TaxPercentage",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("value", models.DecimalField(decimal_places=2, max_digits=5)),
            ],
            options={
                "db_table": "tax_percentage",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
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
                    django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(), size=None),
                ),
            ],
            options={
                "verbose_name": "reservation unit hierarchy",
                "verbose_name_plural": "reservation unit hierarchies",
                "db_table": "reservation_unit_hierarchy",
                "managed": False,
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Introduction",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("completed_at", models.DateTimeField()),
                (
                    "reservation_unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="tilavarauspalvelu.reservationunit"
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
            options={
                "db_table": "introduction",
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Keyword",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                (
                    "keyword_group",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="keywords",
                        to="tilavarauspalvelu.keywordgroup",
                    ),
                ),
            ],
            options={
                "db_table": "keyword",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationUnitImage",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "image",
                    easy_thumbnails.fields.ThumbnailerImageField(null=True, upload_to="reservation_unit_images"),
                ),
                (
                    "image_type",
                    models.CharField(
                        choices=[
                            ("main", "Main image"),
                            ("ground_plan", "Ground plan"),
                            ("map", "Map"),
                            ("other", "Other"),
                        ],
                        max_length=20,
                    ),
                ),
                ("large_url", models.URLField(blank=True, default="", max_length=255)),
                ("medium_url", models.URLField(blank=True, default="", max_length=255)),
                ("small_url", models.URLField(blank=True, default="", max_length=255)),
                (
                    "reservation_unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="tilavarauspalvelu.reservationunit",
                    ),
                ),
            ],
            options={
                "db_table": "reservation_unit_image",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ReservationUnitPricing",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("begins", models.DateField()),
                (
                    "pricing_type",
                    models.CharField(
                        blank=True, choices=[("paid", "Paid"), ("free", "Free")], max_length=20, null=True
                    ),
                ),
                (
                    "price_unit",
                    models.CharField(
                        choices=[
                            ("per_15_mins", "per 15 minutes"),
                            ("per_30_mins", "per 30 minutes"),
                            ("per_hour", "per hour"),
                            ("per_half_day", "per half a day"),
                            ("per_day", "per day"),
                            ("per_week", "per week"),
                            ("fixed", "fixed"),
                        ],
                        default="per_hour",
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[("past", "past"), ("active", "active"), ("future", "future")], max_length=20
                    ),
                ),
                ("lowest_price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("highest_price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                (
                    "reservation_unit",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pricings",
                        to="tilavarauspalvelu.reservationunit",
                    ),
                ),
                (
                    "tax_percentage",
                    models.ForeignKey(
                        default=tilavarauspalvelu.models.reservation_unit_pricing.model.get_default_tax_percentage,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="reservation_unit_pricings",
                        to="tilavarauspalvelu.taxpercentage",
                    ),
                ),
            ],
            options={
                "db_table": "reservation_unit_pricing",
                "ordering": ["pk"],
                "base_manager_name": "objects",
                "constraints": [
                    models.CheckConstraint(
                        condition=models.Q(("lowest_price__lte", models.F("highest_price"))),
                        name="lower_price_greater_than_highest_price",
                        violation_error_message="Lowest price can not be greater than highest price.",
                    )
                ],
            },
        ),
        # Create relations.
        migrations.AddField(
            model_name="recurringreservation",
            name="reservation_unit",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="recurring_reservations",
                to="tilavarauspalvelu.reservationunit",
            ),
        ),
        migrations.AddField(
            model_name="reservation",
            name="reservation_unit",
            field=models.ManyToManyField(to="tilavarauspalvelu.reservationunit"),
        ),
        migrations.AddField(
            model_name="reservationstatistic",
            name="primary_reservation_unit",
            field=models.ForeignKey(
                null=True, on_delete=django.db.models.deletion.SET_NULL, to="tilavarauspalvelu.reservationunit"
            ),
        ),
        migrations.AddField(
            model_name="reservationstatisticsreservationunit",
            name="reservation_unit",
            field=models.ForeignKey(
                null=True, on_delete=django.db.models.deletion.SET_NULL, to="tilavarauspalvelu.reservationunit"
            ),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="equipments",
            field=models.ManyToManyField(blank=True, to="tilavarauspalvelu.equipment"),
        ),
        migrations.AddField(
            model_name="equipment",
            name="category",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="equipment",
                to="tilavarauspalvelu.equipmentcategory",
            ),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="keyword_groups",
            field=models.ManyToManyField(
                blank=True, related_name="reservation_units", to="tilavarauspalvelu.keywordgroup"
            ),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="purposes",
            field=models.ManyToManyField(blank=True, related_name="reservation_units", to="tilavarauspalvelu.purpose"),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="qualifiers",
            field=models.ManyToManyField(
                blank=True, related_name="reservation_units", to="tilavarauspalvelu.qualifier"
            ),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="cancellation_rule",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="tilavarauspalvelu.reservationunitcancellationrule",
            ),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="payment_types",
            field=models.ManyToManyField(blank=True, to="tilavarauspalvelu.reservationunitpaymenttype"),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="reservation_unit_type",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservation_units",
                to="tilavarauspalvelu.reservationunittype",
            ),
        ),
    ]
