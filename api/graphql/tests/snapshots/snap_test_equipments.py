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

snapshots['EquipmentQueryTestCase::test_filter_equipment_by_category_rank 1'] = {
    'data': {
        'equipments': {
            'edges': [
                {
                    'node': {
                        'category': {
                            'nameFi': 'Test Category 2'
                        },
                        'nameFi': 'And me 2'
                    }
                },
                {
                    'node': {
                        'category': {
                            'nameFi': 'Test Category 1'
                        },
                        'nameFi': 'Show me 1'
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

snapshots['EquipmentQueryTestCase::test_order_equipment_by_category_rank 1'] = {
    'data': {
        'equipments': {
            'edges': [
                {
                    'node': {
                        'category': {
                            'nameFi': 'Test Category 1'
                        },
                        'nameFi': 'Test equipment 1'
                    }
                },
                {
                    'node': {
                        'category': {
                            'nameFi': 'Test Category 2'
                        },
                        'nameFi': 'Test equipment 2'
                    }
                },
                {
                    'node': {
                        'category': {
                            'nameFi': 'Test Category 3'
                        },
                        'nameFi': 'Test equipment 3'
                    }
                }
            ]
        }
    }
}
