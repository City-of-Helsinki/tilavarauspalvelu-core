import datetime
import logging
from typing import Dict

from ortools.sat.python import cp_model

from reservations.allocation_models import (
    ALLOCATION_PRECISION,
    AllocationData,
    AllocationEvent,
    AllocationSpace,
)

logger = logging.getLogger(__name__)


def suitable_spaces_for_event(
    allocation_event: AllocationEvent, spaces: Dict[int, AllocationSpace]
) -> Dict[int, AllocationSpace]:
    suitable_spaces = {}
    for space_id, space in spaces.items():
        if space_id in allocation_event.space_ids:
            suitable_spaces[space_id] = space
    return suitable_spaces


class AllocatedEvent(object):
    def __init__(
        self,
        space: AllocationSpace,
        event: AllocationEvent,
        duration: int,
        occurrence_id: int,
    ):
        self.space_id = space.id
        self.event_id = event.id
        self.duration = datetime.timedelta(minutes=duration * ALLOCATION_PRECISION)
        self.occurrence_id = occurrence_id


class AllocationSolutionPrinter(object):
    def __init__(self, model: cp_model.CpModel, spaces, allocation_events, selected={}):
        self.model = model
        self.selected = selected
        self.spaces = spaces
        self.allocation_events = allocation_events

    def print_solution(self):
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)
        solution = []
        if status == cp_model.OPTIMAL:
            logger.info("Total cost = %i" % solver.ObjectiveValue())

            for event in self.allocation_events:
                for occurrence_id, occurrence in event.occurrences.items():
                    for space_id, space in suitable_spaces_for_event(
                        event, self.spaces
                    ).items():
                        if solver.BooleanValue(
                            self.selected[(space.id, event.id, occurrence_id)]
                        ):
                            logger.info(
                                "Space ",
                                space.id,
                                " assigned to application event ",
                                event.id,
                                "  Duration = ",
                                event.min_duration,
                            )
                            solution.append(
                                AllocatedEvent(
                                    space=space,
                                    event=event,
                                    duration=event.min_duration,
                                    occurrence_id=occurrence_id,
                                )
                            )

        logger.info("Statistics")
        logger.info("  - conflicts : %i" % solver.NumConflicts())
        logger.info("  - branches  : %i" % solver.NumBranches())
        logger.info("  - wall time : %f s" % solver.WallTime())
        return solution


class AllocationSolver(object):
    def __init__(self, allocation_data: AllocationData):
        self.spaces: Dict[int, AllocationSpace] = allocation_data.spaces
        self.allocation_events = allocation_data.allocation_events

    def solve(self):
        model = cp_model.CpModel()

        selected = {}
        for allocation_event in self.allocation_events:
            for occurence_id, occurence in allocation_event.occurrences.items():
                for space_id, space in suitable_spaces_for_event(
                    allocation_event, self.spaces
                ).items():
                    selected[
                        (space.id, allocation_event.id, occurence_id)
                    ] = model.NewBoolVar("x[%i,%i]" % (space_id, occurence_id))

        # Each event is assigned to at most one space.
        for event in self.allocation_events:
            for occurrence_id, occurence in event.occurrences.items():
                model.Add(
                    sum(
                        selected[(space_id, event.id, occurence_id)]
                        for space_id, space in suitable_spaces_for_event(
                            event, self.spaces
                        ).items()
                    )
                    <= 1
                )

        # Objective
        model.Maximize(
            sum(
                selected[(space_id, event.id, occurrence_id)] * event.min_duration
                for occurrence_id, occurrence in event.occurrences.items()
                for event in self.allocation_events
                for space_id, space in suitable_spaces_for_event(
                    event, self.spaces
                ).items()
            )
        )

        printer = AllocationSolutionPrinter(
            model=model,
            spaces=self.spaces,
            allocation_events=self.allocation_events,
            selected=selected,
        )
        return printer.print_solution()
