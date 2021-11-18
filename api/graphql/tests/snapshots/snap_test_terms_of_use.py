# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['TermsOfUseQueryTestCase::test_getting_reservation_unit_purposes 1'] = {
    'data': {
        'termsOfUse': {
            'edges': [
                {
                    'node': {
                        'nameEn': 'name en',
                        'nameFi': 'name fi',
                        'nameSv': 'name sv',
                        'pk': 'some_generic_terms',
                        'termsType': 'GENERIC_TERMS',
                        'textEn': 'text en',
                        'textFi': 'text fi',
                        'textSv': 'text sv'
                    }
                }
            ]
        }
    }
}
