# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

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
