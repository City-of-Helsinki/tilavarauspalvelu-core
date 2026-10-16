from __future__ import annotations

import datetime
from http import HTTPStatus
from typing import TYPE_CHECKING, Any
from urllib.parse import urlencode

from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from django.contrib import admin
from django.contrib.admin.utils import unquote
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from social_django.models import UserSocialAuth

from tilavarauspalvelu.enums import LoginMethod
from tilavarauspalvelu.models import GeneralRole, UnitRole, User
from tilavarauspalvelu.tasks import save_personal_info_view_log_task
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

if TYPE_CHECKING:
    from django.db import models
    from django.http import HttpResponse

    from tilavarauspalvelu.typing import WSGIRequest


# The social auth admin shows the Keycloak tokens of the user.
admin.site.unregister(UserSocialAuth)


class GeneralRoleInlineAdmin(admin.TabularInline):
    model = GeneralRole
    extra = 0
    show_change_link = True
    fk_name = "user"
    fields = [
        "role",
        "is_role_active",
    ]
    readonly_fields = [
        "role",
        "is_role_active",
    ]

    def has_add_permission(self, request, obj=None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False


class UnitRoleInlineAdmin(admin.TabularInline):
    model = UnitRole
    extra = 0
    show_change_link = True
    fk_name = "user"
    fields = [
        "role",
        "units",
        "unit_groups",
        "is_role_active",
    ]
    readonly_fields = [
        "role",
        "units",
        "unit_groups",
        "is_role_active",
    ]

    def has_add_permission(self, request, obj=None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False


@admin.register(User)
class UserAdmin(ExtraButtonsMixin, admin.ModelAdmin):
    # Functions
    actions = ["anonymize_user_data"]
    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
    ]
    search_help_text = _("Search by Username, First name, Last name or Email")

    # List
    list_display = [
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_superuser",
        "reservation_notification",
        "last_login",
        "date_joined",
    ]
    list_filter = [
        "is_active",
        "is_superuser",
        "is_staff",
        "reservation_notification",
        "preferred_language",
    ]
    ordering = ["username"]

    # Form
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "username",
                    "email",
                    "first_name",
                    "last_name",
                ],
            },
        ],
        [
            _("Settings"),
            {
                "fields": [
                    "preferred_language",
                    "reservation_notification",
                    "is_active",
                    "groups",
                ],
            },
        ],
        [
            _("Additional information"),
            {
                "fields": [
                    "last_login",
                    "date_joined",
                    "statistics_uuid",
                    "gdpr_uuid",
                    "department_name",
                    "profile_id",
                    "date_of_birth",
                    "is_internal_user",
                ],
            },
        ],
        [
            _("ID token info"),
            {
                "fields": [
                    "issuer",
                    "audience",
                    "jwt_id",
                    "token_type",
                    "expires",
                    "issued_at",
                    "auth_time",
                    "nonce",
                    "access_token_hash",
                    "preferred_username",
                    "email_verified",
                    "authorized_party",
                    "session_identifier",
                    "session_state",
                    "authentication_methods_reference",
                    "level_of_assurance",
                ],
            },
        ],
        [
            _("Permissions"),
            {
                "fields": [
                    "is_superuser",
                    "is_staff",
                    "login_method",
                    "is_strong_login",
                    "ad_groups",
                ],
            },
        ],
    ]
    readonly_fields = [
        "last_login",
        "date_joined",
        "id_token",
        "tvp_uuid",
        "ad_groups",
        "department_name",
        "profile_id",
        "date_of_birth",
        "login_method",
        "is_strong_login",
        "active_general_roles",
        "active_unit_roles",
        "active_unit_group_roles",
        "statistics_uuid",
        "gdpr_uuid",
        "issuer",
        "audience",
        "jwt_id",
        "token_type",
        "expires",
        "issued_at",
        "auth_time",
        "nonce",
        "access_token_hash",
        "preferred_username",
        "email_verified",
        "authorized_party",
        "session_identifier",
        "session_state",
        "authentication_methods_reference",
        "level_of_assurance",
        "is_internal_user",
    ]
    inlines = [
        GeneralRoleInlineAdmin,
        UnitRoleInlineAdmin,
    ]
    filter_horizontal = ["groups"]

    @button(label=_("Reservations"), change_form=True)
    def show_reservations(self, request: WSGIRequest, pk: str) -> HttpResponseRedirect:
        changelist_url = reverse("admin:tilavarauspalvelu_reservation_changelist")
        query_string = urlencode({"user__id__exact": pk})
        return HttpResponseRedirect(f"{changelist_url}?{query_string}")

    @button(label=_("Reservation series"), change_form=True)
    def show_reservation_series(self, request: WSGIRequest, pk: str) -> HttpResponseRedirect:
        changelist_url = reverse("admin:tilavarauspalvelu_reservationseries_changelist")
        query_string = urlencode({"user__id__exact": pk})
        return HttpResponseRedirect(f"{changelist_url}?{query_string}")

    @button(label=_("Applications"), change_form=True)
    def show_applications(self, request: WSGIRequest, pk: str) -> HttpResponseRedirect:
        changelist_url = reverse("admin:tilavarauspalvelu_application_changelist")
        query_string = urlencode({"user__id__exact": pk})
        return HttpResponseRedirect(f"{changelist_url}?{query_string}")

    def change_view(
        self,
        request: WSGIRequest,
        object_id: str,
        form_url: str = "",
        extra_context: dict[str, Any] | None = None,
    ) -> HttpResponse:
        response = super().change_view(request, object_id, form_url, extra_context)

        # The change page shows the date of birth, so log the view like the GraphQL API does.
        # Log only after the permission check above, so that a denied request is not logged as a view.
        user = self.get_object(request, unquote(object_id))
        if request.method == "GET" and response.status_code == HTTPStatus.OK and user is not None:
            save_personal_info_view_log_task.delay(
                user_id=user.pk,
                viewer_user_id=request.user.pk,
                field="User.date_of_birth",
            )

        return response

    @admin.action
    def anonymize_user_data(self, request: WSGIRequest, queryset: models.QuerySet) -> None:
        user: User
        for user in queryset.all():
            user.actions.anonymize()

    @admin.display(description=_("Statistics UUID"))
    def statistics_uuid(self, user: User) -> str:
        return user.tvp_uuid

    @admin.display(description=_("GDPR UUID"))
    def gdpr_uuid(self, user: User) -> str:
        return user.uuid

    @admin.display(description=_("Issuer (iss)"))
    def issuer(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.iss

    @admin.display(description=_("Audience (aud)"))
    def audience(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.aud

    @admin.display(description=_("JWT ID (jti)"))
    def jwt_id(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.jti

    @admin.display(description=_("Token type (typ)"))
    def token_type(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.typ

    @admin.display(description=_("Expires (exp)"))
    def expires(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        expires = datetime.datetime.fromtimestamp(user.id_token.exp).astimezone(DEFAULT_TIMEZONE)
        expired = expires < local_datetime()
        return expires.isoformat() + (" (expired)" if expired else " (valid)")

    @admin.display(description=_("Issued at (iat)"))
    def issued_at(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return datetime.datetime.fromtimestamp(user.id_token.iat).astimezone(DEFAULT_TIMEZONE).isoformat()

    @admin.display(description=_("Auth time (auth_time)"))
    def auth_time(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return datetime.datetime.fromtimestamp(user.id_token.auth_time).astimezone(DEFAULT_TIMEZONE).isoformat()

    @admin.display(description=_("Nonce (nonce)"))
    def nonce(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.nonce

    @admin.display(description=_("Access token hash (at_hash)"))
    def access_token_hash(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.at_hash

    @admin.display(description=_("Preferred username (preferred_username)"))
    def preferred_username(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.preferred_username

    @admin.display(description=_("Email verified (email_verified)"))
    def email_verified(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return str(user.id_token.email_verified)

    @admin.display(description=_("Authorized party (azp)"))
    def authorized_party(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.azp

    @admin.display(description=_("Session identifier (sid)"))
    def session_identifier(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.sid

    @admin.display(description=_("Session state (session_state)"))
    def session_state(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.session_state

    @admin.display(description=_("Authentication methods reference (amr)"))
    def authentication_methods_reference(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return str(user.id_token.amr)

    @admin.display(description=_("Level of assurance (loa)"))
    def level_of_assurance(self, user: User) -> str:
        if user.id_token is None:
            return "-"
        return user.id_token.loa

    def login_method(self, user: User) -> str:
        if user is None:
            return "-"
        if user.id_token is None:
            return LoginMethod.OTHER.value

        return LoginMethod.PROFILE.value if user.id_token.is_profile_login else LoginMethod.AD.value

    def is_strong_login(self, user: User) -> bool:
        return getattr(user.id_token, "is_strong_login", False)

    def is_internal_user(self, user: User) -> bool:
        return user.actions.is_internal_user
