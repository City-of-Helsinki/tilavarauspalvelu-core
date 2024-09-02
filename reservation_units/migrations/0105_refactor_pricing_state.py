# Generated by Django 5.0.8 on 2024-09-02 12:44

from django.db import migrations, models
from django.db.models import Count


def remove_duplicate_date_pricings(apps, schema_editor):
    apps.get_model("reservation_units", "ReservationUnit")
    ReservationUnitPricing = apps.get_model("reservation_units", "ReservationUnitPricing")

    duplicates_qs = (
        ReservationUnitPricing.objects.values("reservation_unit_id", "begins")
        .annotate(count=Count("begins"))
        .filter(count__gt=1)
    )
    for duplicate in duplicates_qs:
        # Delete all but the latest pricing with the same reservation_unit_id and begins, as it will be the active one
        for pricing in ReservationUnitPricing.objects.filter(
            reservation_unit_id=duplicate["reservation_unit_id"],
            begins=duplicate["begins"],
        ).order_by("-pk")[1:]:
            pricing.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("reservation_units", "0104_alter_reservationunit_reservation_kind"),
    ]

    operations = [
        migrations.RunPython(remove_duplicate_date_pricings, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="reservationunitpricing",
            name="status",
        ),
        migrations.AddField(
            model_name="reservationunitpricing",
            name="is_activated_on_begins",
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name="reservationunitpricing",
            constraint=models.UniqueConstraint(
                fields=("reservation_unit", "begins"),
                name="reservation_unit_begin_date_unique_together",
                violation_error_message="Pricing for this reservation unit already exists for this date.",
            ),
        ),
    ]
