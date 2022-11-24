# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['OrderQueryTestCase::test_returns_none_when_not_authenticated 1'] = {
    'data': {
        'order': None
    }
}

snapshots['OrderQueryTestCase::test_returns_order_when_user_can_handle_reservations 1'] = {
    'data': {
        'order': {
            'checkoutUrl': None,
            'orderUuid': 'b3fef99e-6c18-422e-943d-cf00702af53e',
            'paymentType': 'INVOICE',
            'receiptUrl': None,
            'reservationPk': '1',
            'status': 'DRAFT'
        }
    }
}

snapshots['OrderQueryTestCase::test_returns_order_when_user_owns_reservation 1'] = {
    'data': {
        'order': {
            'checkoutUrl': None,
            'orderUuid': 'b3fef99e-6c18-422e-943d-cf00702af53e',
            'paymentType': 'INVOICE',
            'receiptUrl': None,
            'reservationPk': '1',
            'status': 'DRAFT'
        }
    }
}

snapshots['RefreshOrderMutationTestCase::test_get_payment_exceptions_are_logged 1'] = {
    'data': {
        'refreshOrder': None
    },
    'errors': [
        {
            'extensions': {
                'error_code': 'EXTERNAL_SERVICE_ERROR',
                'field': 'nonFieldError'
            },
            'locations': [
                {
                    'column': 17,
                    'line': 3
                }
            ],
            'message': 'Unable to check order payment: problem with external service',
            'path': [
                'refreshOrder'
            ]
        }
    ]
}

snapshots['RefreshOrderMutationTestCase::test_payment_not_found_returns_error_with_no_changes 1'] = {
    'data': {
        'refreshOrder': None
    },
    'errors': [
        {
            'extensions': {
                'error_code': 'NOT_FOUND',
                'field': 'nonFieldError'
            },
            'locations': [
                {
                    'column': 17,
                    'line': 3
                }
            ],
            'message': 'Unable to check order payment',
            'path': [
                'refreshOrder'
            ]
        }
    ]
}

snapshots['RefreshOrderMutationTestCase::test_payment_order_not_found_returns_error 1'] = {
    'data': {
        'refreshOrder': None
    },
    'errors': [
        {
            'extensions': {
                'error_code': 'NO_PERMISSION',
                'field': 'nonFieldError'
            },
            'locations': [
                {
                    'column': 17,
                    'line': 3
                }
            ],
            'message': 'No permission to refresh the order',
            'path': [
                'refreshOrder'
            ]
        }
    ]
}

snapshots['RefreshOrderMutationTestCase::test_reservation_managers_can_call 1'] = {
    'data': {
        'refreshOrder': {
            'orderUuid': 'b3fef99e-6c18-422e-943d-cf00702af53e',
            'status': 'DRAFT'
        }
    }
}

snapshots['RefreshOrderMutationTestCase::test_status_authorized_cause_no_changes 1'] = {
    'data': {
        'refreshOrder': {
            'orderUuid': 'b3fef99e-6c18-422e-943d-cf00702af53e',
            'status': 'DRAFT'
        }
    }
}

snapshots['RefreshOrderMutationTestCase::test_status_created_cause_no_changes 1'] = {
    'data': {
        'refreshOrder': {
            'orderUuid': 'b3fef99e-6c18-422e-943d-cf00702af53e',
            'status': 'DRAFT'
        }
    }
}

snapshots['RefreshOrderMutationTestCase::test_status_paid_online_cause_paid_marking_and_no_notification 1'] = {
    'data': {
        'refreshOrder': {
            'orderUuid': 'b3fef99e-6c18-422e-943d-cf00702af53e',
            'status': 'PAID'
        }
    }
}

snapshots['RefreshOrderMutationTestCase::test_status_paid_online_sends_notification_if_reservation_waiting_for_payment 1'] = {
    'data': {
        'refreshOrder': {
            'orderUuid': 'b3fef99e-6c18-422e-943d-cf00702af53e',
            'status': 'PAID'
        }
    }
}

snapshots['RefreshOrderMutationTestCase::test_status_payment_cancelled_cause_cancellation 1'] = {
    'data': {
        'refreshOrder': {
            'orderUuid': 'b3fef99e-6c18-422e-943d-cf00702af53e',
            'status': 'CANCELLED'
        }
    }
}

snapshots['RefreshOrderMutationTestCase::test_unauthenticated_call_returns_an_error 1'] = {
    'data': {
        'refreshOrder': None
    },
    'errors': [
        {
            'extensions': {
                'error_code': 'NO_PERMISSION',
                'field': 'nonFieldError'
            },
            'locations': [
                {
                    'column': 17,
                    'line': 3
                }
            ],
            'message': 'No permission to refresh the order',
            'path': [
                'refreshOrder'
            ]
        }
    ]
}

snapshots['RefreshOrderMutationTestCase::test_unauthorized_call_returns_an_error 1'] = {
    'data': {
        'refreshOrder': None
    },
    'errors': [
        {
            'extensions': {
                'error_code': 'NO_PERMISSION',
                'field': 'nonFieldError'
            },
            'locations': [
                {
                    'column': 17,
                    'line': 3
                }
            ],
            'message': 'No permission to refresh the order',
            'path': [
                'refreshOrder'
            ]
        }
    ]
}
