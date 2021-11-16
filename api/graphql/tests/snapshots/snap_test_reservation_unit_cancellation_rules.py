# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationUnitCancellationRulesQueryTestCase::test_getting_reservation_unit_cancellation_rules_for_logged_in_user 1'] = {
    'data': {
        'reservationUnitCancellationRules': {
            'edges': [
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'fi',
                        'nameSv': 'sv',
                        'pk': 1
                    }
                }
            ]
        }
    }
}
