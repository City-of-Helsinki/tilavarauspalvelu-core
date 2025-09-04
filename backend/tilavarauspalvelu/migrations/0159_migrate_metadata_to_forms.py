from __future__ import annotations

import itertools

from django.contrib.postgres.aggregates import ArrayAgg
from django.db import migrations, models


def migrate_metadata_to_forms(apps, schema_editor):
    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")

    chunk_size = 1_000

    reservation_units = (
        ReservationUnit.objects.filter(
            # This is the default form type, so it might be wrong for new reservation units
            # where the form type has not been set correctly during unit creation.
            reservation_form="CONTACT_INFO_FORM",
        )
        .alias(
            supported_fields=ArrayAgg("metadata_set__supported_fields__field_name"),
        )
        .annotate(
            required_form=models.Case(
                models.When(
                    models.Q(supported_fields__contains=["age_group"]),
                    then=models.Value("AGE_GROUP_FORM"),
                ),
                models.When(
                    models.Q(supported_fields__contains=["purpose"]),
                    then=models.Value("PURPOSE_FORM"),
                ),
                models.When(
                    models.Q(supported_fields__contains=["reservee_identifier"]),
                    then=models.Value("RESERVEE_INFO_FORM"),
                ),
                default=models.Value("CONTACT_INFO_FORM"),
                output_field=models.CharField(),
            )
        )
        .values("pk", "required_form")
        .iterator(chunk_size=chunk_size)
    )

    for reservations_batch in itertools.batched(reservation_units, chunk_size, strict=False):
        pks = set()
        whens = []

        for item in reservations_batch:
            when = models.When(
                condition=models.Q(pk=item["pk"]),
                then=models.Value(item["required_form"]),
            )
            whens.append(when)
            pks.add(item["pk"])

        ReservationUnit.objects.filter(pk__in=pks).update(
            reservation_form=models.Case(
                *whens,
                default=models.F("reservation_form"),
                output_field=models.CharField(),
            )
        )


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0158_remove_form_field_choices"),
    ]

    operations = [
        migrations.RunPython(
            code=migrate_metadata_to_forms,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
