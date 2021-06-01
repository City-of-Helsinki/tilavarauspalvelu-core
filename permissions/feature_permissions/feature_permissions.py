from enum import Enum

from django.contrib.auth.models import User



class ApplicationRoundPermissionEnum(Enum):
    can_modify_application_round = 'can_modify_application_round'


class HandlingApplicationsFeature(object):
    name = 'handling_applications_feature'
    provided_permissions: [str]

    def __init__(self):
        self.provided_permissions = [ApplicationRoundPermissionEnum.can_modify_application_round.value]

class ApprovingApplicationsFeature(HandlingApplicationsFeature):
    name = 'approving_applications_feature'

    def __init__(self):
        super().__init__()
        self.provided_permissions += []

handling_applications_features = HandlingApplicationsFeature()

approving_applications_features = ApprovingApplicationsFeature()


class Features(object):
    features = {
        'handling_applications_feature': handling_applications_features,
        'approving_applications_feature': approving_applications_features
    }

    def get_features_for_role(self, role_name: str):
        if role_name in self.features:
            return self.features[role_name].provided_permissions
        return []


    def get_permissions(self, user: User):
        permissions: [str] = []
        for role in user.general_roles.all():
            permissions += self.get_features_for_role(role.role.code)
        for role in user.service_sector_roles.all():
            permissions += self.get_features_for_role(role.role.code)
        return permissions


    def has_general_permission(user: User, required_permission: str) -> bool:
        return user.general_roles.filter(
            role__permissions__permission=required_permission
        ).exists()