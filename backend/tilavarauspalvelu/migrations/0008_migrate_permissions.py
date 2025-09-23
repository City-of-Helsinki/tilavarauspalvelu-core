from __future__ import annotations

from typing import Any

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import tilavarauspalvelu.enums


class StrChoiceField(models.CharField):
    """CharField for TextChoices that automatically sets 'max_length' to the length of the longest choice."""

    def __init__(self, enum: type[models.Choices], **kwargs: Any) -> None:
        self.enum = enum
        kwargs["max_length"] = max(len(val) for val, _ in enum.choices)
        kwargs["choices"] = enum.choices
        super().__init__(**kwargs)

    def deconstruct(self) -> tuple[str, str, list[Any], dict[str, Any]]:
        name, path, args, kwargs = super().deconstruct()
        kwargs["enum"] = self.enum
        return name, path, args, kwargs


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0007_migrate_spaces"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="GeneralRole",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "role",
                    StrChoiceField(
                        choices=[
                            ("ADMIN", "Admin"),
                            ("HANDLER", "Handler"),
                            ("VIEWER", "Viewer"),
                            ("RESERVER", "Reserver"),
                            ("NOTIFICATION_MANAGER", "Notification manager"),
                        ],
                        enum=tilavarauspalvelu.enums.UserRoleChoice,
                        max_length=20,
                    ),
                ),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("modified", models.DateTimeField(auto_now=True)),
                (
                    "assigner",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="general_roles",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "General role",
                "verbose_name_plural": "General roles",
                "db_table": "general_role",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="UnitRole",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "role",
                    StrChoiceField(
                        choices=[
                            ("ADMIN", "Admin"),
                            ("HANDLER", "Handler"),
                            ("VIEWER", "Viewer"),
                            ("RESERVER", "Reserver"),
                            ("NOTIFICATION_MANAGER", "Notification manager"),
                        ],
                        enum=tilavarauspalvelu.enums.UserRoleChoice,
                        max_length=20,
                    ),
                ),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("modified", models.DateTimeField(auto_now=True)),
                (
                    "assigner",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "unit_groups",
                    models.ManyToManyField(blank=True, related_name="unit_roles", to="tilavarauspalvelu.unitgroup"),
                ),
                (
                    "units",
                    models.ManyToManyField(blank=True, related_name="unit_roles", to="tilavarauspalvelu.unit"),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="unit_roles",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Unit role",
                "verbose_name_plural": "Unit roles",
                "db_table": "unit_role",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
    ]
