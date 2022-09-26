# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['PurposeQueryTestCase::test_getting_purposes 1'] = {
    'data': {
        'purposes': {
            'edges': [
                {
                    'node': {
                        'imageUrl': None,
                        'nameEn': 'en',
                        'nameFi': 'fi',
                        'nameSv': 'sv',
                        'smallUrl': None
                    }
                }
            ]
        }
    }
}

snapshots['PurposeTestCase::test_creating_purpose 1'] = {
    'data': {
        'createPurpose': {
            'errors': None,
            'purpose': {
                'nameFi': 'Created purpose'
            }
        }
    }
}

snapshots['PurposeTestCase::test_updating_purpose 1'] = {
    'updatePurpose': {
        'errors': None,
        'purpose': {
            'nameFi': 'Updated name'
        }
    }
}
