# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_archived_returns_nothing 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
            ]
        }
    }
}

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_draft 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I am a draft!',
                        'state': 'DRAFT'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_mixed 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I am a draft!',
                        'state': 'DRAFT'
                    }
                },
                {
                    'node': {
                        'nameFi': 'I am scheduled for publishing!',
                        'state': 'SCHEDULED_PUBLISHING'
                    }
                },
                {
                    'node': {
                        'nameFi': 'I am also scheduled for publishing!',
                        'state': 'SCHEDULED_PUBLISHING'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_published 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': "Yey! I'm published!",
                        'state': 'PUBLISHED'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_scheduled_publishing 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I am scheduled for publishing!',
                        'state': 'SCHEDULED_PUBLISHING'
                    }
                },
                {
                    'node': {
                        'nameFi': 'I am also scheduled for publishing!',
                        'state': 'SCHEDULED_PUBLISHING'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_scheduled_reservation 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'state': 'SCHEDULED_RESERVATION'
                    }
                },
                {
                    'node': {
                        'nameFi': 'I am scheduled for reservation!',
                        'state': 'SCHEDULED_RESERVATION'
                    }
                },
                {
                    'node': {
                        'nameFi': 'I am also scheduled for reservation!',
                        'state': 'SCHEDULED_RESERVATION'
                    }
                }
            ]
        }
    }
}
