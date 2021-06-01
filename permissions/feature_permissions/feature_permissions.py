from enum import Enum

from users.models import User


class ApplicationRoundPermissionEnum(Enum):
    can_modify_application_round = 'can_modify_application_round'
    can_approve_application_round = 'can_approve_application_round'


class ApplicationPermissionEnum(Enum):
    can_modify_application = 'can_modify_application'
    can_see_application = 'can_see_application'


class CreatingApplicationsFeature(object):
    provided_permissions: [str]

    def __init__(self):
        self.provided_permissions = [
            ApplicationPermissionEnum.can_modify_application.value,
            ApplicationPermissionEnum.can_see_application.value
        ]


class HandlingApplicationsFeature(CreatingApplicationsFeature):
    provided_permissions: [str]

    def __init__(self):
        super().__init__()
        self.provided_permissions += [
            ApplicationRoundPermissionEnum.can_modify_application_round.value,
        ]


class ApprovingApplicationsFeature(HandlingApplicationsFeature):

    def __init__(self):
        super().__init__()
        self.provided_permissions += [ApplicationRoundPermissionEnum.can_approve_application_round]


handling_applications_features = HandlingApplicationsFeature()

approving_applications_features = ApprovingApplicationsFeature()


class Features(object):
    features = {
        'handling_applications_feature': handling_applications_features,
        'approving_applications_feature': approving_applications_features
    }

    def get_permissions_for_role(self, role_name: str):
        if role_name in self.features:
            return self.features[role_name].provided_permissions
        return []


    def get_permissions(self, user: User):
        permissions: [str] = []
        for role in user.general_roles.all():
            permissions += self.get_permissions_for_role(role.role.code)
        for role in user.service_sector_roles.all():
            permissions += self.get_permissions_for_role(role.role.code)
        return permissions



features = Features()
