# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ApplicationRoundQueryTestCase::test_applications_count_does_not_include_draft_applications 1'] = {
    'data': {
        'applicationRounds': {
            'edges': [
                {
                    'node': {
                        'applicationsCount': 1
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

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
                        'applicationsCount': 1,
                        'applicationsSent': False,
                        'approvedBy': '',
                        'criteriaEn': 'Criteria en',
                        'criteriaFi': 'Criteria fi',
                        'criteriaSv': 'Criteria sv',
                        'nameEn': 'Test application round en',
                        'nameFi': 'Test application round fi',
                        'nameSv': 'Test application round sv',
                        'purposes': [
                        ],
                        'reservationUnitCount': 1,
                        'reservationUnits': [
                            {
                                'nameFi': 'test reservation unit'
                            }
                        ],
                        'serviceSector': {
                            'nameEn': None,
                            'nameFi': 'service test sector',
                            'nameSv': None
                        },
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
