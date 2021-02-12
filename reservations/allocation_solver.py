import datetime
import logging
import math
from typing import Dict

from ortools.sat.python import cp_model

from reservations.allocation_models import (
    ALLOCATION_PRECISION,
    AllocationData,
    AllocationEvent,
    AllocationSpace,
)

logger = logging.getLogger(__name__)


def has_room_for_persons(space: AllocationSpace, event: AllocationEvent):
    return (
        space.max_persons is None
        or event.num_persons is None
        or space.max_persons >= event.num_persons
    )


def suitable_spaces_for_event(
    allocation_event: AllocationEvent, spaces: Dict[int, AllocationSpace]
) -> Dict[int, AllocationSpace]:
    suitable_spaces = {}
    for space_id, space in spaces.items():
        if space_id in allocation_event.space_ids and has_room_for_persons(
            space, allocation_event
        ):
            suitable_spaces[space_id] = space
    return suitable_spaces


class AllocatedEvent(object):
    def __init__(
        self,
        space: AllocationSpace,
        event: AllocationEvent,
        duration: int,
        occurrence_id: int,
        start: int,
        end: int,
    ):
        self.space_id = space.id
        self.event_id = event.id
        self.duration = datetime.timedelta(minutes=duration * ALLOCATION_PRECISION)
        self.occurrence_id = occurrence_id
        self.begin = start
        self.end = end


class AllocationSolutionPrinter(object):
    def __init__(
        self,
        model: cp_model.CpModel,
        spaces,
        allocation_events,
        starts,
        ends,
        selected={},
    ):
        self.model = model
        self.selected = selected
        self.spaces = spaces
        self.allocation_events = allocation_events
        self.starts = starts
        self.ends = ends

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
                            start_delta = datetime.timedelta(
                                minutes=solver.Value(self.starts[occurrence_id])
                                * ALLOCATION_PRECISION
                            )
                            end_delta = datetime.timedelta(
                                minutes=solver.Value(self.ends[occurrence_id])
                                * ALLOCATION_PRECISION
                            )
                            solution.append(
                                AllocatedEvent(
                                    space=space,
                                    event=event,
                                    duration=event.min_duration,
                                    occurrence_id=occurrence_id,
                                    start=(datetime.datetime.min + start_delta).time(),
                                    end=(datetime.datetime.min + end_delta).time(),
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
        self.starts = {}
        self.ends = {}

    def solve(self):
        model = cp_model.CpModel()

        selected = {}
        for allocation_event in self.allocation_events:
            for occurrence_id, occurrence in allocation_event.occurrences.items():
                for space_id, space in suitable_spaces_for_event(
                    allocation_event, self.spaces
                ).items():
                    selected[
                        (space.id, allocation_event.id, occurrence_id)
                    ] = model.NewBoolVar("x[%i,%i]" % (space_id, occurrence_id))

        self.constraint_allocation(model=model, selected=selected)

        self.contraint_by_events_per_week(model=model, selected=selected)
        self.constraint_by_capacity(model=model, selected=selected)
        self.constraint_by_event_time_limits(model=model, selected=selected)
        self.maximize(model=model, selected=selected)

        printer = AllocationSolutionPrinter(
            model=model,
            spaces=self.spaces,
            allocation_events=self.allocation_events,
            selected=selected,
            starts=self.starts,
            ends=self.ends,
        )
        return printer.print_solution()

    def constraint_by_event_time_limits(self, model: cp_model.CpModel, selected: Dict):

        for space_id, space in self.spaces.items():
            intervals = []
            for allocation_event in self.allocation_events:
                for occurrence_id, occurrence in allocation_event.occurrences.items():
                    if (space_id, allocation_event.id, occurrence_id) in selected:
                        duration = allocation_event.min_duration
                        min_start = occurrence.begin
                        max_end = occurrence.end
                        name_suffix = "_%i" % occurrence_id
                        start = model.NewIntVar(min_start, max_end, "s" + name_suffix)
                        end = model.NewIntVar(min_start, max_end, "e" + name_suffix)
                        performed = selected[
                            (space_id, allocation_event.id, occurrence_id)
                        ]
                        interval = model.NewOptionalIntervalVar(
                            start,
                            duration,
                            end,
                            performed,
                            "interval_%i_on_s%i" % (occurrence_id, space_id),
                        )
                        self.starts[occurrence_id] = start
                        self.ends[occurrence_id] = end
                        intervals.append(interval)
            model.AddNoOverlap(intervals)

    def constraint_by_capacity(self, model: cp_model.CpModel, selected: Dict):
        # Event durations in each space do not exceed the capacity
        model.Add(
            sum(
                selected[(space_id, event.id, event_occurrence_id)] * event.min_duration
                for event in self.allocation_events
                for event_occurrence_id, occurrence in event.occurrences.items()
                for space_id, space in suitable_spaces_for_event(
                    event, self.spaces
                ).items()
            )
            # TODO: When we have opening times from hauki and/or model structure in place, replace with opening hours
            # Now this is hard coded to each space being open for 10 hours daily
            <= math.ceil(10 * 60 / ALLOCATION_PRECISION)
        )

    def contraint_by_events_per_week(self, model: cp_model.CpModel, selected: Dict):
        # No more than requested events per week is allocated
        for event in self.allocation_events:
            for space_id, space in suitable_spaces_for_event(
                event, self.spaces
            ).items():
                model.Add(
                    sum(
                        selected[(space_id, event.id, occurrence_id)]
                        for occurrence_id, occurrence in event.occurrences.items()
                    )
                    <= event.events_per_week
                )

    def constraint_allocation(self, model: cp_model.CpModel, selected: Dict):
        # Each event is assigned to at most one space.
        for event in self.allocation_events:
            for occurrence_id, occurrence in event.occurrences.items():
                model.Add(
                    sum(
                        selected[(space_id, event.id, occurrence_id)]
                        for space_id, space in suitable_spaces_for_event(
                            event, self.spaces
                        ).items()
                    )
                    <= 1
                )

    # Objective
    def maximize(self, model: cp_model.CpModel, selected: Dict):
        model.Maximize(
            sum(
                selected[(space_id, event.id, event_occurrence_id)] * event.min_duration
                for event in self.allocation_events
                for event_occurrence_id, occurrence in event.occurrences.items()
                for space_id, space in suitable_spaces_for_event(
                    event, self.spaces
                ).items()
            )
        )
