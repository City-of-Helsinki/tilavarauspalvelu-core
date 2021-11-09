# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationCancelReasonsQueryTestCase::test_getting_reservation_cancel_reasons 1'] = {
    'data': {
        'reservationCancelReasons': {
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

snapshots['ReservationCancelReasonsQueryTestCase::test_getting_reservation_cancel_reasons_for_logged_in_user 1'] = {
    'data': {
        'reservationCancelReasons': {
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
