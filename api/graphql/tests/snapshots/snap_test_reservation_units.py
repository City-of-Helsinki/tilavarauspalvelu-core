# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot

snapshots = Snapshot()

snapshots["ReservationUnitCapacityTestCase::test_getting_reservation_units 1"] = {
    "data": {"reservationUnits": {"edges": [{"node": {"name": "Test name"}}]}}
}
