from django.db import migrations, models
from django.db.models.functions import Coalesce


def determine_preferred_language(apps, schema_editor):
    User = apps.get_model("tilavarauspalvelu", "User")
    Reservation = apps.get_model("tilavarauspalvelu", "Reservation")

    User.objects.filter(preferred_language=None).alias(
        latest_reservation_language=Coalesce(
            # Use the latest reservation language
            models.Subquery(
                Reservation.objects.filter(user=models.OuterRef("pk"))
                .order_by("-created_at")
                .values("reservee_language")[:1]
            ),
            # Fallback to the finnish.
            models.Value("fi"),
        ),
    ).update(preferred_language=models.F("latest_reservation_language"))


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0014_migrate_common"),
    ]

    operations = [
        migrations.RunPython(
            code=determine_preferred_language,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
