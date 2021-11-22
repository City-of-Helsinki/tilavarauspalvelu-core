# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationByPkTestCase::test_getting_reservation_by_pk 1'] = {
    'data': {
        'reservationByPk': {
            'name': 'Test reservation',
            'reserveeFirstName': 'Joe',
            'reserveeLastName': 'Regular',
            'reserveePhone': '+358123456789'
        }
    }
}

snapshots['ReservationByPkTestCase::test_getting_reservation_of_another_user_by_pk_does_not_reveal_reservee_name 1'] = {
    'data': {
        'reservationByPk': {
            'name': 'Test reservation',
            'reserveeFirstName': None,
            'reserveeLastName': None,
            'reserveePhone': None
        }
    }
}

snapshots['ReservationQueryTestCase::test_getting_reservation_by_pk 1'] = {
    'data': {
        'reservationByPk': {
            'name': 'Test reservation',
            'reserveeFirstName': 'Joe',
            'reserveeLastName': 'Regular',
            'reserveePhone': '+358123456789'
        }
    }
}

snapshots['ReservationQueryTestCase::test_getting_reservation_of_another_user_by_pk_does_not_reveal_reservee_name 1'] = {
    'data': {
        'reservationByPk': {
            'name': 'Test reservation',
            'reserveeFirstName': None,
            'reserveeLastName': None,
            'reserveePhone': None
        }
    }
}

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
