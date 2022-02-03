# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

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
