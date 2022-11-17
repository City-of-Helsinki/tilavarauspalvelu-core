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
