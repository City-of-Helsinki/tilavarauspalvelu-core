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

snapshots['ReservationByPkTestCase::test_getting_reservation_of_another_user_by_pk_does_not_reveal_date_of_birth 1'] = {
    'data': {
        'reservationByPk': {
            'user': None
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

snapshots['ReservationByPkTestCase::test_getting_reservation_reservee_date_of_birth_is_logged 1'] = {
    'data': {
        'reservationByPk': {
            'user': {
                'dateOfBirth': '2020-01-01'
            }
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

snapshots['ReservationQueryTestCase::test_filter_by_multiple_reservation_unit 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameFi': 'resunit'
                            }
                        ],
                        'reserveeFirstName': 'Reser',
                        'reserveeLastName': 'Vee'
                    }
                },
                {
                    'node': {
                        'name': 'Test reservation',
                        'reservationUnits': [
                            {
                                'nameFi': 'other unit'
                            }
                        ],
                        'reserveeFirstName': 'First',
                        'reserveeLastName': 'Name'
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_price_gte 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Another reservation',
                        'price': 50.0
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_price_lte 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'price': 10.0
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameFi': 'resunit'
                            }
                        ],
                        'reserveeFirstName': 'Reser',
                        'reserveeLastName': 'Vee'
                    }
                },
                {
                    'node': {
                        'name': 'Test reservation',
                        'reservationUnits': [
                            {
                                'nameFi': 'resunit'
                            }
                        ],
                        'reserveeFirstName': 'First',
                        'reserveeLastName': 'Name'
                    }
                }
            ],
            'totalCount': 2
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

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_type 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'reservationUnitType': {
                                    'nameFi': 'reservation_unit_type'
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

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_type_multiple_values 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Another reservation',
                        'reservationUnits': [
                            {
                                'reservationUnitType': {
                                    'nameFi': 'Another type'
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
                                'reservationUnitType': {
                                    'nameFi': 'reservation_unit_type'
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

snapshots['ReservationQueryTestCase::test_filter_by_text_search_business_reservee_name 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Test reservation',
                        'reserveeOrganisationName': 'Bizniz name will find me'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_text_search_individual_reservee_name 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Test reservation',
                        'reserveeFirstName': 'First',
                        'reserveeLastName': 'Name'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_text_search_name 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Name will find me'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_text_search_non_profit_reservee_name 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Test reservation',
                        'reserveeOrganisationName': 'Non-profit name will find me'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_text_search_numeric 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'ID will find me'
                    }
                }
            ],
            'totalCount': 1
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
                        'user': {
                            'email': 'joe.regularl@foo.com'
                        }
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
                        'createdAt': '2021-10-12T12:00:00+0000',
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
                        'user': {
                            'email': 'joe.regularl@foo.com'
                        }
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
                        'createdAt': '2021-10-12T12:00:00+0000',
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
                        'user': {
                            'email': 'amin.general@foo.com'
                        }
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
                        'createdAt': '2021-10-12T12:00:00+0000',
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
                        'user': {
                            'email': 'joe.regularl@foo.com'
                        }
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_only_with_permission_unit_group_admin_viewer 1'] = {
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
                        'createdAt': '2021-10-12T12:00:00+0000',
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
                        'user': {
                            'email': 'amin.general@foo.com'
                        }
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
                        'createdAt': '2021-10-12T12:00:00+0000',
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
                        'user': {
                            'email': 'joe.regularl@foo.com'
                        }
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

snapshots['ReservationQueryTestCase::test_getting_reservation_with_fields_requiring_special_permissions 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'staffEvent': False,
                        'type': 'normal'
                    }
                }
            ],
            'totalCount': 1
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
                        'createdAt': '2021-10-12T12:00:00+0000',
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
                        'createdAt': '2021-10-12T12:00:00+0000',
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
                        'user': {
                            'email': 'joe.regularl@foo.com'
                        }
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_reservation_unit_name 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnits': [
                            {
                                'nameFi': 'a Unit'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnits': [
                            {
                                'nameFi': 'b Unit'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnits': [
                            {
                                'nameFi': 'c Unit'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameFi': 'resunit'
                            }
                        ]
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_reservation_unit_name 2'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnits': [
                            {
                                'nameEn': 'd Unit'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnits': [
                            {
                                'nameEn': 'e Unit'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnits': [
                            {
                                'nameEn': 'f Unit'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameEn': None
                            }
                        ]
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_reservation_unit_name 3'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnits': [
                            {
                                'nameSv': 'g unit'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnits': [
                            {
                                'nameSv': 'h unit'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnits': [
                            {
                                'nameSv': 'i unit'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnits': [
                            {
                                'nameSv': None
                            }
                        ]
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_reservee_name 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reserveeFirstName': '',
                        'reserveeLastName': '',
                        'reserveeOrganisationName': 'A company',
                        'reserveeType': 'BUSINESS'
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reserveeFirstName': '',
                        'reserveeLastName': '',
                        'reserveeOrganisationName': 'B non-profit',
                        'reserveeType': 'NONPROFIT'
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reserveeFirstName': 'Charlie',
                        'reserveeLastName': 'Chaplin',
                        'reserveeOrganisationName': '',
                        'reserveeType': 'INDIVIDUAL'
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reserveeFirstName': 'Reser',
                        'reserveeLastName': 'Vee',
                        'reserveeOrganisationName': 'Test organisation',
                        'reserveeType': 'INDIVIDUAL'
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_unit_name 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnits': [
                            {
                                'unit': {
                                    'nameFi': 'a Unit'
                                }
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnits': [
                            {
                                'unit': {
                                    'nameFi': 'b Unit'
                                }
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnits': [
                            {
                                'unit': {
                                    'nameFi': 'c Unit'
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
                                'unit': {
                                    'nameFi': 'unit'
                                }
                            }
                        ]
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_unit_name 2'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnits': [
                            {
                                'unit': {
                                    'nameEn': 'd Unit'
                                }
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnits': [
                            {
                                'unit': {
                                    'nameEn': 'e Unit'
                                }
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnits': [
                            {
                                'unit': {
                                    'nameEn': 'f Unit'
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
                                'unit': {
                                    'nameEn': None
                                }
                            }
                        ]
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_unit_name 3'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnits': [
                            {
                                'unit': {
                                    'nameSv': 'g unit'
                                }
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnits': [
                            {
                                'unit': {
                                    'nameSv': 'h unit'
                                }
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnits': [
                            {
                                'unit': {
                                    'nameSv': 'i unit'
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
                                'unit': {
                                    'nameSv': None
                                }
                            }
                        ]
                    }
                }
            ],
            'totalCount': 4
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
                        'staffEvent': None,
                        'state': 'CREATED',
                        'taxPercentageValue': '24.00',
                        'type': None,
                        'unitPrice': 10.0,
                        'user': {
                            'email': 'joe.regularl@foo.com'
                        }
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

snapshots['ReservationQueryTestCase::test_reservee_date_of_birth_is_not_shown_to_reg_user 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'user': None
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_reservee_date_of_birth_is_shown_to_admin_and_logged 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'user': {
                            'dateOfBirth': '2020-01-01'
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_reservee_date_of_birth_is_shown_to_service_sector_admin 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'user': {
                            'dateOfBirth': '2020-01-01'
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_reservee_date_of_birth_is_shown_to_unit_admin 1'] = {
    'data': {
        'reservations': {
            'edges': [
                {
                    'node': {
                        'user': {
                            'dateOfBirth': '2020-01-01'
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}
