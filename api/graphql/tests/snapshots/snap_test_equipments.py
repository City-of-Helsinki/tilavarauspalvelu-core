# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['EquipmentCategoryQueryTestCase::test_getting_equipment_category 1'] = {
    'data': {
        'equipmentCategories': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Test Category'
                    }
                }
            ]
        }
    }
}

snapshots['EquipmentQueryTestCase::test_getting_equipment 1'] = {
    'data': {
        'equipments': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Test equipment'
                    }
                }
            ]
        }
    }
}
