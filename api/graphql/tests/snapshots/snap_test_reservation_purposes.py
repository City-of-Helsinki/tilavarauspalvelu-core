# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationPurposeQueryTestCase::test_getting_reservation_unit_purposes 1'] = {
    'data': {
        'reservationPurposes': {
            'edges': [
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'fi',
                        'nameSv': 'sv'
                    }
                }
            ]
        }
    }
}
