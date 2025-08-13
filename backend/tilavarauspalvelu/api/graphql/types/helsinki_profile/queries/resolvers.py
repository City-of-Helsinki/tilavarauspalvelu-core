from undine import GQLInfo
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.api.graphql.extensions.utils import get_field_names
from tilavarauspalvelu.enums import LoginMethod
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.helsinki_profile.typing import UserProfileInfo
from tilavarauspalvelu.models import Application, Reservation, User
from tilavarauspalvelu.tasks import save_personal_info_view_log_task
from tilavarauspalvelu.typing import AnyUser, error_codes
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "HelsinkiProfileResolver",
]


class HelsinkiProfileResolver:
    @classmethod
    def resolve(cls, info: GQLInfo[User], user: User) -> UserProfileInfo:
        selections = info.field_nodes[0].selection_set.selections
        fields = get_field_names(selections, info.fragments)

        data = cls.get_user_info(user, info, fields)

        if "birthday" in fields:
            save_personal_info_view_log_task.delay(user.pk, info.context.user.id, "profile.birthday")

        if "ssn" in fields:
            save_personal_info_view_log_task.delay(user.pk, info.context.user.id, "profile.ssn")

        if "municipality_code" in fields:
            save_personal_info_view_log_task.delay(user.pk, info.context.user.id, "profile.municipality_code")

        if "municipality_name" in fields:
            save_personal_info_view_log_task.delay(user.pk, info.context.user.id, "profile.municipality_name")

        return data

    @classmethod
    def get_user_info(cls, user: User, info: GQLInfo[User], fields: list[str]) -> UserProfileInfo:
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
                country_code=None,
                additional_address=None,
                municipality_code=None,
                municipality_name=None,
                login_method=LoginMethod.OTHER if id_token is None else LoginMethod.AD,
                is_strong_login=getattr(id_token, "is_strong_login", False),
            )

        if not bool(user.profile_id):
            msg = "User does not have a profile id. Cannot fetch profile data."
            raise GraphQLValidationError(msg, code=error_codes.HELSINKI_PROFILE_USER_MISSING_PROFILE_ID)

        try:
            data = HelsinkiProfileClient.get_user_profile_info(
                user=user,
                request_user=info.context.user,
                session=info.context.session,
                fields=fields,
            )
        except ExternalServiceError as err:
            raise GraphQLValidationError(str(err), code=error_codes.HELSINKI_PROFILE_EXTERNAL_SERVICE_ERROR) from err

        if info.context.session.get("keycloak_refresh_token_expired", False):
            msg = "Keycloak refresh token is expired. Please log out and back in again."
            raise GraphQLValidationError(msg, code=error_codes.HELSINKI_PROFILE_KEYCLOAK_REFRESH_TOKEN_EXPIRED)

        if data is None:
            msg = "Helsinki profile token is not valid and could not be refreshed."
            raise GraphQLValidationError(msg, code=error_codes.HELSINKI_PROFILE_TOKEN_INVALID)

        return data

    @classmethod
    def get_user_from_application(cls, application_pk: int, info: GQLInfo[User]) -> User:
        application = (
            Application.objects.select_related("user")  #
            .with_permissions()
            .filter(pk=application_pk)
            .first()
        )
        if application is None:
            msg = f"Application with id {cls} not found."
            raise GraphQLPermissionError(msg, code=error_codes.HELSINKI_PROFILE_APPLICATION_USER_NOT_FOUND)

        user: AnyUser = info.context.user
        if not user.permissions.can_view_application(application):
            msg = "No permission to view application data."
            raise GraphQLPermissionError(msg)

        return application.user

    @classmethod
    def get_user_from_reservation(cls, application_pk: int, info: GQLInfo[User]) -> User:
        reservation = (
            Reservation.objects.select_related("user")  #
            .with_permissions()
            .filter(pk=application_pk)
            .first()
        )
        if reservation is None:
            msg = f"Reservation with id {cls} not found."
            raise GraphQLPermissionError(msg, code=error_codes.HELSINKI_PROFILE_RESERVATION_USER_NOT_FOUND)

        user: AnyUser = info.context.user
        if not user.permissions.can_view_reservation(reservation):
            msg = "No permission to view reservation data."
            raise GraphQLPermissionError(msg)

        return reservation.user
