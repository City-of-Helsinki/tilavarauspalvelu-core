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

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameFi': 'Koirankoppi'
                            }
                        ]
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name 2'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameEn': 'Doghouse'
                            }
                        ]
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name 3'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameSv': 'Hundkoja'
                            }
                        ]
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name_multiple_values 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameFi': 'Koirankoppi'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'second test',
                        'reservationUnits': [
                            {
                                'nameFi': 'Norsutarha'
                            }
                        ]
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name_multiple_values 2'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameEn': 'Doghouse'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'second test',
                        'reservationUnits': [
                            {
                                'nameEn': 'Elephant park'
                            }
                        ]
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name_multiple_values 3'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameSv': 'Hundkoja'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'second test',
                        'reservationUnits': [
                            {
                                'nameSv': 'Elefantparken'
                            }
                        ]
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_unit 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameFi': 'resunit',
                                'unit': {
                                    'nameFi': 'unit'
                                }
                            }
                        ]
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_unit_multiple_values 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Another reservation',
                        'reservationUnits': [
                            {
                                'nameFi': 'Another resunit',
                                'unit': {
                                    'nameFi': 'Another unit'
                                }
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameFi': 'resunit',
                                'unit': {
                                    'nameFi': 'unit'
                                }
                            }
                        ]
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_user 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'user': 'joe.regularl@foo.com'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_only_with_permission 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'begin': '2021-10-12T12:00:00+00:00',
                        'billingAddressCity': 'Turku',
                        'billingAddressStreet': 'Aurakatu 12B',
                        'billingAddressZip': '20100',
                        'billingEmail': 'billing@example.com',
                        'billingFirstName': 'Reser',
                        'billingLastName': 'Vee',
                        'billingPhone': '+358234567890',
                        'cancelDetails': '',
                        'description': 'movies&popcorn',
                        'end': '2021-10-12T13:00:00+00:00',
                        'freeOfChargeReason': 'This is some reason.',
                        'name': 'movies',
                        'reserveeAddressCity': 'Helsinki',
                        'reserveeAddressStreet': 'Mannerheimintie 2',
                        'reserveeAddressZip': '00100',
                        'reserveeEmail': 'reservee@example.com',
                        'reserveeFirstName': 'Reser',
                        'reserveeId': '5727586-5',
                        'reserveeLastName': 'Vee',
                        'reserveeOrganisationName': 'Test organisation',
                        'reserveePhone': '+358123456789',
                        'user': 'joe.regularl@foo.com'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_only_with_permission_admin 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'begin': '2021-10-12T12:00:00+00:00',
                        'billingAddressCity': 'Hidden',
                        'billingAddressStreet': 'Privacy 12B',
                        'billingAddressZip': '20100',
                        'billingEmail': 'hidden.billing@example.com',
                        'billingFirstName': 'Shouldbe',
                        'billingLastName': 'Hidden',
                        'billingPhone': '+358234567890',
                        'cancelDetails': '',
                        'description': 'something super secret',
                        'end': '2021-10-12T13:00:00+00:00',
                        'freeOfChargeReason': 'Only admins can see me.',
                        'name': 'admin movies',
                        'reserveeAddressCity': 'Nowhere',
                        'reserveeAddressStreet': 'Mystery street 2',
                        'reserveeAddressZip': '00100',
                        'reserveeEmail': 'shouldbe.hidden@example.com',
                        'reserveeFirstName': 'Shouldbe',
                        'reserveeId': '5727586-5',
                        'reserveeLastName': 'Hidden',
                        'reserveeOrganisationName': 'Hidden organisation',
                        'reserveePhone': '+358123456789',
                        'user': 'amin.general@foo.com'
                    }
                },
                {
                    'node': {
                        'begin': '2021-10-12T12:00:00+00:00',
                        'billingAddressCity': 'Turku',
                        'billingAddressStreet': 'Aurakatu 12B',
                        'billingAddressZip': '20100',
                        'billingEmail': 'billing@example.com',
                        'billingFirstName': 'Reser',
                        'billingLastName': 'Vee',
                        'billingPhone': '+358234567890',
                        'cancelDetails': '',
                        'description': 'movies&popcorn',
                        'end': '2021-10-12T13:00:00+00:00',
                        'freeOfChargeReason': 'This is some reason.',
                        'name': 'movies',
                        'reserveeAddressCity': 'Helsinki',
                        'reserveeAddressStreet': 'Mannerheimintie 2',
                        'reserveeAddressZip': '00100',
                        'reserveeEmail': 'reservee@example.com',
                        'reserveeFirstName': 'Reser',
                        'reserveeId': '5727586-5',
                        'reserveeLastName': 'Vee',
                        'reserveeOrganisationName': 'Test organisation',
                        'reserveePhone': '+358123456789',
                        'user': 'joe.regularl@foo.com'
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_requested 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': "I'm requesting this to be dealt with. Oh this is already dealt with, nice!",
                        'state': 'CONFIRMED'
                    }
                },
                {
                    'node': {
                        'name': 'This is requested',
                        'state': 'REQUIRES_HANDLING'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_reservation_state_accepts_multiple_values 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Show me too',
                        'state': 'CANCELLED'
                    }
                },
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

snapshots['ReservationQueryTestCase::test_hide_fields_with_personal_information 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'begin': '2021-10-12T12:00:00+00:00',
                        'billingAddressCity': None,
                        'billingAddressStreet': None,
                        'billingAddressZip': None,
                        'billingEmail': None,
                        'billingFirstName': None,
                        'billingLastName': None,
                        'billingPhone': None,
                        'cancelDetails': None,
                        'description': None,
                        'end': '2021-10-12T13:00:00+00:00',
                        'freeOfChargeReason': None,
                        'name': 'admin movies',
                        'reserveeAddressCity': None,
                        'reserveeAddressStreet': None,
                        'reserveeAddressZip': None,
                        'reserveeEmail': None,
                        'reserveeFirstName': None,
                        'reserveeId': None,
                        'reserveeLastName': None,
                        'reserveeOrganisationName': None,
                        'reserveePhone': None,
                        'user': None
                    }
                },
                {
                    'node': {
                        'begin': '2021-10-12T12:00:00+00:00',
                        'billingAddressCity': 'Turku',
                        'billingAddressStreet': 'Aurakatu 12B',
                        'billingAddressZip': '20100',
                        'billingEmail': 'billing@example.com',
                        'billingFirstName': 'Reser',
                        'billingLastName': 'Vee',
                        'billingPhone': '+358234567890',
                        'cancelDetails': '',
                        'description': 'movies&popcorn',
                        'end': '2021-10-12T13:00:00+00:00',
                        'freeOfChargeReason': 'This is some reason.',
                        'name': 'movies',
                        'reserveeAddressCity': 'Helsinki',
                        'reserveeAddressStreet': 'Mannerheimintie 2',
                        'reserveeAddressZip': '00100',
                        'reserveeEmail': 'reservee@example.com',
                        'reserveeFirstName': 'Reser',
                        'reserveeId': '5727586-5',
                        'reserveeLastName': 'Vee',
                        'reserveeOrganisationName': 'Test organisation',
                        'reserveePhone': '+358123456789',
                        'user': 'joe.regularl@foo.com'
                    }
                }
            ],
            'totalCount': 2
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
