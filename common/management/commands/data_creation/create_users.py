# ruff: noqa: S311

from django.contrib.auth.hashers import make_password

from users.models import User

from .utils import UserType, with_logs


@with_logs()
def _create_users() -> list[User]:
    users: list[User] = [
        # Overall Admin (090909-900D)
        User(
            date_of_birth="1909-09-09",
            department_name=None,
            email="desada2353@saeoil.com",
            first_name="Pää",
            is_staff=True,
            is_superuser=False,
            last_name="Käyttäjä",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZGNkNTViZWYtOGI5MC00ODk4LTg3ZDgtYWY2ZWU2ZDI3NmU3",
            reservation_notification="only_handling_required",
            tvp_uuid="b281be97-e718-4a58-aa98-005d0d06ba1f",
            username="u-falno2slojcs7dx73y27lqqgfy",
            uuid="2816d76a-4b72-452f-8eff-de35f5c2062e",
        ),
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
            reservation_notification="only_handling_required",
            tvp_uuid="b833ff92-fa18-4c71-aea7-8b04a958254d",
            username="tvp",
            uuid="6a3a72f4-2f84-11ee-9b45-718d9db674aa",
        ),
        # Unit Reserver (010101-900V)
        User(
            date_of_birth="1901-01-01",
            department_name=None,
            email="cmwrwapvcajwldiyul@cazlg.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"Unit-{UserType.reserver.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6MjBhNWE1MjItOTQ2NS00YTUzLTkxZDYtZDJiYjA4MWFiMzQ0",
            reservation_notification="only_handling_required",
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
            last_name=f"Unit-{UserType.viewer.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6NjBhNTI1NDItYTkzMS00Yzk2LWI3YzQtYTc0YzdkYWNiM2U5",
            reservation_notification="only_handling_required",
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
            last_name=f"Unit-{UserType.handler.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZWFhYzdkYTQtNjZiNC00ZjVmLTgyMzItYjAzNTA3YWQ3ODM3",
            reservation_notification="only_handling_required",
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
            last_name=f"Unit-{UserType.admin.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZjNlODU4NTQtNDhhOC00ODkyLTg0MGUtNDJkZGY3Y2IzNGNl",
            reservation_notification="only_handling_required",
            tvp_uuid="2e7c390e-4923-4e42-a389-63e775af82b9",
            username="u-x4j6pw5gfnheva3az3qzj6puru",
            uuid="bf13e7db-a62b-4e4a-8360-cee194f9f48d",
        ),
        # Service Sector Reserver (050505-900V)
        User(
            date_of_birth="1911-01-01",
            department_name=None,
            email="iws10782@zbock.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"ServiceSector-{UserType.reserver.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6MzRjYzliY2YtZjVkMy00MmQzLThjZTMtOGYyZjFjMWIzOGVl",
            reservation_notification="only_handling_required",
            tvp_uuid="769bc4d4-0f74-4e03-a4bd-a513e9033f45",
            username="u-fxwxs5kxoffz7fo3sxbekib6l4",
            uuid="2ded7975-5771-4b9f-95db-95c245203e5f",
        ),
        # Service Sector Viewer (060606-900V)
        User(
            date_of_birth="1922-02-02",
            department_name=None,
            email="vak40510@zslsz.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"ServiceSector-{UserType.viewer.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6NTc0NDY2ZDUtMTZmNi00MjcyLTg5N2YtNjU4OTgxOGU4OTRh",
            reservation_notification="only_handling_required",
            tvp_uuid="db63d962-184b-47bb-8673-7c53fe244dbc",
            username="u-kjb5efe4yzhp3f73ra6m3irj6u",
            uuid="5243d214-9cc6-4efd-97fb-883ccda229f5",
        ),
        # Service Sector Handler (070707-900V)
        User(
            date_of_birth="1933-03-03",
            department_name=None,
            email="atd46519@nezid.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"ServiceSector-{UserType.handler.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZmJjN2Y4YTQtNmIzYi00N2Q2LTk0NWEtM2Q4ZGNmMDAxOGZi",
            reservation_notification="only_handling_required",
            tvp_uuid="9d73d525-f6dd-4283-8bf7-7b0592524bfd",
            username="u-q5wzmnl3azbnbny4zgwae3w5ay",
            uuid="876d9635-7b06-42d0-b71c-c9ac026edd06",
        ),
        # Service Sector Admin (080808-900V)
        User(
            date_of_birth="1944-04-04",
            department_name=None,
            email="oey10549@zslsz.com",
            first_name="Varaamo",
            is_staff=True,
            is_superuser=False,
            last_name=f"ServiceSector-{UserType.admin.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6OGY5YzMzMTMtOTQ0YS00NmY5LTg5ZmUtYWUwZmMyYzIyYTc5",
            reservation_notification="only_handling_required",
            tvp_uuid="d9bfd4c6-8e17-491b-a5bf-24e898544eb8",
            username="u-743tnj4zh5gejhmdxvm3j2ooxy",
            uuid="ff3736a7-993f-4c44-9d83-bd59b4e9cebe",
        ),
    ]

    return User.objects.bulk_create(users)
