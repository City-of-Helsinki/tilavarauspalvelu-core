from __future__ import annotations

import uuid
from functools import cached_property
from typing import TYPE_CHECKING, Literal, Self

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.db import models
from django.utils.timezone import get_default_timezone
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin
from helusers.models import AbstractUser

from permissions.enums import UserPermissionChoice, UserRoleChoice
from permissions.permission_resolver import PermissionResolver
from users.helauth.typing import ExtraData, IDToken
from users.helauth.utils import get_jwt_payload

if TYPE_CHECKING:
    from social_django.models import UserSocialAuth

    from permissions.models import UnitRole


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

    permissions = PermissionResolver()

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

    def get_preferred_language(self) -> Literal["fi", "sv", "en"]:
        return self.preferred_language or settings.LANGUAGES[0][0]

    @property
    def general_roles_list(self) -> list[UserRoleChoice]:
        """Get the user's general roles."""
        if hasattr(self, "_general_roles"):
            return self._general_roles

        self._general_roles = [UserRoleChoice(role) for role in self.general_roles.values_list("role", flat=True)]
        return self._general_roles

    @property
    def general_permissions_list(self) -> list[UserPermissionChoice]:
        """Get the user's general permissions."""
        if hasattr(self, "_general_permissions"):
            return self._general_permissions
        roles = self.general_roles_list
        self._general_permissions = sorted({permission for role in roles for permission in role.permissions})
        return self._general_permissions

    @property
    def unit_roles_map(self) -> dict[int, list[UserRoleChoice]]:
        """Get unit roles by unit id for the user."""
        if hasattr(self, "_unit_roles"):
            return self._unit_roles
        self._calculate_unit_roles()
        return self._unit_roles

    @property
    def unit_permissions_map(self) -> dict[int, list[UserPermissionChoice]]:
        """Get permissions by unit id for the user."""
        if hasattr(self, "_unit_permissions"):
            return self._unit_permissions

        self._unit_permissions = {
            unit_id: sorted({permission for role in roles for permission in role.permissions})
            for unit_id, roles in self.unit_roles_map.items()
        }
        return self._unit_permissions

    @property
    def unit_group_roles_map(self) -> dict[int, list[UserRoleChoice]]:
        """Get unit roles by unit group id for the user."""
        if hasattr(self, "_unit_group_roles"):
            return self._unit_group_roles
        self._calculate_unit_roles()
        return self._unit_group_roles

    @property
    def unit_group_permissions_map(self) -> dict[int, list[UserPermissionChoice]]:
        """Get permissions by unit group id for the user."""
        if hasattr(self, "_unit_group_permissions"):
            return self._unit_group_permissions

        self._unit_group_permissions = {
            unit_group_id: sorted({permission for role in roles for permission in role.permissions})
            for unit_group_id, roles in self.unit_group_roles_map.items()
        }
        return self._unit_group_permissions

    def _calculate_unit_roles(self) -> None:
        """Calculate all unit roles by unit id and unit group id for the user."""
        self._unit_roles: dict[int, list[UserRoleChoice]] = {}
        self._unit_group_roles: dict[int, list[UserRoleChoice]] = {}

        unit_role: UnitRole
        for unit_role in self.unit_roles.all().prefetch_related("units", "unit_groups"):
            for unit in unit_role.units.all():
                self._unit_roles.setdefault(int(unit.pk), []).append(UserRoleChoice(unit_role.role))
            for unit_group in unit_role.unit_groups.all():
                self._unit_group_roles.setdefault(int(unit_group.pk), []).append(UserRoleChoice(unit_role.role))

        # Remove duplicates and sort roles alphabetically
        self._unit_roles = {pk: sorted(set(roles)) for pk, roles in self._unit_roles.items()}
        self._unit_group_roles = {pk: sorted(set(roles)) for pk, roles in self._unit_group_roles.items()}

    @cached_property
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
            jti=payload.get("jti"),
            typ=payload.get("typ"),
            exp=payload.get("exp"),
            iat=payload.get("iat"),
            auth_time=payload.get("auth_time"),
            nonce=payload.get("nonce"),
            at_hash=payload.get("at_hash"),
            name=payload.get("name"),
            preferred_username=payload.get("preferred_username"),
            given_name=payload.get("given_name"),
            family_name=payload.get("family_name"),
            email=payload.get("email"),
            email_verified=payload.get("email_verified"),
            ad_groups=payload.get("ad_groups"),
            azp=payload.get("azp"),
            sid=payload.get("sid"),
            session_state=payload.get("session_state"),
            amr=payload.get("amr"),
            loa=payload.get("loa"),
        )

    @property
    def access_token(self) -> str | None:
        """KeyCloak access token"""
        social_auth = self.current_social_auth
        if social_auth is None:
            return None
        extra_data: ExtraData = social_auth.extra_data
        return extra_data["access_token"]

    @property
    def refresh_token(self) -> str | None:
        """KeyCloak refresh token"""
        social_auth = self.current_social_auth
        if social_auth is None:
            return None
        extra_data: ExtraData = social_auth.extra_data
        return extra_data["refresh_token"]


# Set the permissions descriptor to the AnonymousUser class
AnonymousUser.permissions = PermissionResolver()


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
    try:
        return User.objects.get(pk=pk)
    except User.DoesNotExist:
        return None
