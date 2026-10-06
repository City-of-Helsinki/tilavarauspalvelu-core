from __future__ import annotations

from django.db import migrations


def rebuild_search_vectors(apps, schema_editor) -> None:
    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    ReservationUnit.objects.update_search_vectors()


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0175_remove_allow_reservations_without_opening_hours"),
    ]

    operations = [migrations.RunPython(rebuild_search_vectors, migrations.RunPython.noop)]
