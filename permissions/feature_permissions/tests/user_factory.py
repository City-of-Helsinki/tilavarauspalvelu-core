import factory
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText


class GeneralRolePermissionFactory(DjangoModelFactory):
    role = models.ForeignKey(
        GeneralRoleChoice,
        verbose_name=_("Role"),
        related_name="permissions",
        on_delete=models.CASCADE,
    )
    permission = models.CharField(
        verbose_name=_("Permission"), max_length=255, choices=GENERAL_PERMISSIONS
    )
class GeneralRoleChoiceFactory(DjangoModelFactory):
    permissions
    class Meta:
        model = "permissions.GeneralRoleChoice"

class GeralRoleFactory(DjangoModelFactory):
    class Meta:
        model = "permissions.GeneralRole"

class UserFactory(DjangoModelFactory):
    class Meta:
        model = "users.User"

    username = FuzzyText()

    roles = factory.RelatedFactory(
        GeralRoleFactory,
        factory_related_name='user',
        action=models.UserLog.ACTION_CREATE,
    )
