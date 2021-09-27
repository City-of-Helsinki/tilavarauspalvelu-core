# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot

snapshots = Snapshot()

snapshots["ReservationTestCase::test_creating_reservation 1"] = {
    "data": {
        "createReservation": {
            "errors": [],
            "reservation": {
                "calendarUrl": "http://testserver/v1/reservation_calendar/1/?hash=12c580bc07340b05441feb8f261786a7cbabb5423a1966c7c13241f39916233c",
                "id": "UmVzZXJ2YXRpb25UeXBlOjE=",
                "priority": "A_100",
            },
        }
    }
}
