# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['AgeGroupsGraphQLTestCase::test_getting_age_groups 1'] = {
    'data': {
        'ageGroups': {
            'edges': [
                {
                    'node': {
                        'maximum': 30,
                        'minimum': 18
                    }
                }
            ]
        }
    }
}
