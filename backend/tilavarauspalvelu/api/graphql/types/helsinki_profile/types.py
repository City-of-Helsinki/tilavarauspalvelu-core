from __future__ import annotations

from typing import TYPE_CHECKING

import graphene
from graphene_django_extensions.errors import GQLCodeError, GQLNodePermissionDeniedError
from query_optimizer.selections import get_field_selections

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import LoginMethod
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.helsinki_profile.typing import UserProfileInfo
from tilavarauspalvelu.models import Application, Reservation
from tilavarauspalvelu.tasks import save_personal_info_view_log_task
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import AnyUser, GQLInfo

__all__ = [
    "HelsinkiProfileDataNode",
]


class HelsinkiProfileDataNode(graphene.ObjectType):
    pk = graphene.Int(required=True)
    first_name = graphene.String()
    last_name = graphene.String()
    email = graphene.String()
    phone = graphene.String()
    birthday = graphene.Date()
    ssn = graphene.String()
    street_address = graphene.String()
    postal_code = graphene.String()
    city = graphene.String()
    country_code = graphene.String()
    additional_address = graphene.String()
    municipality_code = graphene.String()
    municipality_name = graphene.String()
    login_method = graphene.Field(graphene.Enum.from_enum(LoginMethod), required=True)
    is_strong_login = graphene.Boolean(required=True)

    @classmethod
    def get_data(
        cls,
        info: GQLInfo,
        *,
        application_pk: int | None = None,
        reservation_pk: int | None = None,
    ) -> UserProfileInfo:
        if reservation_pk is not None:
            user = cls.get_user_from_reservation(reservation_pk, info=info)
        elif application_pk is not None:
            user = cls.get_user_from_application(application_pk, info=info)
        else:
            msg = "Either 'reservation_pk' or 'reservation_pk' required."
            raise GQLCodeError(msg, code=error_codes.HELSINKI_PROFILE_INVALID_PARAMS)

        id_token = user.id_token

        # Allow some information to be queried from non-helsinki profile users
        if id_token is None or not id_token.is_profile_login:
            return UserProfileInfo(
                pk=user.pk,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                phone=None,
                birthday=user.date_of_birth,
                ssn=None,
                street_address=None,
                postal_code=None,
                city=None,
                municipality_code=None,
                municipality_name=None,
                login_method=LoginMethod.OTHER if id_token is None else LoginMethod.AD,
                is_strong_login=getattr(id_token, "is_strong_login", False),
            )

        if not bool(user.profile_id):
            msg = "User does not have a profile id. Cannot fetch profile data."
            raise GQLCodeError(msg, code=error_codes.HELSINKI_PROFILE_USER_MISSING_PROFILE_ID)

        # Modify profile request based on the requested fields in the graphql query
        fields: list[str] = get_field_selections(info)

        try:
            data = HelsinkiProfileClient.get_user_profile_info(
                user=user,
                request_user=info.context.user,
                session=info.context.session,
                fields=fields,
            )
        except ExternalServiceError as e:
            if type(e.extra_data) is list and len(e.extra_data):
                profile_error = e.extra_data[0]
                msg = profile_error.get("message", "Unknown Helsinki Profile error")
                if profile_error.get("extensions", {}).get("code") == "PERMISSION_DENIED_ERROR":
                    raise GQLCodeError(msg, code=error_codes.HELSINKI_PROFILE_PERMISSION_DENIED) from e
            raise

        if info.context.session.get("keycloak_refresh_token_expired", False):
            msg = "Keycloak refresh token is expired. Please log out and back in again."
            raise GQLCodeError(msg, code=error_codes.HELSINKI_PROFILE_KEYCLOAK_REFRESH_TOKEN_EXPIRED)

        if data is None:
            msg = "Helsinki profile token is not valid and could not be refreshed."
            raise GQLCodeError(msg, code=error_codes.HELSINKI_PROFILE_TOKEN_INVALID)

        return data

    @classmethod
    def get_user_from_application(cls, application_pk: int, info: GQLInfo) -> User:
        application: Application | None = (
            Application.objects.select_related("user")  #
            .filter(pk=application_pk)
            .with_permissions()
            .first()
        )
        if application is None:
            msg = f"Application with id {application_pk} not found."
            raise GQLCodeError(msg, code=error_codes.HELSINKI_PROFILE_APPLICATION_USER_NOT_FOUND)

        user: AnyUser = info.context.user
        if not user.permissions.can_view_application(application):
            raise GQLNodePermissionDeniedError

        return application.user

    @classmethod
    def get_user_from_reservation(cls, application_pk: int, info: GQLInfo) -> User:
        reservation: Reservation | None = (
            Reservation.objects.select_related("user")  #
            .filter(pk=application_pk)
            .with_permissions()
            .first()
        )
        if reservation is None:
            msg = f"Reservation with id {application_pk} not found."
            raise GQLCodeError(msg, code=error_codes.HELSINKI_PROFILE_RESERVATION_USER_NOT_FOUND)

        user: AnyUser = info.context.user
        if not user.permissions.can_view_reservation(reservation):
            raise GQLNodePermissionDeniedError

        return reservation.user

    def resolve_birthday(root: UserProfileInfo, info: GQLInfo) -> datetime.date | None:
        save_personal_info_view_log_task.delay(root["pk"], info.context.user.id, "profile.birthday")
        return root["birthday"]

    def resolve_ssn(root: UserProfileInfo, info: GQLInfo) -> str | None:
        save_personal_info_view_log_task.delay(root["pk"], info.context.user.id, "profile.ssn")
        return root["ssn"]

    def resolve_municipality_code(root: UserProfileInfo, info: GQLInfo) -> str | None:
        save_personal_info_view_log_task.delay(root["pk"], info.context.user.id, "profile.municipality_code")
        return root["municipality_code"]

    def resolve_municipality_name(root: UserProfileInfo, info: GQLInfo) -> str | None:
        save_personal_info_view_log_task.delay(root["pk"], info.context.user.id, "profile.municipality_name")
        return root["municipality_name"]
