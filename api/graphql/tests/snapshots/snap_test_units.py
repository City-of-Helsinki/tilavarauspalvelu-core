# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['UnitsQueryTestCase::test_getting_only_with_permission_when_service_sector_admin 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Service sector unit'
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_getting_only_with_permission_when_unit_admin 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Test unit'
                    }
                },
                {
                    'node': {
                        'nameFi': "Show me! I'm from unit group"
                    }
                },
                {
                    'node': {
                        'nameFi': "Me too, i'm just a jUnit"
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_getting_own_reservations_false 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Test unit'
                    }
                },
                {
                    'node': {
                        'nameFi': "I'm in a result as I should with Test unit."
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_getting_own_reservations_true 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Include me A'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Include me B'
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_getting_units 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'descriptionEn': '',
                        'descriptionFi': 'Test description',
                        'descriptionSv': '',
                        'email': 'test@example.com',
                        'location': None,
                        'nameEn': None,
                        'nameFi': 'Test unit',
                        'nameSv': None,
                        'phone': '+358 12 34567',
                        'reservationUnits': [
                        ],
                        'serviceSectors': [
                        ],
                        'shortDescriptionEn': '',
                        'shortDescriptionFi': 'Short description',
                        'shortDescriptionSv': '',
                        'spaces': [
                        ],
                        'webPage': 'https://hel.fi'
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_getting_units_filtered_by_name 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Bbbbbb'
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_getting_units_filtered_by_service_sector 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Aaaaaa'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Bbbbbb'
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_getting_units_sorted_by_name_asc 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Aaaaaa'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Bbbbbb'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Cccccc'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Test unit'
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_getting_units_sorted_by_name_desc 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Test unit'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Cccccc'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Bbbbbb'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Aaaaaa'
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_getting_units_with_published_reservation_units 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Include me A'
                    }
                },
                {
                    'node': {
                        'nameFi': 'Include me B'
                    }
                }
            ]
        }
    }
}

snapshots['UnitsQueryTestCase::test_order_by_own_reservation_count 1'] = {
    'data': {
        'units': {
            'edges': [
                {
                    'node': {
                        'nameFi': "I'm first"
                    }
                },
                {
                    'node': {
                        'nameFi': 'Then me'
                    }
                },
                {
                    'node': {
                        'nameFi': "I'm last."
                    }
                }
            ]
        }
    }
}
