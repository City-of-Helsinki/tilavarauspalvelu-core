# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ApplicationsGraphQLFiltersTestCase::test_application_filter_by_application_round 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLFiltersTestCase::test_application_filter_by_status 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLFiltersTestCase::test_application_filter_by_unit 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLFiltersTestCase::test_application_filter_by_user 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text',
                        'applicantType': 'COMMUNITY',
                        'createdDate': '2022-05-02T12:00:00+00:00',
                        'lastModifiedDate': '2022-05-02T12:00:00+00:00'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLFiltersTestCase::test_filter_by_applicant 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLFiltersTestCase::test_order_by_applicant_asc 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Test application 3'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Test application 1'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Test application 2'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Not visible in filter queries but visible in order by'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLFiltersTestCase::test_order_by_applicant_desc 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Not visible in filter queries but visible in order by'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Test application 2'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Test application 1'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Test application 3'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLFiltersTestCase::test_order_by_pk_asc 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Not visible in filter queries but visible in order by'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Test application 1'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Test application 2'
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationsGraphQLFiltersTestCase::test_order_by_pk_desc 1'] = {
    'data': {
        'applications': {
            'edges': [
                {
                    'node': {
                        'additionalInformation': 'Test application 2'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Test application 1'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Not visible in filter queries but visible in order by'
                    }
                },
                {
                    'node': {
                        'additionalInformation': 'Something to fill the field with text'
                    }
                }
            ]
        }
    }
}
