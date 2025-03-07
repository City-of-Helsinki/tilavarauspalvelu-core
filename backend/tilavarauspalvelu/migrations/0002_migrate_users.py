import uuid

import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.contrib.postgres.operations import CreateExtension, HStoreExtension
from django.db import migrations, models

import tilavarauspalvelu.models.user.queryset


class Migration(migrations.Migration):
    # This is part of a migration trick that allows moving the user model from one app to another.
    # An empty migration file is needed so that `migrations.swappable_dependency(settings.AUTH_USER_MODEL)`
    # -migrations can safely run after the first migration in the app containing the user model has run.
    replaces = [
        ("tilavarauspalvelu", "0001_initial"),
    ]

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        ("helusers", "0002_add_oidcbackchannellogoutevent"),
    ]

    operations = [
        # Add the extensions.
        HStoreExtension(),
        CreateExtension("intarray"),  # Allows array indexing
        # Create models.
        migrations.CreateModel(
            name="User",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text=("Designates that this user has all permissions without explicitly assigning them."),
                        verbose_name="superuser status",
                    ),
                ),
                (
                    "username",
                    models.CharField(
                        error_messages={"unique": "A user with that username already exists."},
                        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
                        max_length=150,
                        unique=True,
                        validators=[django.contrib.auth.validators.UnicodeUsernameValidator()],
                        verbose_name="username",
                    ),
                ),
                ("first_name", models.CharField(blank=True, max_length=150, verbose_name="first name")),
                ("last_name", models.CharField(blank=True, max_length=150, verbose_name="last name")),
                ("email", models.EmailField(blank=True, max_length=254, verbose_name="email address")),
                (
                    "is_staff",
                    models.BooleanField(
                        default=False,
                        help_text="Designates whether the user can log into this admin site.",
                        verbose_name="staff status",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text=(
                            "Designates whether this user should be treated as active. "
                            "Unselect this instead of deleting accounts."
                        ),
                        verbose_name="active",
                    ),
                ),
                (
                    "date_joined",
                    models.DateTimeField(default=django.utils.timezone.now, verbose_name="date joined"),
                ),
                ("uuid", models.UUIDField(unique=True)),
                ("department_name", models.CharField(blank=True, max_length=50, null=True)),
                ("tvp_uuid", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                (
                    "preferred_language",
                    models.CharField(
                        blank=True,
                        choices=[("fi", "Finnish"), ("en", "English"), ("sv", "Swedish")],
                        max_length=8,
                        null=True,
                        verbose_name="Preferred UI language",
                    ),
                ),
                (
                    "reservation_notification",
                    models.CharField(
                        choices=[
                            ("all", "All"),
                            ("only_handling_required", "Only Handling Required"),
                            ("none", "None"),
                        ],
                        default="only_handling_required",
                        help_text="When user wants to receive reservation notification emails.",
                        max_length=32,
                        verbose_name="Reservation notification",
                    ),
                ),
                ("date_of_birth", models.DateField(null=True, verbose_name="Date of birth")),
                ("profile_id", models.CharField(blank=True, default="", max_length=255)),
                ("ad_groups", models.ManyToManyField(blank=True, to="helusers.adgroup")),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        help_text=(
                            "The groups this user belongs to. A user will get all permissions "
                            "granted to each of their groups."
                        ),
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Specific permissions for this user.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={
                "db_table": "user",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
            managers=[
                ("objects", tilavarauspalvelu.models.user.queryset.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name="ProfileUser",
            fields=[],
            options={
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("tilavarauspalvelu.user", models.Model),
        ),
        migrations.CreateModel(
            name="PersonalInfoViewLog",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("field", models.CharField(editable=False, max_length=255)),
                ("viewer_username", models.CharField(max_length=255)),
                ("access_time", models.DateTimeField(auto_now=True)),
                ("viewer_user_email", models.CharField(blank=True, default="", max_length=255)),
                ("viewer_user_full_name", models.CharField(blank=True, default="", max_length=255)),
                (
                    "user",
                    models.ForeignKey(
                        editable=False,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="personal_info_view_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "viewer_user",
                    models.ForeignKey(
                        editable=False,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="as_viewer_personal_info_view_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "personal_info_view_log",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
    ]
