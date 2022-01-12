# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationDenyReasonsQueryTestCase::test_getting_reservation_deny_reasons_for_logged_in_user 1'] = {
    'data': {
        'reservationDenyReasons': {
            'edges': [
                {
                    'node': {
                        'reasonEn': 'en',
                        'reasonFi': 'fi',
                        'reasonSv': 'sv'
                    }
                }
            ]
        }
    }
}
