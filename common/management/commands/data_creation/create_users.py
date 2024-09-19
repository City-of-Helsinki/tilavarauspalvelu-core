# ruff: noqa: S311

from django.contrib.auth.hashers import make_password

from tilavarauspalvelu.enums import ReservationNotification, UserRoleChoice
from tilavarauspalvelu.models import User

from .utils import with_logs


@with_logs()
def _create_users() -> list[User]:
    # TODO: Refactor this function
    users: list[User] = [
        # Django admin user
        User(
            date_of_birth=None,
            department_name=None,
            email="tvp@example.com",
            first_name="Admin",
            is_staff=True,
            is_superuser=True,
            last_name="User",
            password=make_password("tvp"),  # NOSONAR
            preferred_language=None,
            profile_id="",
            reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
            tvp_uuid="b833ff92-fa18-4c71-aea7-8b04a958254d",
            username="tvp",
            uuid="6a3a72f4-2f84-11ee-9b45-718d9db674aa",
        ),
        # General Admin (090909-900D)
        User(
            date_of_birth="1909-09-09",
            department_name=None,
            email="desada2353@saeoil.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"General-{UserRoleChoice.RESERVER.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZGNkNTViZWYtOGI5MC00ODk4LTg3ZDgtYWY2ZWU2ZDI3NmU3",
            reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
            tvp_uuid="b281be97-e718-4a58-aa98-005d0d06ba1f",
            username="u-falno2slojcs7dx73y27lqqgfy",
            uuid="2816d76a-4b72-452f-8eff-de35f5c2062e",
        ),
        # Unit Reserver (010101-900V)
        User(
            date_of_birth="1901-01-01",
            department_name=None,
            email="cmwrwapvcajwldiyul@cazlg.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"Unit-{UserRoleChoice.RESERVER.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6MjBhNWE1MjItOTQ2NS00YTUzLTkxZDYtZDJiYjA4MWFiMzQ0",
            reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
            tvp_uuid="65f8f884-c8a7-4e7e-b8bd-d9533b933d67",
            username="u-wou6xfojifd6bhbqv6ctjhz35u",
            uuid="b3a9eb95-c941-47e0-9c30-af85349f3bed",
        ),
        # Unit Viewer (020202-900V)
        User(
            date_of_birth="1902-02-02",
            department_name=None,
            email="fsr81505@omeie.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"Unit-{UserRoleChoice.VIEWER.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6NjBhNTI1NDItYTkzMS00Yzk2LWI3YzQtYTc0YzdkYWNiM2U5",
            reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
            tvp_uuid="2ef4024a-6266-48d8-a098-74a4afbd9a84",
            username="u-mpch4chnyng23dkal3v6m57wf4",
            uuid="63c47e08-edc3-4dad-8d40-5eebe677f62f",
        ),
        # Unit Handler (030303-900V)
        User(
            date_of_birth="1903-03-03",
            department_name=None,
            email="srj22958@omeie.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"Unit-{UserRoleChoice.HANDLER.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZWFhYzdkYTQtNjZiNC00ZjVmLTgyMzItYjAzNTA3YWQ3ODM3",
            reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
            tvp_uuid="92e2882e-4758-4f42-97a4-e1e2e1eca907",
            username="u-7vusen4a4zhk7fhc5w2nw7gxxm",
            uuid="fd692237-80e6-4eaf-94e2-edb4db7cd7bb",
        ),
        # Unit Admin (040404-900V)
        User(
            date_of_birth="1904-04-04",
            department_name=None,
            email="kgo52202@omeie.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"Unit-{UserRoleChoice.ADMIN.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZjNlODU4NTQtNDhhOC00ODkyLTg0MGUtNDJkZGY3Y2IzNGNl",
            reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
            tvp_uuid="2e7c390e-4923-4e42-a389-63e775af82b9",
            username="u-x4j6pw5gfnheva3az3qzj6puru",
            uuid="bf13e7db-a62b-4e4a-8360-cee194f9f48d",
        ),
    ]

    return User.objects.bulk_create(users)
