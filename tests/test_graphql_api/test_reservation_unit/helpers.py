from tests.helpers import build_mutation

TIMESLOTS_QUERY = """
    query {
        reservationUnits {
            edges {
                node {
                    applicationRoundTimeSlots {
                        weekday
                        closed
                        reservableTimes {
                            begin
                            end
                        }
                    }
                }
            }
        }
    }
"""

CREATE_MUTATION = build_mutation(
    "createReservationUnit",
    "ReservationUnitCreateMutationInput",
)

UPDATE_MUTATION = build_mutation(
    "updateReservationUnit",
    "ReservationUnitUpdateMutationInput",
)
