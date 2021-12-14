# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['TaxPercentagesGraphQLTestCase::test_getting_tax_percentages 1'] = {
    'data': {
        'taxPercentages': {
            'edges': [
                {
                    'node': {
                        'value': '0.00'
                    }
                },
                {
                    'node': {
                        'value': '10.00'
                    }
                },
                {
                    'node': {
                        'value': '14.00'
                    }
                },
                {
                    'node': {
                        'value': '24.00'
                    }
                }
            ]
        }
    }
}
