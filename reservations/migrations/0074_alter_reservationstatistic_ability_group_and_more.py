# Generated by Django 5.0.6 on 2024-06-12 10:00

import datetime

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0090_add_application_notification_dates"),
        ("reservations", "0073_affectingtimespan"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reservationstatistic",
            name="ability_group",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="reservations.abilitygroup"
            ),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="ability_group_name",
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="age_group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservation_statistics",
                to="reservations.agegroup",
            ),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="applying_for_free_of_charge",
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="begin",
            field=models.DateTimeField(),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="buffer_time_after",
            field=models.DurationField(blank=True, default=datetime.timedelta(0)),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="buffer_time_before",
            field=models.DurationField(blank=True, default=datetime.timedelta(0)),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="cancel_reason",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservation_statistics",
                to="reservations.reservationcancelreason",
            ),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="cancel_reason_text",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="deny_reason",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservation_statistics",
                to="reservations.reservationdenyreason",
            ),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="deny_reason_text",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="duration_minutes",
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="end",
            field=models.DateTimeField(),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="home_city",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservation_statistics",
                to="applications.city",
            ),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="home_city_municipality_code",
            field=models.CharField(default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="home_city_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="is_applied",
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="is_recurring",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="is_subsidised",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="non_subsidised_price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=20),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="non_subsidised_price_net",
            field=models.DecimalField(decimal_places=6, default=0, max_digits=20),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="num_persons",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="price_net",
            field=models.DecimalField(decimal_places=6, default=0, max_digits=20),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="primary_reservation_unit_name",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="primary_unit_name",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="primary_unit_tprek_id",
            field=models.CharField(max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="priority",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="purpose",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservation_statistics",
                to="reservations.reservationpurpose",
            ),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="purpose_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="recurrence_begin_date",
            field=models.DateField(null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="recurrence_end_date",
            field=models.DateField(null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="recurrence_uuid",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservation_confirmed_at",
            field=models.DateTimeField(null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservation_created_at",
            field=models.DateTimeField(default=django.utils.timezone.now, null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservation_handled_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservation_type",
            field=models.CharField(max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservee_is_unregistered_association",
            field=models.BooleanField(blank=True, default=False, null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservee_language",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservee_type",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservee_uuid",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="state",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="tax_percentage_value",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
        ),
        migrations.AlterField(
            model_name="reservationstatisticsreservationunit",
            name="name",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatisticsreservationunit",
            name="unit_name",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="reservationstatisticsreservationunit",
            name="unit_tprek_id",
            field=models.CharField(max_length=255, null=True),
        ),
    ]
