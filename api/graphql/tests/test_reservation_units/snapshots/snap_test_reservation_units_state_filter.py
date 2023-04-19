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

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_hidden 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I am hidden',
                        'state': 'HIDDEN'
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

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_scheduled_hiding 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'state': 'SCHEDULED_HIDING'
                    }
                },
                {
                    'node': {
                        'nameFi': 'I am scheduled hiding',
                        'state': 'SCHEDULED_HIDING'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_scheduled_period 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I am scheduled period',
                        'state': 'SCHEDULED_PERIOD'
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
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterStateTestCase::test_filtering_by_scheduled_publishing_when_begin_after_end 1'] = {
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
                        'nameFi': "I'm scheduled for publishing and my begins is after end.",
                        'state': 'SCHEDULED_PUBLISHING'
                    }
                }
            ]
        }
    }
}
