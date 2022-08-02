# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['QualifierQueryTestCase::test_getting_qualifiers 1'] = {
    'data': {
        'qualifiers': {
            'edges': [
                {
                    'node': {
                        'nameEn': 'Qualifier EN',
                        'nameFi': 'Qualifier FI',
                        'nameSv': 'Qualifier SV'
                    }
                }
            ]
        }
    }
}
