# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ApplicationsGraphQLTestCase::test_application_aggregate_data_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'aggregatedData': {
                            'appliedMinDurationTotal': 0.0,
                            'appliedReservationsTotal': 0.0,
                            'createdReservationsTotal': 0.0,
                            'reservationsDurationTotal': 0.0
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_applicant_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicantEmail': 'joe.regularl@foo.com',
                        'applicantName': 'joe regular'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_applicant_no_value 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicantEmail': None,
                        'applicantName': None
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_application_events_ability_group_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicationEvents': [
                            {
                                'abilityGroup': {
                                    'name': 'Ability test group'
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_application_events_age_group 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicationEvents': [
                            {
                                'ageGroup': {
                                    'maximum': 15,
                                    'minimum': 10
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_application_events_aggregated_data_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicationEvents': [
                            {
                                'aggregatedData': {
                                    'allocationResultsDurationTotal': None,
                                    'allocationResultsReservationsTotal': None,
                                    'durationTotal': None,
                                    'reservationsTotal': None
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_application_events_application_event_schedules_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicationEvents': [
                            {
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
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_application_events_basic_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicationEvents': [
                            {
                                'begin': '2022-05-02',
                                'biweekly': False,
                                'end': '2022-05-05',
                                'eventsPerWeek': 2,
                                'maxDuration': 7200.0,
                                'minDuration': 3600.0,
                                'name': 'Test application',
                                'numPersons': 10,
                                'status': 'created'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_application_events_declined_reservation_unit_ids_field 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicationEvents': [
                            {
                                'declinedReservationUnits': [
                                    {
                                        'nameFi': 'Declined unit FI 1'
                                    },
                                    {
                                        'nameFi': 'Declined unit FI 2'
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_application_events_event_reservation_unit_base_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicationEvents': [
                            {
                                'eventReservationUnits': [
                                    {
                                        'priority': 1
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_application_events_purpose_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'applicationEvents': [
                            {
                                'purpose': {
                                    'nameEn': 'Test purpose EN',
                                    'nameFi': 'Test purpose FI',
                                    'nameSv': 'Test purpose SV'
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_billing_address_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'billingAddress': {
                            'city': 'Helsinki',
                            'postCode': '00100',
                            'streetAddress': 'Test street'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_contact_person_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'contactPerson': {
                            'email': 'test.person@test.com',
                            'firstName': 'Test',
                            'lastName': 'Person',
                            'phoneNumber': '+358400123456'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_home_city_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'homeCity': {
                            'name': 'Test city'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_organisation_fields 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'organisation': {
                            'activeMembers': 200,
                            'address': {
                                'city': 'Helsinki',
                                'postCode': '00100',
                                'streetAddress': 'Organisation street'
                            },
                            'coreBusiness': 'Testing testing',
                            'email': 'organisation@test.com',
                            'identifier': 'Some identifier',
                            'name': 'Test organisation',
                            'organisationType': 'REGISTERED_ASSOCIATION',
                            'yearEstablished': 2022
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_application_status_field 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'status': 'in_review'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLTestCase::test_getting_applications_base_testcase 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}
