# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationUnitsFilterReservationStateTestCase::test_filtering_by_mixed 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I am scheduled for reservation!',
                        'reservationState': 'SCHEDULED_RESERVATION'
                    }
                },
                {
                    'node': {
                        'nameFi': "Yey! I'm reservable!",
                        'reservationState': 'RESERVABLE'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterReservationStateTestCase::test_filtering_by_reservable 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': "Yey! I'm reservable!",
                        'reservationState': 'RESERVABLE'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterReservationStateTestCase::test_filtering_by_reservation_closed 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'reservationState': 'RESERVATION_CLOSED'
                    }
                },
                {
                    'node': {
                        'nameFi': 'My reservations are closed',
                        'reservationState': 'RESERVATION_CLOSED'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterReservationStateTestCase::test_filtering_by_scheduled_closing 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I am scheduled closing',
                        'reservationState': 'SCHEDULED_CLOSING'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterReservationStateTestCase::test_filtering_by_scheduled_period 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I am scheduled period',
                        'reservationState': 'SCHEDULED_PERIOD'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterReservationStateTestCase::test_filtering_by_scheduled_reservation 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I am scheduled for reservation!',
                        'reservationState': 'SCHEDULED_RESERVATION'
                    }
                }
            ]
        }
    }
}
