from tilavarauspalvelu.models import GeneralRole, UnitRole, User

__all__ = [
    "deactivate_old_permissions",
]


def deactivate_old_permissions() -> None:
    """
    Remove superuser and staff permissions, as well as any roles from all users
    that have not logged in for a given period of time.
    """
    GeneralRole.objects.deactivate_old_permissions()
    UnitRole.objects.deactivate_old_permissions()
    User.objects.remove_old_superuser_and_staff_permissions()
