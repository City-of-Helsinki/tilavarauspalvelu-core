# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ApplicationRoundQueryTestCase::test_getting_application_rounds 1'] = {
    'data': {
        'applicationRounds': {
            'edges': [
                {
                    'node': {
                        'aggregatedData': {
                            'allocationDurationTotal': None,
                            'allocationResultEventsCount': None,
                            'totalHourCapacity': None,
                            'totalReservationDuration': None
                        },
                        'allocating': False,
                        'applicationRoundBaskets': [
                        ],
                        'applicationsSent': True,
                        'approvedBy': '',
                        'criteriaEn': 'Criteria en',
                        'criteriaFi': 'Criteria fi',
                        'criteriaSv': 'Criteria sv',
                        'nameEn': 'Test application round en',
                        'nameFi': 'Test application round fi',
                        'nameSv': 'Test application round sv',
                        'purposes': [
                        ],
                        'reservationUnits': [
                        ],
                        'status': 'draft',
                        'statusTimestamp': '2021-05-03T03:21:34+00:00',
                        'targetGroup': 'ALL'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}
