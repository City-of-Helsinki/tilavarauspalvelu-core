from __future__ import annotations

import datetime
from typing import Self

from django.conf import settings
from django.contrib.auth.models import UserManager as DjangoUserManager
from django.db import models
from helsinki_gdpr.models import SerializableMixin

from tilavarauspalvelu.models.user.actions import ANONYMIZED_FIRST_NAME, ANONYMIZED_LAST_NAME
from utils.date_utils import local_date

__all__ = [
    "UserManager",
    "UserQuerySet",
]


class UserQuerySet(models.QuerySet):
    def remove_old_superuser_and_staff_permissions(self) -> None:
        """Remove superuser and staff permissions from inactive users."""
        self.should_deactivate_permissions().update(is_staff=False, is_superuser=False)

    def should_deactivate_permissions(self, in_days: int = 0) -> Self:
        """
        Which users' permissions should be deactivated due to inactivity.

        :param in_days: How many days is it until the permissions should be deactivated?

        """
        cutoff = (
            local_date()
            + datetime.timedelta(days=in_days)
            - datetime.timedelta(days=settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS)
        )

        return self.filter(
            models.Q(is_active=True)
            & (
                models.Q(is_staff=True)
                | models.Q(is_superuser=True)
                | (
                    models.Q(general_roles__isnull=False)  #
                    & models.Q(general_roles__is_role_active=True)
                )
                | (
                    models.Q(unit_roles__isnull=False)  #
                    & models.Q(unit_roles__is_role_active=True)
                )
            )
            & models.Q(last_login__date__lt=cutoff)
        )

    def anonymize_inactive_users(self) -> None:
        """Anonymize users who haven't logged in in a while and haven't been anonymized yet."""
        for user in self.should_anonymize_users():
            if user.actions.can_anonymize():
                user.actions.anonymize()

    def should_anonymize_users(self, in_days: int = 0) -> Self:
        """
        Which users should be anonymized due to inactivity (and aren't already anonymized).

        :param in_days: How many days is it until the anonymization happens?
        """
        cutoff = (
            local_date()
            + datetime.timedelta(days=in_days)
            - datetime.timedelta(days=settings.ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS)
        )

        # All users who haven't logged in in a while but haven't been anonymized yet.
        # If user doesn't have a last login, we use the date they joined the system.
        return (
            self.exclude(
                first_name=ANONYMIZED_FIRST_NAME,
                last_name=ANONYMIZED_LAST_NAME,
            )
            .alias(
                inactive_date=models.Case(
                    models.When(
                        models.Q(last_login=None),
                        then=models.F("date_joined__date"),
                    ),
                    default=models.F("last_login__date"),
                ),
            )
            .filter(inactive_date__lt=cutoff)
        )


class UserManager(DjangoUserManager.from_queryset(UserQuerySet)):
    use_in_migrations = True

    # We need to redefine '__eq__' here because `use_in_migrations=True` and this manager is lazy loaded
    # in the model class. Django's migration system thinks that the lazy loaded manager is a different
    # class than the one in the migration history, and will therefore always try to update the manager.
    #
    # This implementation defers to the 'LazyModelManager.__eq__' implementation when the manager is not
    # yet loaded, which then loads the manager and compares the actual managers there.
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, type(self)):
            return NotImplemented
        return self._constructor_args == other._constructor_args  # type: ignore[attr-defined]

    # Copied from 'BaseManager.__hash__'
    def __hash__(self) -> int:
        return id(self)


class ProfileUserManager(SerializableMixin.SerializableManager.from_queryset(UserQuerySet)): ...
