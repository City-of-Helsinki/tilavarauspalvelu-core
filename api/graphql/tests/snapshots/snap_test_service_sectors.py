# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ServiceSectorsGraphQLTestCase::test_getting_service_sectors 1'] = {
    'data': {
        'serviceSectors': {
            'edges': [
                {
                    'node': {
                        'nameEn': None,
                        'nameFi': 'Yksityinen',
                        'nameSv': None
                    }
                },
                {
                    'node': {
                        'nameEn': None,
                        'nameFi': 'Kulttuuri ja vapaa-aika',
                        'nameSv': None
                    }
                }
            ]
        }
    }
}
