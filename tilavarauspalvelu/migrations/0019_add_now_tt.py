# ruff: noqa: E501


from django.db import migrations

from utils.db import NowTT


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0018_rename_email_types_part_3"),
    ]

    operations = [
        NowTT.migration(),
    ]
