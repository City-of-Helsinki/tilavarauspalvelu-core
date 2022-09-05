# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['UserQueryTestCase::test_hide_reservation_notification_when_user_is_not_staff 1'] = {
    'data': {
        'currentUser': {
            'email': 'non-staff.admin@foo.com',
            'firstName': 'Non-Staff',
            'isSuperuser': False,
            'lastName': 'Admin',
            'reservationNotification': None,
            'username': 'non_staff_admin'
        }
    }
}

snapshots['UserQueryTestCase::test_show_general_roles 1'] = {
    'data': {
        'currentUser': {
            'generalRoles': [
                {
                    'role': {
                        'code': 'general_role',
                        'verboseName': ''
                    }
                }
            ],
            'username': 'staff_admin'
        }
    }
}

snapshots['UserQueryTestCase::test_show_nothing_when_user_is_not_authenticated 1'] = {
    'data': {
        'currentUser': None
    },
    'errors': [
        {
            'locations': [
                {
                    'column': 17,
                    'line': 3
                }
            ],
            'message': 'No User matches the given query.',
            'path': [
                'currentUser'
            ]
        }
    ]
}

snapshots['UserQueryTestCase::test_show_reservation_notification_when_user_is_staff 1'] = {
    'data': {
        'currentUser': {
            'email': 'staff.admin@foo.com',
            'firstName': 'Staff',
            'isSuperuser': False,
            'lastName': 'Admin',
            'reservationNotification': 'only_handling_required',
            'username': 'staff_admin'
        }
    }
}

snapshots['UserQueryTestCase::test_show_service_sector_roles 1'] = {
    'data': {
        'currentUser': {
            'serviceSectorRoles': [
                {
                    'role': {
                        'code': 'TEST_SERVICE_SECTOR_ROLE',
                        'verboseName': 'Test Service Sector Role'
                    },
                    'serviceSector': {
                        'nameFi': 'Test Service Sector'
                    }
                }
            ],
            'username': 'staff_admin'
        }
    }
}

snapshots['UserQueryTestCase::test_show_unit_roles 1'] = {
    'data': {
        'currentUser': {
            'unitRoles': [
                {
                    'role': {
                        'code': 'TEST_UNIT_ROLE',
                        'verboseName': 'Test Unit Role'
                    },
                    'unitGroups': [
                        {
                            'name': 'Test Unit Group',
                            'units': [
                                {
                                    'nameFi': 'Test Unit'
                                }
                            ]
                        }
                    ],
                    'units': [
                        {
                            'nameFi': 'Test Unit'
                        }
                    ]
                }
            ],
            'username': 'staff_admin'
        }
    }
}
