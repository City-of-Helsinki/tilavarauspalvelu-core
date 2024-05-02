from __future__ import annotations

import uuid
from functools import cached_property
from typing import TYPE_CHECKING, Self

from django.conf import settings
from django.contrib.postgres.aggregates import StringAgg
from django.db import models
from django.db.models.functions import Cast, Concat
from django.utils.timezone import get_default_timezone
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin
from helusers.models import AbstractUser

from common.db import SubqueryArray
from users.helauth.typing import IDToken
from users.helauth.utils import get_jwt_payload

if TYPE_CHECKING:
    from social_django.models import UserSocialAuth


DEFAULT_TIMEZONE = get_default_timezone()


__all__ = [
    "PersonalInfoViewLog",
    "ProfileUser",
    "ReservationNotification",
    "User",
    "get_user",
]


class ReservationNotification(models.TextChoices):
    ALL = "all"
    ONLY_HANDLING_REQUIRED = "only_handling_required"
    NONE = "none"


class User(AbstractUser):
    tvp_uuid = models.UUIDField(
        default=uuid.uuid4,
        null=False,
        editable=False,
        unique=True,
    )
    preferred_language: str | None = models.CharField(
        max_length=8,
        null=True,
        blank=True,
        verbose_name=_("Preferred UI language"),
        choices=settings.LANGUAGES,
    )
    reservation_notification = models.CharField(
        max_length=32,
        verbose_name=_("Reservation notification"),
        choices=ReservationNotification.choices,
        blank=False,
        null=False,
        default=ReservationNotification.ONLY_HANDLING_REQUIRED,
        help_text="When user wants to receive reservation notification emails.",
    )
    date_of_birth = models.DateField(
        verbose_name=_("Date of birth"),
        null=True,
    )
    profile_id = models.CharField(
        max_length=255,
        null=False,
        blank=True,
        default="",
    )

    class Meta:
        db_table = "user"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        default = super().__str__()
        if self.last_login:
            return f"{default} - {self.last_login.astimezone(DEFAULT_TIMEZONE).strftime('%d.%m.%Y %H:%M')}"
        return default

    def get_display_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def get_preferred_language(self) -> str:
        return self.preferred_language or settings.LANGUAGES[0][0]

    @cached_property
    def has_staff_permissions(self) -> bool:
        return (
            self.is_superuser  #
            or bool(self.general_permissions)
            or bool(self.unit_permissions)
            or bool(self.unit_group_permissions)
        )

    @cached_property
    def general_permissions(self) -> list[str]:
        """Get general permissions for the user."""
        # Could have been annotated in `get_user`, so use the annotated value if available.
        if hasattr(self, "_general_permissions"):
            return self._general_permissions

        from permissions.models import GeneralRole

        return list(
            GeneralRole.objects.filter(user__pk=self.pk)
            .values_list("role__permissions__permission", flat=True)
            .distinct()
        )

    @cached_property
    def unit_permissions(self) -> dict[int, list[str]]:
        """Get unit permissions by unit id for the user."""
        perms: dict[int, list[str]] = {}

        # Could have been annotated in `get_user`, so use the annotated value if available.
        if hasattr(self, "_unit_permissions"):
            item: str
            for item in self._unit_permissions:
                units, permission = item.split(":")
                for unit in units.split(","):
                    perms.setdefault(int(unit), []).append(permission)
            return perms

        from permissions.models import UnitRolePermission

        unit_perms: list[dict[str, str]] = list(
            UnitRolePermission.objects.select_related("role")
            .prefetch_related("role__unitrole__unit")
            .filter(role__unitrole__user__pk=self.pk, role__unitrole__unit__isnull=False)
            .annotate(
                units=StringAgg(
                    Cast("role__unitrole__unit", output_field=models.CharField()),
                    delimiter=",",
                ),
            )
            .values("permission", "units")
        )

        for perm in unit_perms:
            for unit in perm["units"].split(","):
                perms.setdefault(int(unit), []).append(perm["permission"])
        return perms

    @cached_property
    def unit_group_permissions(self) -> dict[int, list[str]]:
        """Get unit permissions by unit group id for the user."""
        perms: dict[int, list[str]] = {}

        # Could have been annotated in `get_user`, so use the annotated value if available.
        if hasattr(self, "_unit_group_permissions"):
            item: str
            for item in self._unit_group_permissions:
                unit_groups, permission = item.split(":")
                for unit_group in unit_groups.split(","):
                    perms.setdefault(int(unit_group), []).append(permission)
            return perms

        from permissions.models import UnitRolePermission

        unit_group_perms: list[dict[str, str]] = list(
            UnitRolePermission.objects.select_related("role")
            .prefetch_related("role__unitrole__unit_group")
            .filter(role__unitrole__user__pk=self.pk, role__unitrole__unit_group__isnull=False)
            .annotate(
                unit_groups=StringAgg(
                    Cast("role__unitrole__unit_group", output_field=models.CharField()),
                    delimiter=",",
                ),
            )
            .values("permission", "unit_groups")
        )

        for perm in unit_group_perms:
            for unit_group in perm["unit_groups"].split(","):
                perms.setdefault(int(unit_group), []).append(perm["permission"])
        return perms

    @property
    def current_social_auth(self) -> UserSocialAuth | None:
        # After login in once, the user will have a UserSocialAuth entry created for it.
        # This entry is updated when the user logs in again, so we can use it to get the
        # latest login information. If the user has multiple entries (for some reason),
        # we use the latest modified one.
        return self.social_auth.order_by("-modified").first()

    @property
    def id_token(self) -> IDToken | None:
        social_auth = self.current_social_auth
        if social_auth is None:
            return None

        payload = get_jwt_payload(social_auth.extra_data["id_token"])
        return IDToken(
            iss=payload.get("iss"),
            sub=payload.get("sub"),
            aud=payload.get("aud"),
            exp=payload.get("exp"),
            iat=payload.get("iat"),
            auth_time=payload.get("auth_time"),
            nonce=payload.get("nonce"),
            at_hash=payload.get("at_hash"),
            email=payload.get("email"),
            email_verified=payload.get("email_verified"),
            ad_groups=payload.get("ad_groups"),
            azp=payload.get("azp"),
            sid=payload.get("sid"),
            amr=payload.get("amr"),
            loa=payload.get("loa"),
        )


