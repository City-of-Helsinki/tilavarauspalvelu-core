from graphene_permissions.mixins import AuthFilter

from api.graphql.types.terms_of_use.permissions import TermsOfUsePermission


class TermsOfUseFilter(AuthFilter):
    permission_classes = (TermsOfUsePermission,)
