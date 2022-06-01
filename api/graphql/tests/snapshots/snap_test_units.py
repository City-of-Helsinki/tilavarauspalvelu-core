# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['UnitsUpdateTestCase::test_getting_units 1'] = {
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

snapshots['UnitsUpdateTestCase::test_getting_units_sorted_by_name_asc 1'] = {
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

snapshots['UnitsUpdateTestCase::test_getting_units_sorted_by_name_desc 1'] = {
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