class PersonalInfoViewLog(models.Model):
    field = models.CharField(max_length=255, null=False, blank=False, editable=False)
    user = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="personal_info_view_logs",
        editable=False,
    )
    viewer_username = models.CharField(max_length=255)
    viewer_user = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="as_viewer_personal_info_view_logs",
        editable=False,
    )
    access_time = models.DateTimeField(auto_now=True, editable=False)
    viewer_user_email = models.CharField(max_length=255, default="", blank=True)
    viewer_user_full_name = models.CharField(max_length=255, default="", blank=True)

    class Meta:
        db_table = "personal_info_view_log"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return f"{self.viewer_username} viewed {self.user}'s {self.field} at {self.access_time}"


class ProfileUser(SerializableMixin, User):
    class Meta:
        proxy = True

    # For GDPR API
    serialize_fields = (
        {"name": "user", "accessor": lambda user: user.get_full_name()},
        {"name": "email"},
        {"name": "date_of_birth"},
        {"name": "reservations"},
        {"name": "applications"},
    )

    @property
    def user(self) -> Self:
        """Needed for `helsinki_gdpr.views.GDPRScopesPermission.has_object_permission`"""
        return self


def get_user(pk: int) -> User | None:
    """
    This method is called by the authentication backends to fetch the request user object.
    Any optimization for fetching the user should be done here.
    """
    from permissions.models import GeneralRolePermission, UnitRolePermission

    try:
        # Annotate permissions to the user object, since they are used so often.
        # These permissions can then be accessed from corresponding properties of the user object,
        # without the underscore prefix. The data is modifier slightly in said properties,
        # see the specific properties for more information.
        return User.objects.annotate(
            # General Permissions in form: ["<permission>", ...]
            _general_permissions=SubqueryArray(
                queryset=(
                    GeneralRolePermission.objects.filter(
                        role__generalrole__user__pk=pk,
                    ).values("permission")
                ),
                agg_field="permission",
                distinct=True,
                output_field=models.CharField(),
                coalesce_output_type="varchar",
            ),
            # Unit Permissions in form: ["<id>,<id>:<permission>", ...]
            _unit_permissions=SubqueryArray(
                queryset=(
                    UnitRolePermission.objects.filter(
                        role__unitrole__user__pk=pk,
                        role__unitrole__unit__isnull=False,
                    )
                    .alias(
                        units=StringAgg(
                            Cast("role__unitrole__unit", output_field=models.CharField()),
                            delimiter=",",
                        ),
                    )
                    .annotate(
                        unit_to_permission=Concat(
                            models.F("units"),
                            models.Value(":"),
                            models.F("permission"),
                            output_field=models.CharField(),
                        ),
                    )
                    .values("unit_to_permission")
                ),
                agg_field="unit_to_permission",
                distinct=True,
                output_field=models.CharField(),
                coalesce_output_type="varchar",
            ),
            # Unit Group Permissions in form: ["<id>,<id>:<permission>", ...]
            _unit_group_permissions=SubqueryArray(
                queryset=(
                    UnitRolePermission.objects.filter(
                        role__unitrole__user__pk=pk,
                        role__unitrole__unit_group__isnull=False,
                    )
                    .alias(
                        unit_groups=StringAgg(
                            Cast("role__unitrole__unit_group", output_field=models.CharField()),
                            delimiter=",",
                        ),
                    )
                    .annotate(
                        unit_group_to_permission=Concat(
                            models.F("unit_groups"),
                            models.Value(":"),
                            models.F("permission"),
                            output_field=models.CharField(),
                        ),
                    )
                    .values("unit_group_to_permission")
                ),
                agg_field="unit_group_to_permission",
                distinct=True,
                output_field=models.CharField(),
                coalesce_output_type="varchar",
            ),
        ).get(pk=pk)
    except User.DoesNotExist:
        return None
