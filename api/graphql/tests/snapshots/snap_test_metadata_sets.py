# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['MetadataSetsGraphQLTestCase::test_getting_metadata_sets 1'] = {
    'data': {
        'metadataSets': {
            'edges': [
                {
                    'node': {
                        'name': 'Test form',
                        'requiredFields': [
                            'reservee_first_name',
                            'reservee_last_name'
                        ],
                        'supportedFields': [
                            'reservee_first_name',
                            'reservee_last_name',
                            'reservee_phone'
                        ]
                    }
                }
            ]
        }
    }
}
