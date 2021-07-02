# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationUnitTestCase::test_getting_reservation_units 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'contactInformation': '',
                        'description': '',
                        'equipment': [
                        ],
                        'images': [
                        ],
                        'location': None,
                        'maxPersons': None,
                        'name': 'Test name',
                        'purposes': [
                        ],
                        'requireIntroduction': False,
                        'reservationUnitType': {
                            'name': 'Test type'
                        },
                        'resources': [
                        ],
                        'services': [
                        ],
                        'spaces': [
                        ],
                        'termsOfUse': ''
                    }
                }
            ]
        }
    }
}
