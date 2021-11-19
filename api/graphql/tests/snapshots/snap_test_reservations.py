# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationQueryTestCase::test_reservation_query 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'begin': '2021-10-12T12:00:00+00:00',
                        'bufferTimeAfter': None,
                        'bufferTimeBefore': None,
                        'description': 'movies&popcorn',
                        'end': '2021-10-12T13:00:00+00:00',
                        'name': 'movies',
                        'numPersons': None,
                        'priority': 'A_100',
                        'purpose': {
                            'nameFi': 'purpose'
                        },
                        'recurringReservation': None,
                        'reservationUnits': [
                            {
                                'nameFi': 'resunit'
                            }
                        ],
                        'reserveeFirstName': 'Reser',
                        'reserveeLastName': 'Vee',
                        'reserveePhone': '',
                        'state': 'CREATED',
                        'user': 'joe.regularl@foo.com'
                    }
                }
            ]
        }
    }
}
