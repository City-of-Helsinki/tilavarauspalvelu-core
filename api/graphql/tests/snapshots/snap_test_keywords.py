# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot

snapshots = Snapshot()

snapshots['ResourceGraphQLTestCase::test_getting_keyword_categories 1'] = {
    'data': {
        'keywordCategories': {
            'edges': [
                {
                    'node': {
                        'keywordGroups': [
                            {
                                'keywords': [
                                    {
                                        'nameFi': 'Test keyword'
                                    }
                                ],
                                'nameFi': 'Test group'
                            }
                        ],
                        'nameFi': 'Test category'
                    }
                }
            ]
        }
    }
}

snapshots['ResourceGraphQLTestCase::test_getting_keyword_groups 1'] = {
    'data': {
        'keywordGroups': {
            'edges': [
                {
                    'node': {
                        'keywords': [
                            {
                                'nameFi': 'Test keyword'
                            }
                        ],
                        'nameFi': 'Test group'
                    }
                }
            ]
        }
    }
}

snapshots['ResourceGraphQLTestCase::test_getting_keywords 1'] = {
    'data': {
        'keywords': {
            'edges': [
                {
                    'node': {
                        'nameFi': 'Test keyword'
                    }
                }
            ]
        }
    }
}
