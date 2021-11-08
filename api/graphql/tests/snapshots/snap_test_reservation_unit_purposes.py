# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationUnitPurposeQueryTestCase::test_getting_reservation_unit_purposes 1'] = {
    'data': {
        'reservationUnitPurposes': {
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
