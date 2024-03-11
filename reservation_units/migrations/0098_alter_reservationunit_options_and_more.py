# Generated by Django 5.0.3 on 2024-03-11 12:18

import datetime

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("merchants", "0015_change_database_table_names"),
        ("reservation_units", "0097_reservation_interval_choices"),
        ("reservations", "0064_alter_reservationstatistic_priority"),
        ("resources", "0009_change_database_table_names"),
        ("services", "0004_change_database_table_names"),
        ("spaces", "0036_change_database_table_names"),
        ("terms_of_use", "0004_change_database_table_names"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="reservationunit",
            options={
                "base_manager_name": "objects",
                "ordering": ["rank", "id"],
                "verbose_name": "Reservation Unit",
                "verbose_name_plural": "Reservation Units",
            },
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="allow_reservations_without_opening_hours",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="authentication",
            field=models.CharField(choices=[("weak", "Weak"), ("strong", "Strong")], default="weak", max_length=20),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="buffer_time_after",
            field=models.DurationField(blank=True, default=datetime.timedelta(0)),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="buffer_time_before",
            field=models.DurationField(blank=True, default=datetime.timedelta(0)),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="can_apply_free_of_charge",
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="cancellation_terms",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cancellation_terms_reservation_unit",
                to="terms_of_use.termsofuse",
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="contact_information",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="description_en",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="description_fi",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="description_sv",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="equipments",
            field=models.ManyToManyField(blank=True, to="reservation_units.equipment"),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="is_archived",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="is_draft",
            field=models.BooleanField(blank=True, db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="keyword_groups",
            field=models.ManyToManyField(
                blank=True, related_name="reservation_units", to="reservation_units.keywordgroup"
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="max_persons",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="max_reservation_duration",
            field=models.DurationField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="max_reservations_per_user",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="metadata_set",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservation_units",
                to="reservations.reservationmetadataset",
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="min_persons",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="min_reservation_duration",
            field=models.DurationField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="name",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="name_en",
            field=models.CharField(max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="name_fi",
            field=models.CharField(max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="name_sv",
            field=models.CharField(max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="payment_accounting",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="reservation_units",
                to="merchants.paymentaccounting",
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="payment_merchant",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="reservation_units",
                to="merchants.paymentmerchant",
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="payment_product",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="reservation_units",
                to="merchants.paymentproduct",
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="payment_terms",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="payment_terms_reservation_unit",
                to="terms_of_use.termsofuse",
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="pricing_terms",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="pricing_terms_reservation_unit",
                to="terms_of_use.termsofuse",
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="publish_begins",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="publish_ends",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="purposes",
            field=models.ManyToManyField(blank=True, related_name="reservation_units", to="reservation_units.purpose"),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="qualifiers",
            field=models.ManyToManyField(
                blank=True, related_name="reservation_units", to="reservation_units.qualifier"
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="rank",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="require_introduction",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="require_reservation_handling",
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_begins",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_cancelled_instructions",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_cancelled_instructions_en",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_cancelled_instructions_fi",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_cancelled_instructions_sv",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_confirmed_instructions",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_confirmed_instructions_en",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_confirmed_instructions_fi",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_confirmed_instructions_sv",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_ends",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_kind",
            field=models.CharField(
                choices=[("direct", "Direct"), ("season", "Season"), ("direct_and_season", "Direct And Season")],
                default="direct_and_season",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_pending_instructions",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_pending_instructions_en",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_pending_instructions_fi",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_pending_instructions_sv",
            field=models.TextField(blank=True, default="", null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_start_interval",
            field=models.CharField(
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
        migrations.AlterField(
            model_name="reservationunit",
            name="reservation_unit_type",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservation_units",
                to="reservation_units.reservationunittype",
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservations_max_days_before",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="reservations_min_days_before",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="resources",
            field=models.ManyToManyField(blank=True, related_name="reservation_units", to="resources.resource"),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="service_specific_terms",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="service_specific_terms_reservation_unit",
                to="terms_of_use.termsofuse",
            ),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="services",
            field=models.ManyToManyField(blank=True, related_name="reservation_units", to="services.service"),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="sku",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="spaces",
            field=models.ManyToManyField(blank=True, related_name="reservation_units", to="spaces.space"),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="surface_area",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="terms_of_use",
            field=models.TextField(blank=True, max_length=2000, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="terms_of_use_en",
            field=models.TextField(blank=True, max_length=2000, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="terms_of_use_fi",
            field=models.TextField(blank=True, max_length=2000, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="terms_of_use_sv",
            field=models.TextField(blank=True, max_length=2000, null=True),
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="unit",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="spaces.unit"
            ),
        ),
    ]