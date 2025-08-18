from __future__ import annotations

from django.db import migrations

from utils.db import NowTT  # noqa: TID251


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0018_rename_email_types_part_3"),
    ]

    operations = [
        NowTT.migration(),
    ]
