# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ResourceGraphQLTestCase::test_getting_resources_with_null_buffer_times 1'] = {
    'data': {
        'resources': {
            'edges': [
                {
                    'node': {
                        'bufferTimeAfter': None,
                        'bufferTimeBefore': None,
                        'building': None,
                        'locationType': 'FIXED',
                        'nameFi': 'Test resource',
                        'space': {
                            'nameFi': 'Test space'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ResourceGraphQLTestCase::test_only_with_permission_with_service_sector_role 1'] = {
    'data': {
        'resources': {
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

snapshots['ResourceGraphQLTestCase::test_only_with_permission_with_unit_group_role 1'] = {
    'data': {
        'resources': {
            'edges': [
                {
                    'node': {
                        'nameFi': "i'm from the unit group!"
                    }
                }
            ]
        }
    }
}

snapshots['ResourceGraphQLTestCase::test_only_with_permission_with_unit_role 1'] = {
    'data': {
        'resources': {
            'edges': [
                {
                    'node': {
                        'nameFi': "i'm from the unit!"
                    }
                }
            ]
        }
    }
}

snapshots['ResourceGraphQLTestCase::test_only_with_permissions_with_general_role 1'] = {
    'data': {
        'resources': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Test resource'
                    }
                }
            ]
        }
    }
}

snapshots['ResourceGraphQLTestCase::test_only_with_permissions_with_no_permissions 1'] = {
    'data': {
        'resources': {
            'edges': [
            ]
        }
    }
}

snapshots['ResourceGraphQLTestCase::test_should_be_able_to_find_by_pk_with_buffer_times 1'] = {
    'data': {
        'resourceByPk': {
            'bufferTimeAfter': 7200,
            'bufferTimeBefore': 3600,
            'nameFi': 'Test resource'
        }
    }
}
