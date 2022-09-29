# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationUnitQueryTestCase::test_admin_sees_reservations_sensitive_information 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'reservations': [
                            {
                                'billingAddressCity': 'city',
                                'billingAddressStreet': 'addr',
                                'billingAddressZip': 'zip',
                                'billingEmail': 'email',
                                'billingFirstName': 'Joe',
                                'billingLastName': 'Reggie',
                                'billingPhone': 'phone',
                                'cancelDetails': 'cancdetails',
                                'description': 'description',
                                'freeOfChargeReason': 'reason',
                                'reserveeAddressCity': 'city',
                                'reserveeAddressStreet': 'address',
                                'reserveeAddressZip': 'zip',
                                'reserveeEmail': 'email@localhost',
                                'reserveeFirstName': 'Joe',
                                'reserveeId': 'residee',
                                'reserveeLastName': 'Reggie',
                                'reserveeOrganisationName': 'org name',
                                'reserveePhone': '123435',
                                'staffEvent': False,
                                'user': 'joe.regularl@foo.com',
                                'workingMemo': 'Working this memo'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filter_by_pk_multiple_values 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Second unit'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filter_by_pk_single_value 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filter_only_with_permission_general_admin_admin 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi'
                    }
                },
                {
                    'node': {
                        'nameFi': "I'm in the results with the other one too."
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filter_only_with_permission_service_sector_admin 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'I should be in the result'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filter_only_with_permission_unit_admin 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': "I'm in result since i'm in the group"
                    }
                },
                {
                    'node': {
                        'nameFi': 'I should be in the result'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_active_application_rounds 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'applicationRounds': [
                            {
                                'nameFi': 'Test Round'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_is_draft_false 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'isDraft': False,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_is_draft_true 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'isDraft': True,
                        'nameFi': 'Draft reservation unit'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_is_visible_false 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_is_visible_true 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'publishBegins': '2021-05-03T00:00:00+00:00',
                        'publishEnds': '2021-05-10T00:00:00+00:00'
                    }
                },
                {
                    'node': {
                        'nameFi': 'show me',
                        'publishBegins': None,
                        'publishEnds': None
                    }
                },
                {
                    'node': {
                        'nameFi': 'show me too!',
                        'publishBegins': '2021-04-28T00:00:00+00:00',
                        'publishEnds': '2021-05-13T00:00:00+00:00'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Take me in!',
                        'publishBegins': '2021-04-28T00:00:00+00:00',
                        'publishEnds': None
                    }
                },
                {
                    'node': {
                        'nameFi': 'Take me in too!',
                        'publishBegins': None,
                        'publishEnds': '2021-05-08T00:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_keyword_group 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'keywordGroups': [
                            {
                                'nameFi': 'Sports'
                            }
                        ],
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_max_persons_gte_not_set 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'maxPersons': None,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_max_persons_gte_outside_limit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_max_persons_gte_within_limit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'maxPersons': 200,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_max_persons_lte_not_set 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'maxPersons': None,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_max_persons_lte_outside_limit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_max_persons_lte_within_limit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'maxPersons': 200,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_min_persons_gte_not_set 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'minPersons': None,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_min_persons_gte_outside_limit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_min_persons_gte_within_limit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'minPersons': 10,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_min_persons_lte_not_set 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'minPersons': None,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_min_persons_lte_outside_limit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_min_persons_lte_within_limit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'minPersons': 10,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_multiple_application_round 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Reservation unit'
                    }
                },
                {
                    'node': {
                        'nameFi': 'The Other reservation unit'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_multiple_keyword_groups 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'keywordGroups': [
                            {
                                'nameFi': 'Test group'
                            }
                        ],
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_multiple_purposes 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'purposes': [
                            {
                                'nameFi': 'Test purpose'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_multiple_qualifiers 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'qualifiers': [
                            {
                                'nameFi': 'Filter test qualifier'
                            }
                        ]
                    }
                },
                {
                    'node': {
                        'nameFi': 'Other reservation unit',
                        'qualifiers': [
                            {
                                'nameFi': 'Other filter test qualifier'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_multiple_reservation_states 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'reservations': [
                            {
                                'begin': '2021-05-03T00:00:00+00:00',
                                'end': '2021-05-03T01:00:00+00:00',
                                'state': 'CREATED'
                            },
                            {
                                'begin': '2021-05-03T01:00:00+00:00',
                                'end': '2021-05-03T02:00:00+00:00',
                                'state': 'CONFIRMED'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_multiple_types 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'reservationUnitType': {
                            'nameFi': 'test type fi'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'Other reservation unit',
                        'reservationUnitType': {
                            'nameFi': 'Other type'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_multiple_units 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'unit': {
                            'nameFi': 'test unit fi'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'Other reservation unit',
                        'unit': {
                            'nameFi': 'Other unit'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_name_fi 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'show only me'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_purpose 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'purposes': [
                            {
                                'nameFi': 'Test purpose'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_qualifier 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'qualifiers': [
                            {
                                'nameFi': 'Filter test qualifier'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_rank 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'rank': 2
                    }
                },
                {
                    'node': {
                        'rank': 3
                    }
                },
                {
                    'node': {
                        'rank': 4
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_reservation_kind_direct 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi'
                    }
                },
                {
                    'node': {
                        'nameFi': 'show me'
                    }
                },
                {
                    'node': {
                        'nameFi': 'show me as well'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_reservation_kind_season 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi'
                    }
                },
                {
                    'node': {
                        'nameFi': 'show me'
                    }
                },
                {
                    'node': {
                        'nameFi': 'show me as well'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_reservation_state 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'reservations': [
                            {
                                'begin': '2021-05-03T00:00:00+00:00',
                                'end': '2021-05-03T01:00:00+00:00',
                                'state': 'CREATED'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_reservation_timestamps 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'reservations': [
                            {
                                'begin': '2021-05-03T00:00:00+00:00',
                                'end': '2021-05-03T01:00:00+00:00',
                                'state': 'CREATED'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_surface_area 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'surfaceArea': '120.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '90.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '60.00'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_type 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'reservationUnitType': {
                            'nameFi': 'test type fi'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_type_rank 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Rank 2',
                        'reservationUnitType': {
                            'rank': 2
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'Rank 3',
                        'reservationUnitType': {
                            'rank': 3
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'Rank 4',
                        'reservationUnitType': {
                            'rank': 4
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_filtering_by_unit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'unit': {
                            'nameFi': 'test unit fi'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_getting_hauki_url_is_none_when_regular_user 1'] = {
    'data': {
        'reservationUnitByPk': {
            'haukiUrl': {
                'url': None
            },
            'nameFi': 'test name fi'
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_getting_manually_given_surface_area 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'surfaceArea': '500.00'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_getting_reservation_units 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'allowReservationsWithoutOpeningHours': False,
                        'applicationRounds': [
                        ],
                        'authentication': 'WEAK',
                        'bufferTimeAfter': 900,
                        'bufferTimeBefore': 900,
                        'canApplyFreeOfCharge': False,
                        'cancellationRule': {
                            'nameEn': 'en',
                            'nameFi': 'fi',
                            'nameSv': 'sv'
                        },
                        'contactInformation': '',
                        'descriptionFi': '',
                        'equipment': [
                        ],
                        'highestPrice': '20.00',
                        'images': [
                        ],
                        'isArchived': False,
                        'location': None,
                        'lowestPrice': '0.00',
                        'maxPersons': 200,
                        'maxReservationDuration': 86400,
                        'maxReservationsPerUser': 5,
                        'metadataSet': {
                            'name': 'Test form',
                            'requiredFields': [
                            ],
                            'supportedFields': [
                            ]
                        },
                        'minPersons': 10,
                        'minReservationDuration': 600,
                        'nameFi': 'test name fi',
                        'paymentMerchant': None,
                        'paymentTypes': [
                            {
                                'code': 'ONLINE'
                            }
                        ],
                        'priceUnit': 'PER_HOUR',
                        'pricingTerms': {
                            'termsType': 'PRICING_TERMS'
                        },
                        'pricingType': 'PAID',
                        'pricings': [
                            {
                                'begins': '2021-01-01',
                                'highestPrice': '10.00',
                                'lowestPrice': '5.00',
                                'priceUnit': 'PER_15_MINS',
                                'pricingType': 'PAID',
                                'status': 'ACTIVE',
                                'taxPercentage': {
                                    'value': '10.00'
                                }
                            }
                        ],
                        'publishBegins': '2021-05-03T00:00:00+00:00',
                        'publishEnds': '2021-05-10T00:00:00+00:00',
                        'purposes': [
                        ],
                        'qualifiers': [
                            {
                                'nameFi': 'Test Qualifier'
                            }
                        ],
                        'requireIntroduction': False,
                        'requireReservationHandling': False,
                        'reservationBegins': '2021-05-03T00:00:00+00:00',
                        'reservationCancelledInstructionsEn': '',
                        'reservationCancelledInstructionsFi': '',
                        'reservationCancelledInstructionsSv': '',
                        'reservationConfirmedInstructionsEn': 'Additional instructions for the approved reservation',
                        'reservationConfirmedInstructionsFi': 'Hyväksytyn varauksen lisäohjeita',
                        'reservationConfirmedInstructionsSv': 'Ytterligare instruktioner för den godkända reservationen',
                        'reservationEnds': '2021-05-03T00:00:00+00:00',
                        'reservationKind': 'DIRECT_AND_SEASON',
                        'reservationPendingInstructionsEn': '',
                        'reservationPendingInstructionsFi': '',
                        'reservationPendingInstructionsSv': '',
                        'reservationStartInterval': 'INTERVAL_30_MINS',
                        'reservationUnitType': {
                            'nameFi': 'test type fi'
                        },
                        'reservations': [
                        ],
                        'reservationsMaxDaysBefore': 360,
                        'reservationsMinDaysBefore': 1,
                        'resources': [
                        ],
                        'services': [
                            {
                                'bufferTimeAfter': 1800,
                                'bufferTimeBefore': 900,
                                'nameFi': 'Test Service'
                            }
                        ],
                        'spaces': [
                            {
                                'nameFi': 'Large space'
                            },
                            {
                                'nameFi': 'Small space'
                            }
                        ],
                        'state': 'SCHEDULED_RESERVATION',
                        'surfaceArea': '150.00',
                        'taxPercentage': {
                            'value': '24.00'
                        },
                        'termsOfUseFi': None
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_getting_terms 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'cancellationTerms': {
                            'textFi': 'Cancellation terms'
                        },
                        'paymentTerms': {
                            'textFi': 'Payment terms'
                        },
                        'serviceSpecificTerms': {
                            'textFi': 'Service-specific terms'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_hauki_url_for_admin 1'] = {
    'data': {
        'reservationUnitByPk': {
            'haukiUrl': {
                'url': 'https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/?hsa_source=origin&hsa_username=amin.general%40foo.com&hsa_organization=ORGANISATION&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710&hsa_has_organization_rights=true&hsa_signature=cf94d68d518855b144ac5f10b0a8ee7f9ad3dfc14af94333a4d5fe961d65c069'
            },
            'nameFi': 'test name fi'
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_hauki_url_for_unit_manager 1'] = {
    'data': {
        'reservationUnitByPk': {
            'haukiUrl': {
                'url': 'https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/?hsa_source=origin&hsa_username=unit.admin%40foo.com&hsa_organization=ORGANISATION&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710&hsa_has_organization_rights=true&hsa_signature=1b61fc678411c21464160a489f22b369c6e2345c1711314dea5f447bd00a3641'
            },
            'nameFi': 'test name fi'
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_hide_payment_merchant_without_permissions 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'paymentMerchant': None
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_max_persons 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'maxPersons': 1
                    }
                },
                {
                    'node': {
                        'maxPersons': 2
                    }
                },
                {
                    'node': {
                        'maxPersons': 3
                    }
                },
                {
                    'node': {
                        'maxPersons': 4
                    }
                },
                {
                    'node': {
                        'maxPersons': 5
                    }
                },
                {
                    'node': {
                        'maxPersons': 200
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_max_persons_reverse_order 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'maxPersons': 200
                    }
                },
                {
                    'node': {
                        'maxPersons': 5
                    }
                },
                {
                    'node': {
                        'maxPersons': 4
                    }
                },
                {
                    'node': {
                        'maxPersons': 3
                    }
                },
                {
                    'node': {
                        'maxPersons': 2
                    }
                },
                {
                    'node': {
                        'maxPersons': 1
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_name_and_unit_name 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'a',
                        'unit': {
                            'nameFi': '2'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'a',
                        'unit': {
                            'nameFi': '3'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'b',
                        'unit': {
                            'nameFi': '1'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'b',
                        'unit': {
                            'nameFi': '2'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'b',
                        'unit': {
                            'nameFi': '3'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'unit': {
                            'nameFi': 'test unit fi'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_name_and_unit_name_reversed 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'unit': {
                            'nameFi': 'test unit fi'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'b',
                        'unit': {
                            'nameFi': '3'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'b',
                        'unit': {
                            'nameFi': '2'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'b',
                        'unit': {
                            'nameFi': '1'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'a',
                        'unit': {
                            'nameFi': '3'
                        }
                    }
                },
                {
                    'node': {
                        'nameFi': 'a',
                        'unit': {
                            'nameFi': '2'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_name_en 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameEn': 'name_en'
                    }
                },
                {
                    'node': {
                        'nameEn': 'test name en'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_name_fi 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'name_fi'
                    }
                },
                {
                    'node': {
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_name_sv 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameSv': 'name_sv'
                    }
                },
                {
                    'node': {
                        'nameSv': 'test name sv'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_rank 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'rank': 1
                    }
                },
                {
                    'node': {
                        'rank': 2
                    }
                },
                {
                    'node': {
                        'rank': 3
                    }
                },
                {
                    'node': {
                        'rank': 4
                    }
                },
                {
                    'node': {
                        'rank': 5
                    }
                },
                {
                    'node': {
                        'rank': None
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_surface_area 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'surfaceArea': '150.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '1.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '2.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '3.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '4.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '5.00'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_surface_area_reverse_order 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'surfaceArea': '1.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '2.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '3.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '4.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '5.00'
                    }
                },
                {
                    'node': {
                        'surfaceArea': '150.00'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_type_en 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'reservationUnitType': {
                            'nameEn': 'test type en'
                        }
                    }
                },
                {
                    'node': {
                        'reservationUnitType': {
                            'nameEn': None
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_type_fi 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'reservationUnitType': {
                            'nameFi': 'name_fi'
                        }
                    }
                },
                {
                    'node': {
                        'reservationUnitType': {
                            'nameFi': 'test type fi'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_type_rank 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'reservationUnitType': {
                            'rank': 1
                        }
                    }
                },
                {
                    'node': {
                        'reservationUnitType': {
                            'rank': 2
                        }
                    }
                },
                {
                    'node': {
                        'reservationUnitType': {
                            'rank': 3
                        }
                    }
                },
                {
                    'node': {
                        'reservationUnitType': {
                            'rank': 4
                        }
                    }
                },
                {
                    'node': {
                        'reservationUnitType': {
                            'rank': 5
                        }
                    }
                },
                {
                    'node': {
                        'reservationUnitType': {
                            'rank': None
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_type_sv 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'reservationUnitType': {
                            'nameSv': 'test type sv'
                        }
                    }
                },
                {
                    'node': {
                        'reservationUnitType': {
                            'nameSv': None
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_unit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'unit': {
                            'nameEn': '_',
                            'nameFi': '1',
                            'nameSv': '_'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': '_',
                            'nameFi': '2',
                            'nameSv': '1'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': '_',
                            'nameFi': '2',
                            'nameSv': '2'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': '1',
                            'nameFi': '3',
                            'nameSv': '_'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': '2',
                            'nameFi': '3',
                            'nameSv': '_'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': 'test unit en',
                            'nameFi': 'test unit fi',
                            'nameSv': 'test unit sv'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_order_by_unit_reverse_order 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'unit': {
                            'nameEn': 'test unit en',
                            'nameFi': 'test unit fi',
                            'nameSv': 'test unit sv'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': '2',
                            'nameFi': '3',
                            'nameSv': '_'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': '1',
                            'nameFi': '3',
                            'nameSv': '_'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': '_',
                            'nameFi': '2',
                            'nameSv': '2'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': '_',
                            'nameFi': '2',
                            'nameSv': '1'
                        }
                    }
                },
                {
                    'node': {
                        'unit': {
                            'nameEn': '_',
                            'nameFi': '1',
                            'nameSv': '_'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_other_reservations_does_not_show_sensitive_information 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'reservations': [
                            {
                                'billingAddressCity': None,
                                'billingAddressStreet': None,
                                'billingAddressZip': None,
                                'billingEmail': None,
                                'billingFirstName': None,
                                'billingLastName': None,
                                'billingPhone': None,
                                'cancelDetails': None,
                                'description': None,
                                'freeOfChargeReason': None,
                                'reserveeAddressCity': None,
                                'reserveeAddressStreet': None,
                                'reserveeAddressZip': None,
                                'reserveeEmail': None,
                                'reserveeFirstName': None,
                                'reserveeId': None,
                                'reserveeLastName': None,
                                'reserveeOrganisationName': None,
                                'reserveePhone': None,
                                'staffEvent': None,
                                'user': None,
                                'workingMemo': None
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_should_not_return_archived_reservation_units 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'isArchived': False,
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_show_payment_merchant_from_reservation_unit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'paymentMerchant': {
                            'name': 'Test Merchant'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_show_payment_merchant_from_unit 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'paymentMerchant': {
                            'name': 'Test Merchant'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_that_state_is_draft 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'This should be draft',
                        'state': 'DRAFT'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_that_state_is_published 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'This should be published',
                        'state': 'PUBLISHED'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_that_state_is_scheduled_publishing 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'This should be scheduled publishing',
                        'state': 'SCHEDULED_PUBLISHING'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitQueryTestCase::test_that_state_is_scheduled_reservation 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'This should be scheduled reservation',
                        'state': 'SCHEDULED_RESERVATION'
                    }
                }
            ]
        }
    }
}

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

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_reservation_unit_description_en 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'descriptionEn': 'Lorem ipsum en',
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_reservation_unit_description_fi 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'descriptionFi': 'Lorem ipsum fi',
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_reservation_unit_description_sv 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'descriptionSv': 'Lorem ipsum sv',
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_reservation_unit_name_en 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameEn': 'test name en'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_reservation_unit_name_fi 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_reservation_unit_name_sv 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameSv': 'test name sv'
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_space_name_en 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'spaces': [
                            {
                                'nameEn': 'space name en'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_space_name_fi 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'spaces': [
                            {
                                'nameFi': 'space name fi'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_space_name_sv 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'spaces': [
                            {
                                'nameSv': 'space name sv'
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_type_en 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'reservationUnitType': {
                            'nameEn': 'test type en'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_type_fi 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'reservationUnitType': {
                            'nameFi': 'test type fi'
                        }
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitsFilterTextSearchTestCase::test_filtering_by_type_sv 1'] = {
    'data': {
        'reservationUnits': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'test name fi',
                        'reservationUnitType': {
                            'nameSv': 'test type sv'
                        }
                    }
                }
            ]
        }
    }
}
