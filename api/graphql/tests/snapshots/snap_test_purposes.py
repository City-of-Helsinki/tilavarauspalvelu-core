# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['PurposeTestCase::test_creating_purpose 1'] = {
    'data': {
        'createPurpose': {
            'errors': None,
            'purpose': {
                'name': 'Created purpose'
            }
        }
    }
}

snapshots['PurposeTestCase::test_updating_purpose 1'] = {
    'updatePurpose': {
        'errors': None,
        'purpose': {
            'name': 'Updated name'
        }
    }
}
