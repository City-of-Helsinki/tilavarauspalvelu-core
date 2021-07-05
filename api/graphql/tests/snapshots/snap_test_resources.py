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
                        'name': 'Test resource',
                        'space': {
                            'name': 'Test space',
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ResourceGraphQLTestCase::test_should_be_able_to_find_by_pk_with_buffer_times 1'] = {
    'data': {
        'resourceByPk': {
            'bufferTimeAfter': 7200.0,
            'bufferTimeBefore': 3600.0,
            'name': 'Test resource'
        }
    }
}
