import graphene
from graphene.utils.str_converters import to_snake_case
from graphene_django_extensions.errors import GQLPermissionDeniedError
from graphene_django_extensions.settings import gdx_settings
from graphene_django_extensions.utils import get_fields_from_info
from graphql import GraphQLError

from api.graphql.extensions import error_codes
from applications.models import Application
from common.typing import GQLInfo
from permissions.helpers import can_view_users
from reservations.models import Reservation
from users.helauth.clients import HelsinkiProfileClient
from users.helauth.typing import LoginMethod, UserProfileInfo
from users.models import User

__all__ = [
    "HelsinkiProfileDataNode",
]


class HelsinkiProfileDataNode(graphene.ObjectType):
    first_name = graphene.String()
    last_name = graphene.String()
    email = graphene.String()
    phone = graphene.String()
    birthday = graphene.Date()
    ssn = graphene.String()
    street_address = graphene.String()
    postal_code = graphene.String()
    city = graphene.String()
    municipality_code = graphene.String()
    municipality_name = graphene.String()
    login_method = graphene.Field(graphene.Enum.from_enum(LoginMethod))
    is_strong_login = graphene.Boolean(required=True)

    @classmethod
    def get_data(
        cls,
        info: GQLInfo,
        *,
        application_id: int | None = None,
        reservation_id: int | None = None,
    ) -> UserProfileInfo:
        if not can_view_users(info.context.user):
            raise GQLPermissionDeniedError(
                message=gdx_settings.QUERY_PERMISSION_ERROR_MESSAGE,
                code=gdx_settings.QUERY_PERMISSION_ERROR_CODE,
            )

        if reservation_id is not None:
            user = cls.get_user_from_reservation(reservation_id)
        elif application_id is not None:
            user = cls.get_user_from_application(application_id)
        else:
            msg = "Either 'reservation_id' or 'application_id' required."
            raise GraphQLError(msg)

        id_token = user.id_token

        # Allow some information to be queried from non-helsinki profile users
        if id_token is None or not id_token.is_profile_login:
            return UserProfileInfo(
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
            extensions = {"code": error_codes.HELSINKI_PROFILE_USER_MISSING_PROFILE_ID}
            raise GraphQLError(msg, extensions=extensions)

        # Modify profile request based on the requested fields in the graphql query
        fields: list[str] = [to_snake_case(field) for field in get_fields_from_info(info)[0]["profileData"]]

        data = HelsinkiProfileClient.get_user_profile_info(info.context, user=user, fields=fields)
        if data is None:
            msg = "Helsinki profile token is not valid and could not be refreshed."
            extensions = {"code": error_codes.HELSINKI_PROFILE_TOKEN_INVALID}
            raise GraphQLError(msg, extensions=extensions)

        return data

    @classmethod
    def get_user_from_application(cls, application_id: int) -> User:
        application: Application | None = Application.objects.select_related("user").filter(pk=application_id).first()
        if application is None:
            msg = f"Application with id {application_id} not found."
            extensions = {"code": error_codes.HELSINKI_PROFILE_APPLICATION_USER_NOT_FOUND}
            raise GraphQLError(msg, extensions=extensions)

        user: User | None = application.user
        if user is None:
            msg = f"Application with id {application_id} does have a user."
            extensions = {"code": error_codes.HELSINKI_PROFILE_APPLICATION_USER_MISSING}
            raise GraphQLError(msg, extensions=extensions)

        return user

    @classmethod
    def get_user_from_reservation(cls, reservation_id: int) -> User:
        reservation: Reservation | None = Reservation.objects.select_related("user").filter(pk=reservation_id).first()
        if reservation is None:
            msg = f"Reservation with id {reservation_id} not found."
            extensions = {"code": error_codes.HELSINKI_PROFILE_RESERVATION_USER_NOT_FOUND}
            raise GraphQLError(msg, extensions=extensions)

        user: User | None = reservation.user
        if user is None:
            msg = f"Reservation with id {reservation_id} does not have a user."
            extensions = {"code": error_codes.HELSINKI_PROFILE_RESERVATION_USER_MISSING}
            raise GraphQLError(msg, extensions=extensions)

        return user
