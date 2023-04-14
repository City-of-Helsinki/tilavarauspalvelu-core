# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ApplicationEventQueryTestCase::test_application_event_reduction_count 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'weeklyAmountReductionsCount': 1
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_application_shows 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'application': {
                            'additionalInformation': 'Something to fill the field with text'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_filter_by_applicant_type 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'begin': '12:00:00',
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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
                },
                {
                    'node': {
                        'applicationEventSchedules': [
                        ],
                        'eventReservationUnits': [
                        ],
                        'name': 'I should be listed',
                        'numPersons': None,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}

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

snapshots['ApplicationEventQueryTestCase::test_filter_by_application_status 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                        ],
                        'eventReservationUnits': [
                        ],
                        'name': 'I only should be listed',
                        'numPersons': None,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_filter_by_applied_count_gte 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'begin': '12:00:00',
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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

snapshots['ApplicationEventQueryTestCase::test_filter_by_applied_count_gte_lte 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'begin': '12:00:00',
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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
                },
                {
                    'node': {
                        'applicationEventSchedules': [
                        ],
                        'eventReservationUnits': [
                        ],
                        'name': 'Show me',
                        'numPersons': None,
                        'status': 'created'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventQueryTestCase::test_filter_by_applied_count_lte 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'begin': '12:00:00',
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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

snapshots['ApplicationEventQueryTestCase::test_filter_by_name 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'begin': '12:00:00',
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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

snapshots['ApplicationEventScheduleResultQueryTestCase::test_schedule_results 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'applicationEventScheduleResult': {
                                    'accepted': False,
                                    'allocatedBegin': '12:00:00',
                                    'allocatedDay': 0,
                                    'allocatedEnd': '14:00:00',
                                    'allocatedReservationUnit': {
                                        'nameFi': 'You got this reservation unit'
                                    },
                                    'declined': False
                                },
                                'begin': '12:00:00',
                                'day': 1,
                                'end': '13:00:00',
                                'priority': 300
                            },
                            {
                                'applicationEventScheduleResult': None,
                                'begin': '13:00:00',
                                'day': 2,
                                'end': '14:00:00',
                                'priority': 200
                            },
                            {
                                'applicationEventScheduleResult': None,
                                'begin': '14:00:00',
                                'day': 3,
                                'end': '15:00:00',
                                'priority': 100
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
