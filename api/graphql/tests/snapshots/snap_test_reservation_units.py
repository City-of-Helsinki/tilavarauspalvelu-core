# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationUnitTestCase::test_filtering_by_keyword_group 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'keywordGroups': [
                            {
                                'name': 'Sports'
                            }
                        ],
                        'name': 'Test name'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_filtering_by_max_persons 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'maxPersons': 110,
                        'name': 'Test name'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_filtering_by_max_persons_not_found 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_filtering_by_reservation_unit_description 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'description': 'Lorem ipsum',
                        'name': 'Test name'
                    }
                },
                {
                    'node': {
                        'description': 'Lorem ipsum',
                        'name': 'Test name'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_filtering_by_reservation_unit_name 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'name': 'Test name'
                    }
                },
                {
                    'node': {
                        'name': 'Test name'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_filtering_by_space_name 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'name': 'Test name',
                        'spaces': [
                            {
                                'name': 'space name'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_filtering_by_type 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'name': 'Test name',
                        'reservationUnitType': {
                            'name': 'Test type'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_filtering_by_type_text 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'name': 'Test name',
                        'reservationUnitType': {
                            'name': 'Test type'
                        }
                    }
                },
                {
                    'node': {
                        'name': 'Test name',
                        'reservationUnitType': {
                            'name': 'Test type'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_getting_hauki_url 1'] = {
    'data': {
        'reservationUnitByPk': {
            'haukiUrl': {
                'url': 'https://test.com/resource/origin:3774af34-9916-40f2-acc7-68db5a627710/?hsa_source=origin&hsa_username=AnonymousUser&hsa_organization=ORGANISATION&hsa_created_at=2021-05-03 00:00:00+00:00&hsa_valid_until=2021-05-03 00:30:00+00:00&hsa_resource=origin:3774af34-9916-40f2-acc7-68db5a627710&hsa_signature=8df8cd01df388f8f1aad70e82035eaae3a27d33c2f3e3583bb7f9bb7aca966f1'
            },
            'name': 'Test name'
        }
    }
}

snapshots['ReservationUnitTestCase::test_getting_reservation_units 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'contactInformation': '',
                        'description': '',
                        'equipment': [
                        ],
                        'images': [
                        ],
                        'location': None,
                        'maxPersons': 110,
                        'name': 'Test name',
                        'purposes': [
                        ],
                        'requireIntroduction': False,
                        'reservationUnitType': {
                            'name': 'Test type'
                        },
                        'resources': [
                        ],
                        'services': [
                        ],
                        'spaces': [
                            {
                                'name': 'Large space'
                            },
                            {
                                'name': 'Small space'
                            }
                        ],
                        'termsOfUse': ''
                    }
                }
            ]
        }
    }
}
