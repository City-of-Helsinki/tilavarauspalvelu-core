# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['CitiesGraphQLTestCase::test_getting_cities 1'] = {
    'data': {
        'cities': {
            'edges': [
                {
                    'node': {
                        'nameEn': None,
                        'nameFi': 'Helsinki',
                        'nameSv': None
                    }
                }
            ]
        }
    }
}
