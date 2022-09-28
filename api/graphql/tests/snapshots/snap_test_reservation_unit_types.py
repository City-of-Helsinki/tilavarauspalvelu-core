# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationUnitTestCase::test_getting_reservation_unit_types 1'] = {
    'data': {
        'reservationUnitTypes': {
            'edges': [
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'first fi',
                        'nameSv': 'sv',
                        'rank': 1
                    }
                },
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'second fi',
                        'nameSv': 'sv',
                        'rank': 2
                    }
                },
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'third fi',
                        'nameSv': 'sv',
                        'rank': 3
                    }
                },
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'fourth fi',
                        'nameSv': 'sv',
                        'rank': 4
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_getting_reservation_unit_types_sorted_by_name 1'] = {
    'data': {
        'reservationUnitTypes': {
            'edges': [
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'first fi',
                        'nameSv': 'sv',
                        'rank': 1
                    }
                },
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'fourth fi',
                        'nameSv': 'sv',
                        'rank': 4
                    }
                },
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'second fi',
                        'nameSv': 'sv',
                        'rank': 2
                    }
                },
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'third fi',
                        'nameSv': 'sv',
                        'rank': 3
                    }
                }
            ]
        }
    }
}

snapshots['ReservationUnitTestCase::test_getting_reservation_unit_types_with_default_sorting 1'] = {
    'data': {
        'reservationUnitTypes': {
            'edges': [
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'first fi',
                        'nameSv': 'sv',
                        'rank': 1
                    }
                },
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'second fi',
                        'nameSv': 'sv',
                        'rank': 2
                    }
                },
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'third fi',
                        'nameSv': 'sv',
                        'rank': 3
                    }
                },
                {
                    'node': {
                        'nameEn': 'en',
                        'nameFi': 'fourth fi',
                        'nameSv': 'sv',
                        'rank': 4
                    }
                }
            ]
        }
    }
}
