# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ApplicationsGraphQLPermissionsTestCase::test_regular_user_can_view_only_own_application 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLPermissionsTestCase::test_service_sector_admin_cannot_view_other_sector_than_own 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLPermissionsTestCase::test_service_sector_user_can_view_application 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLPermissionsTestCase::test_super_admin_can_view_all_applications 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                },
                {
                    'node': {
                        'additionalInformation': None,
                        'applicantType': 'ASSOCIATION',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLPermissionsTestCase::test_unit_admin_can_view_application 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLPermissionsTestCase::test_unit_admin_cannot_view_other_unit_application 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLPermissionsTestCase::test_unit_group_admin_can_view_application 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLPermissionsTestCase::test_unit_group_admin_cannot_view_other_group_application 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}
