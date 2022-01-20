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

snapshots['ReservationQueryTestCase::test_admin_can_read_working_memo 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'workingMemo': "i'm visible to staff users"
                    }
                }
            ]
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_reservation_state_requires_handling 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Show me',
                        'state': 'REQUIRES_HANDLING'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationQueryTestCase::test_regular_user_cant_read_working_memo 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'workingMemo': None
                    }
                }
            ]
        }
    }
}

snapshots['ReservationQueryTestCase::test_reservation_query 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'ageGroup': {
                            'maximum': 30,
                            'minimum': 18
                        },
                        'applyingForFreeOfCharge': True,
                        'begin': '2021-10-12T12:00:00+00:00',
                        'billingAddressCity': 'Turku',
                        'billingAddressStreet': 'Aurakatu 12B',
                        'billingAddressZip': '20100',
                        'billingEmail': 'billing@example.com',
                        'billingFirstName': 'Reser',
                        'billingLastName': 'Vee',
                        'billingPhone': '+358234567890',
                        'bufferTimeAfter': 1800,
                        'bufferTimeBefore': 900,
                        'description': 'movies&popcorn',
                        'end': '2021-10-12T13:00:00+00:00',
                        'freeOfChargeReason': 'This is some reason.',
                        'homeCity': {
                            'name': 'Test'
                        },
                        'name': 'movies',
                        'numPersons': None,
                        'price': 10.0,
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
                        'reserveeAddressCity': 'Helsinki',
                        'reserveeAddressStreet': 'Mannerheimintie 2',
                        'reserveeAddressZip': '00100',
                        'reserveeEmail': 'reservee@example.com',
                        'reserveeFirstName': 'Reser',
                        'reserveeId': '5727586-5',
                        'reserveeIsUnregisteredAssociation': False,
                        'reserveeLastName': 'Vee',
                        'reserveeOrganisationName': 'Test organisation',
                        'reserveePhone': '+358123456789',
                        'reserveeType': 'INDIVIDUAL',
                        'state': 'CREATED',
                        'taxPercentageValue': '24.00',
                        'unitPrice': 10.0,
                        'user': 'joe.regularl@foo.com'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationQueryTestCase::test_reservation_total_count 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'state': 'CREATED'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}
