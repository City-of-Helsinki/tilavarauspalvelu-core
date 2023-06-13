# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['SpacesQueryTestCase::test_only_with_permission_with_general_role 1'] = {
    'data': {
        'spaces': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'outerspace'
                    }
                }
            ]
        }
    }
}

snapshots['SpacesQueryTestCase::test_only_with_permission_with_service_sector_role 1'] = {
    'data': {
        'spaces': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'i am from the sector!'
                    }
                }
            ]
        }
    }
}

snapshots['SpacesQueryTestCase::test_only_with_permission_with_unit_group_role 1'] = {
    'data': {
        'spaces': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'i am from the unit group!'
                    }
                }
            ]
        }
    }
}

snapshots['SpacesQueryTestCase::test_only_with_permission_with_unit_role 1'] = {
    'data': {
        'spaces': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'i am from the unit!'
                    }
                }
            ]
        }
    }
}

snapshots['SpacesQueryTestCase::test_only_with_permission_without_permissions 1'] = {
    'data': {
        'spaces': {
            'edges': [
            ]
        }
    }
}

snapshots['SpacesQueryTestCase::test_spaces_query 1'] = {
    'data': {
        'spaces': {
            'edges': [
                {
                    'node': {
                        'code': '',
                        'maxPersons': None,
                        'nameFi': 'outerspace',
                        'surfaceArea': 40.5
                    }
                }
            ]
        }
    }
}
