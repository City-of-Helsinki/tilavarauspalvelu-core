# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationQueryTestCase::test_filter_by_multiple_reservation_unit 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameFi': 'resunit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'test recurring',
                        'reservationUnit': {
                            'nameFi': 'other unit'
                        }
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameFi': 'resunit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'Test recurring',
                        'reservationUnit': {
                            'nameFi': 'resunit'
                        }
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameFi': 'koirankoppi'
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name 2'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameEn': 'doghouse'
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name 3'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameSv': 'hundkoja'
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name_multiple_values 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameFi': 'koirankoppi'
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name_multiple_values 2'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameEn': 'doghouse'
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_name_multiple_values 3'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameSv': 'hundkoja'
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_type 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'reservationUnitType': {
                                'nameFi': 'reservation_unit_type'
                            }
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_reservation_unit_type_multiple_values 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Another recurring',
                        'reservationUnit': {
                            'reservationUnitType': {
                                'nameFi': 'Another type'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'reservationUnitType': {
                                'nameFi': 'reservation_unit_type'
                            }
                        }
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_unit 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameFi': 'resunit',
                            'unit': {
                                'nameFi': 'unit'
                            }
                        }
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_unit_multiple_values 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'Another recurring',
                        'reservationUnit': {
                            'nameFi': 'Another resunit',
                            'unit': {
                                'nameFi': 'Another unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameFi': 'resunit',
                            'unit': {
                                'nameFi': 'unit'
                            }
                        }
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_filter_by_user 1'] = {
    'data': {
        'recurringReservations': {
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

snapshots['ReservationQueryTestCase::test_general_admin_can_see_all 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'applicationEventPk': None,
                        'applicationPk': None,
                        'name': 'admin movies',
                        'user': 'amin.general@foo.com'
                    }
                },
                {
                    'node': {
                        'applicationEventPk': None,
                        'applicationPk': None,
                        'name': 'movies',
                        'user': 'joe.regularl@foo.com'
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_created_at 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'created': '2021-10-12T09:00:00+00:00',
                        'name': 'this should be 1st'
                    }
                },
                {
                    'node': {
                        'created': '2021-10-12T10:00:00+00:00',
                        'name': 'this should be 2nd'
                    }
                },
                {
                    'node': {
                        'created': '2021-10-12T11:00:00+00:00',
                        'name': 'this should be 3rd'
                    }
                },
                {
                    'node': {
                        'created': '2021-10-12T12:00:00+00:00',
                        'name': 'movies'
                    }
                },
                {
                    'node': {
                        'created': '2021-10-12T22:00:00+00:00',
                        'name': 'this should be last'
                    }
                }
            ],
            'totalCount': 5
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_reservation_unit_name 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnit': {
                            'nameFi': 'a Unit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnit': {
                            'nameFi': 'b Unit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnit': {
                            'nameFi': 'c Unit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameFi': 'resunit'
                        }
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_reservation_unit_name 2'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnit': {
                            'nameEn': 'd Unit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnit': {
                            'nameEn': 'e Unit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnit': {
                            'nameEn': 'f Unit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameEn': None
                        }
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_reservation_unit_name 3'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnit': {
                            'nameSv': 'g unit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnit': {
                            'nameSv': 'h unit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnit': {
                            'nameSv': 'i unit'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'nameSv': None
                        }
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_unit_name 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnit': {
                            'unit': {
                                'nameFi': 'a Unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnit': {
                            'unit': {
                                'nameFi': 'b Unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnit': {
                            'unit': {
                                'nameFi': 'c Unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'unit': {
                                'nameFi': 'unit'
                            }
                        }
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_unit_name 2'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnit': {
                            'unit': {
                                'nameEn': 'd Unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnit': {
                            'unit': {
                                'nameEn': 'e Unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnit': {
                            'unit': {
                                'nameEn': 'f Unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'unit': {
                                'nameEn': None
                            }
                        }
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_order_by_unit_name 3'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'this should be 1st',
                        'reservationUnit': {
                            'unit': {
                                'nameSv': 'g unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 2nd',
                        'reservationUnit': {
                            'unit': {
                                'nameSv': 'h unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'this should be 3rd',
                        'reservationUnit': {
                            'unit': {
                                'nameSv': 'i unit'
                            }
                        }
                    }
                },
                {
                    'node': {
                        'name': 'movies',
                        'reservationUnit': {
                            'unit': {
                                'nameSv': None
                            }
                        }
                    }
                }
            ],
            'totalCount': 4
        }
    }
}

snapshots['ReservationQueryTestCase::test_recurring_reservation_query 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'abilityGroup': None,
                        'ageGroup': None,
                        'applicationEventPk': None,
                        'applicationPk': None,
                        'beginDate': '2021-10-12',
                        'beginTime': '15:00:00',
                        'created': '2021-10-12T12:00:00+00:00',
                        'description': 'good movies',
                        'endDate': '2021-10-12',
                        'endTime': '16:00:00',
                        'name': 'movies',
                        'recurrenceInDays': None,
                        'reservationUnit': {
                            'nameFi': 'resunit'
                        },
                        'user': 'joe.regularl@foo.com',
                        'weekdays': [
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationQueryTestCase::test_recurring_reservation_total_count 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'name': 'movies'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_regular_user_cannot_see_other_than_own 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'applicationEventPk': None,
                        'applicationPk': None,
                        'name': 'movies',
                        'user': 'joe.regularl@foo.com'
                    }
                }
            ],
            'totalCount': 1
        }
    }
}

snapshots['ReservationQueryTestCase::test_service_sector_admin_can_see_recurring_reservations 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'applicationEventPk': None,
                        'applicationPk': None,
                        'name': 'admin movies',
                        'user': None
                    }
                },
                {
                    'node': {
                        'applicationEventPk': None,
                        'applicationPk': None,
                        'name': 'movies',
                        'user': None
                    }
                }
            ],
            'totalCount': 2
        }
    }
}

snapshots['ReservationQueryTestCase::test_unit_admin_can_see_unit_recurrings 1'] = {
    'data': {
        'recurringReservations': {
            'edges': [
                {
                    'node': {
                        'applicationEventPk': None,
                        'applicationPk': None,
                        'name': 'admin movies',
                        'user': None
                    }
                },
                {
                    'node': {
                        'applicationEventPk': None,
                        'applicationPk': None,
                        'name': 'movies',
                        'user': None
                    }
                }
            ],
            'totalCount': 2
        }
    }
}
