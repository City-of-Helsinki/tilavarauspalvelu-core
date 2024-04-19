import datetime

import graphene
from graphene_django_extensions.errors import GQLNodePermissionDeniedError
from graphql import GraphQLError
from query_optimizer.selections import get_field_selections

from api.graphql.extensions import error_codes
from applications.models import Application
from common.typing import GQLInfo
from permissions.helpers import can_read_application, can_view_reservation
from reservations.models import Reservation
from users.helauth.clients import HelsinkiProfileClient
from users.helauth.typing import LoginMethod, UserProfileInfo
from users.models import User
from users.tasks import save_personal_info_view_log

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
        if reservation_id is not None:
            user = cls.get_user_from_reservation(reservation_id, info=info)
        elif application_id is not None:
            user = cls.get_user_from_application(application_id, info=info)
        else:
            msg = "Either 'reservation_id' or 'application_id' required."
            raise GraphQLError(msg)

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
            extensions = {"code": error_codes.HELSINKI_PROFILE_USER_MISSING_PROFILE_ID}
            raise GraphQLError(msg, extensions=extensions)

        # Modify profile request based on the requested fields in the graphql query
        fields: list[str] = get_field_selections(info)

        data = HelsinkiProfileClient.get_user_profile_info(info.context, user=user, fields=fields)
        if data is None:
            msg = "Helsinki profile token is not valid and could not be refreshed."
            extensions = {"code": error_codes.HELSINKI_PROFILE_TOKEN_INVALID}
            raise GraphQLError(msg, extensions=extensions)

        return data

    @classmethod
    def get_user_from_application(cls, application_id: int, info: GQLInfo) -> User:
        application: Application | None = Application.objects.select_related("user").filter(pk=application_id).first()
        if application is None:
            msg = f"Application with id {application_id} not found."
            extensions = {"code": error_codes.HELSINKI_PROFILE_APPLICATION_USER_NOT_FOUND}
            raise GraphQLError(msg, extensions=extensions)

        if not can_read_application(info.context.user, application):
            raise GQLNodePermissionDeniedError

        user: User | None = application.user
        if user is None:
            msg = f"Application with id {application_id} does have a user."
            extensions = {"code": error_codes.HELSINKI_PROFILE_APPLICATION_USER_MISSING}
            raise GraphQLError(msg, extensions=extensions)

        return user

    @classmethod
    def get_user_from_reservation(cls, reservation_id: int, info: GQLInfo) -> User:
        reservation: Reservation | None = Reservation.objects.select_related("user").filter(pk=reservation_id).first()
        if reservation is None:
            msg = f"Reservation with id {reservation_id} not found."
            extensions = {"code": error_codes.HELSINKI_PROFILE_RESERVATION_USER_NOT_FOUND}
            raise GraphQLError(msg, extensions=extensions)

        if not can_view_reservation(info.context.user, reservation):
            raise GQLNodePermissionDeniedError

        user: User | None = reservation.user
        if user is None:
            msg = f"Reservation with id {reservation_id} does not have a user."
            extensions = {"code": error_codes.HELSINKI_PROFILE_RESERVATION_USER_MISSING}
            raise GraphQLError(msg, extensions=extensions)

        return user

    def resolve_birthday(root: UserProfileInfo, info: GQLInfo) -> datetime.date | None:
        save_personal_info_view_log.delay(root["pk"], info.context.user.id, "profile.birthday")
        return root["birthday"]

    def resolve_ssn(root: UserProfileInfo, info: GQLInfo) -> str | None:
        save_personal_info_view_log.delay(root["pk"], info.context.user.id, "profile.ssn")
        return root["ssn"]

    def resolve_municipality_code(root: UserProfileInfo, info: GQLInfo) -> str | None:
        save_personal_info_view_log.delay(root["pk"], info.context.user.id, "profile.municipality_code")
        return root["municipality_code"]

    def resolve_municipality_name(root: UserProfileInfo, info: GQLInfo) -> str | None:
        save_personal_info_view_log.delay(root["pk"], info.context.user.id, "profile.municipality_name")
        return root["municipality_name"]
