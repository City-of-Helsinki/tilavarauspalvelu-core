# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ApplicationEventScheduleResultQueryPermissionsTestCase::test_general_admin_can_see_schedule_result 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'applicationEventScheduleResult': {
                                    'accepted': False
                                }
                            },
                            {
                                'applicationEventScheduleResult': None
                            },
                            {
                                'applicationEventScheduleResult': None
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventScheduleResultQueryPermissionsTestCase::test_regular_user_cannot_see_schedule_result 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'applicationEventScheduleResult': None
                            },
                            {
                                'applicationEventScheduleResult': None
                            },
                            {
                                'applicationEventScheduleResult': None
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventScheduleResultQueryPermissionsTestCase::test_service_sector_admin_can_see_schedule_result 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'applicationEventScheduleResult': {
                                    'accepted': False
                                }
                            },
                            {
                                'applicationEventScheduleResult': None
                            },
                            {
                                'applicationEventScheduleResult': None
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventScheduleResultQueryPermissionsTestCase::test_unit_admin_can_see_schedule_result 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'applicationEventSchedules': [
                            {
                                'applicationEventScheduleResult': {
                                    'accepted': False
                                }
                            },
                            {
                                'applicationEventScheduleResult': None
                            },
                            {
                                'applicationEventScheduleResult': None
                            }
                        ]
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventsGraphQLPermissionsTestCase::test_regular_user_can_view_only_own_applications_event 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'name': 'Test application',
                        'numPersons': 10
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventsGraphQLPermissionsTestCase::test_service_sector_admin_cannot_view_other_sector_than_own 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'name': 'Test application',
                        'numPersons': 10
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventsGraphQLPermissionsTestCase::test_service_sector_user_can_view_event 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'name': 'Test application',
                        'numPersons': 10
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventsGraphQLPermissionsTestCase::test_super_admin_can_view_all_events 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'name': 'Test application',
                        'numPersons': 10
                    }
                },
                {
                    'node': {
                        'name': 'Some event',
                        'numPersons': None
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventsGraphQLPermissionsTestCase::test_unit_admin_can_view_event 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'name': 'Test application',
                        'numPersons': 10
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventsGraphQLPermissionsTestCase::test_unit_admin_cannot_view_other_unit_event 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'name': 'Test application',
                        'numPersons': 10
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventsGraphQLPermissionsTestCase::test_unit_group_admin_can_view_event 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'name': 'Test application',
                        'numPersons': 10
                    }
                }
            ]
        }
    }
}

snapshots['ApplicationEventsGraphQLPermissionsTestCase::test_unit_group_admin_cannot_view_other_group_event 1'] = {
    'data': {
        'applicationEvents': {
            'edges': [
                {
                    'node': {
                        'name': 'Test application',
                        'numPersons': 10
                    }
                }
            ]
        }
    }
}
