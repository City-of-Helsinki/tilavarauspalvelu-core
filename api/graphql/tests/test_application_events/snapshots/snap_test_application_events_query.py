# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ApplicationEventQueryTestCase::test_filter_by_application 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                        ],
                        'eventReservationUnits': [
                        ],
                        'name': 'I should be only event',
                        'numPersons': None,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_filter_by_application_round 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                        ],
                        'eventReservationUnits': [
                        ],
                        'name': 'I should be only event',
                        'numPersons': None,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_filter_by_pk 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                        ],
                        'eventReservationUnits': [
                        ],
                        'name': 'Show only me',
                        'numPersons': None,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_filter_by_reservation_unit 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'begin': '12:00:00',
                                'day': 'A_1',
                                'end': '13:00:00',
                                'priority': 'A_300'
                            },
                            {
                                'begin': '13:00:00',
                                'day': 'A_2',
                                'end': '14:00:00',
                                'priority': 'A_200'
                            },
                            {
                                'begin': '14:00:00',
                                'day': 'A_3',
                                'end': '15:00:00',
                                'priority': 'A_100'
                            }
                        ],
                        'eventReservationUnits': [
                            {
                                'reservationUnit': {
                                    'nameFi': 'Declined unit FI 1',
                                    'reservationUnitType': {
                                        'nameFi': 'Type of resunit'
                                    },
                                    'resources': [
                                    ],
                                    'unit': {
                                        'nameFi': None
                                    }
                                }
                            }
                        ],
                        'name': 'Test application',
                        'numPersons': 10,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_filter_by_status 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                        ],
                        'eventReservationUnits': [
                        ],
                        'name': 'Only I should be listed',
                        'numPersons': None,
                        'status': 'approved'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_filter_by_unit 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'begin': '12:00:00',
                                'day': 'A_1',
                                'end': '13:00:00',
                                'priority': 'A_300'
                            },
                            {
                                'begin': '13:00:00',
                                'day': 'A_2',
                                'end': '14:00:00',
                                'priority': 'A_200'
                            },
                            {
                                'begin': '14:00:00',
                                'day': 'A_3',
                                'end': '15:00:00',
                                'priority': 'A_100'
                            }
                        ],
                        'eventReservationUnits': [
                            {
                                'reservationUnit': {
                                    'nameFi': 'Declined unit FI 1',
                                    'reservationUnitType': {
                                        'nameFi': 'Type of resunit'
                                    },
                                    'resources': [
                                    ],
                                    'unit': {
                                        'nameFi': None
                                    }
                                }
                            }
                        ],
                        'name': 'Test application',
                        'numPersons': 10,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_filter_by_user 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'begin': '12:00:00',
                                'day': 'A_1',
                                'end': '13:00:00',
                                'priority': 'A_300'
                            },
                            {
                                'begin': '13:00:00',
                                'day': 'A_2',
                                'end': '14:00:00',
                                'priority': 'A_200'
                            },
                            {
                                'begin': '14:00:00',
                                'day': 'A_3',
                                'end': '15:00:00',
                                'priority': 'A_100'
                            }
                        ],
                        'eventReservationUnits': [
                            {
                                'reservationUnit': {
                                    'nameFi': 'Declined unit FI 1',
                                    'reservationUnitType': {
                                        'nameFi': 'Type of resunit'
                                    },
                                    'resources': [
                                    ],
                                    'unit': {
                                        'nameFi': None
                                    }
                                }
                            }
                        ],
                        'name': 'Test application',
                        'numPersons': 10,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_query_ok 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'begin': '12:00:00',
                                'day': 'A_1',
                                'end': '13:00:00',
                                'priority': 'A_300'
                            },
                            {
                                'begin': '13:00:00',
                                'day': 'A_2',
                                'end': '14:00:00',
                                'priority': 'A_200'
                            },
                            {
                                'begin': '14:00:00',
                                'day': 'A_3',
                                'end': '15:00:00',
                                'priority': 'A_100'
                            }
                        ],
                        'eventReservationUnits': [
                            {
                                'reservationUnit': {
                                    'nameFi': 'Declined unit FI 1',
                                    'reservationUnitType': {
                                        'nameFi': 'Type of resunit'
                                    },
                                    'resources': [
                                    ],
                                    'unit': {
                                        'nameFi': None
                                    }
                                }
                            }
                        ],
                        'name': 'Test application',
                        'numPersons': 10,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}
