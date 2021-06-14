import datetime
import logging
from typing import Dict, Tuple

from ortools.sat.python import cp_model

from allocation.allocation_models import (
    ALLOCATION_PRECISION,
    AllocatedEvent,
    AllocationData,
    AllocationEvent,
    AllocationOccurrence,
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


class AllocationSolutionPrinter(object):
    def __init__(
        self,
        model: cp_model.CpModel,
        spaces,
        starts,
        ends,
        baskets,
        durations,
        performed,
        performed_integers,
        output_basket_ids: [int] = [],
    ):
        self.model = model
        self.performed = performed
        self.spaces = spaces
        self.starts = starts
        self.ends = ends
        self.baskets = baskets
        self.durations = durations
        self.output_basket_ids = output_basket_ids
        self.performed_integers = performed_integers

    def print_solution(self):
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)
        solution = []
        if status == cp_model.OPTIMAL:
            logger.info("Total cost = %i" % solver.ObjectiveValue())

            for basket in self.baskets.values():
                for event in basket.events:
                    for occurrence_id, occurrence in event.occurrences.items():
                        for space_id, space in suitable_spaces_for_event(
                            event, self.spaces
                        ).items():
                            if solver.BooleanValue(
                                self.performed[
                                    (occurrence_id, space_id, event.id, basket.id)
                                ]

                            ) and (
                                len(self.output_basket_ids) == 0
                                or basket.id in self.output_basket_ids
                            ):
                                logger.info(
                                    "Space ",
                                    space.id,
                                    " assigned to application event ",
                                    event.id,
                                    "  Duration = ",
                                    event.min_duration,
                                    "  basket order number = ",
                                    basket.order_number,
                                )
                                start_delta = datetime.timedelta(
                                    minutes=solver.Value(self.starts[(occurrence_id, space_id, basket.id)])
                                    * ALLOCATION_PRECISION
                                )
                                end_delta = datetime.timedelta(
                                    minutes=solver.Value(self.ends[(occurrence_id, space_id, basket.id)])
                                    * ALLOCATION_PRECISION
                                )

                                allocated_duration = solver.Value(self.durations[(occurrence_id, space_id, event.id, basket.id)])

                                solution.append(
                                    AllocatedEvent(
                                        space=space,
                                        event=event,
                                        duration=allocated_duration,
                                        occurrence_id=occurrence_id,
                                        event_id=event.id,
                                        start=(
                                            datetime.datetime.min + start_delta
                                        ).time(),
                                        end=(datetime.datetime.min + end_delta).time(),
                                        basket=basket,
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
        self.baskets = allocation_data.baskets
        self.starts = {}
        self.performed = {}
        self.performed_integers = {}
        self.ends = {}
        self.durations = {}
        self.duration_constraints = {}
        self.output_basket_ids = allocation_data.output_basket_ids

    def solve(self):
        model = cp_model.CpModel()

        selected = {}
        for basket in self.baskets.values():
            for allocation_event in basket.events:
                for occurrence_id, occurrence in allocation_event.occurrences.items():
                    for space_id, space in suitable_spaces_for_event(
                        allocation_event, self.spaces
                    ).items():
                        selected[
                            (space.id, basket.id, allocation_event.id, occurrence_id)
                        ] = model.NewBoolVar(
                            "x[%i,%s,%i]" % (space_id, basket.id, occurrence_id)
                        )

        self.constraint_by_event_time_limits(model=model, selected=selected)
        self.constraint_allocation(model=model, selected=selected)
        self.constraint_to_one_event_per_schedule(model=model, selected=selected)
        self.contraint_by_events_per_week(model=model, selected=selected)
        self.maximize(model=model, selected=selected)

        printer = AllocationSolutionPrinter(
            model=model,
            spaces=self.spaces,
            performed=self.performed,
            performed_integers = self.performed_integers,
            starts=self.starts,
            ends=self.ends,
            baskets=self.baskets,
            durations=self.durations,
            output_basket_ids=self.output_basket_ids,
        )
        return printer.print_solution()

    def determine_minumum_and_maximum_times(
        self, occurrence: AllocationOccurrence, space: AllocationSpace, duration: int
    ) -> Tuple[int, int]:
        min_start = 0
        max_end = 0
        if occurrence.first_date in space.available_times:
            space_time = space.available_times[occurrence.first_date]
            min_start = (
                occurrence.begin
                if occurrence.begin >= space_time.start
                else space_time.start
            )

            max_end = (
                occurrence.end if occurrence.end <= space_time.end else space_time.end
            )
        if min_start + duration > max_end:
            min_start = 0
            max_end = 0
        return min_start, max_end

    def constraint_by_event_time_limits(self, model: cp_model.CpModel, selected: Dict):

        for space_id, space in self.spaces.items():
            intervals = []
            for basket in self.baskets.values():
                for allocation_event in basket.events:
                    for (
                        occurrence_id,
                        occurrence,
                    ) in allocation_event.occurrences.items():
                        perf = model.NewBoolVar(
                            "performedx[%i,%i,%i,%s]" % (occurrence_id, space_id, occurrence_id, basket.id)
                        )


                        self.performed[(occurrence_id, space_id, allocation_event.id, basket.id)] = perf

                        duration = allocation_event.min_duration

                        (
                            min_start,
                            max_end,
                        ) = self.determine_minumum_and_maximum_times(
                            occurrence=occurrence, space=space, duration=duration
                        )
                        name_suffix = "_%i_on_space_id%i_basket%s" % (
                            occurrence_id,
                            space_id,
                            basket.id
                        )

                        start = model.NewIntVar(
                            min_start, max_end, "s" + name_suffix
                        )
                        end = model.NewIntVar(min_start, max_end, "e" + name_suffix)

                        duration_int = model.NewIntVar(

                            allocation_event.min_duration, allocation_event.max_duration, "duration" + name_suffix
                        )

                        performed_as_int = model.NewIntVar(

                            0, 1, "perf_int" + name_suffix
                        )




                        interval = model.NewOptionalIntervalVar(
                            start,
                            duration_int,
                            end,
                            perf,
                            "space_%i_basket_b%s_event%i_occurrence%i"
                            % (
                                space_id,
                                basket.id,
                                allocation_event.id,
                                occurrence_id,
                            ),
                        )


                        self.performed_integers[(occurrence_id, space_id, allocation_event.id, basket.id)] = performed_as_int

                        model.Add(min_start <= end - duration_int).OnlyEnforceIf(
                            perf
                        )
                        model.Add(end <= max_end).OnlyEnforceIf(perf)

                        model.Add(start + duration_int <= max_end).OnlyEnforceIf(
                            perf
                        )

                        model.Add(duration_int ==0).OnlyEnforceIf(
                            perf.Not()
                        )

                        model.Add(min_start <= start).OnlyEnforceIf(perf)
                        model.Add(end == start + duration_int).OnlyEnforceIf(perf)
                        self.durations[(occurrence_id, space_id, allocation_event.id, basket.id)] = duration_int
                        self.starts[(occurrence_id, space_id, basket.id)] = start
                        self.ends[(occurrence_id, space_id, basket.id)] = end
                        intervals.append(interval)

            model.AddNoOverlap(intervals)

    def contraint_by_events_per_week(self, model: cp_model.CpModel, selected: Dict):
        # No more than requested events per week is allocated
        all_events = {}
        for basket in self.baskets.values():
            for event in basket.events:
                if all_events.get(event.id):
                    ev = all_events.get(event.id)
                    ev["baskets"].append(basket.id)
                else:
                    all_events[event.id] = {"event": event, "baskets": [basket.id]}
        for event_id, event_data in all_events.items():
            event = event_data["event"]
            model.Add(
                sum(
                    self.performed[(occurrence_id, space_id, event.id, basket_id)]
                    for basket_id in event_data["baskets"]
                    for occurrence_id, occurrence in event.occurrences.items()
                    for space_id, space in suitable_spaces_for_event(
                        event, self.spaces
                    ).items()
                )
                <= event.events_per_week
            )

    def constraint_allocation(self, model: cp_model.CpModel, selected: Dict):
        # Each event is assigned to at most one space.
        for basket in self.baskets.values():
            for event in basket.events:
                for occurrence_id, occurrence in event.occurrences.items():
                    model.Add(
                        sum(
                            self.performed[(occurrence_id, space_id, event.id, basket.id)]
                            for space_id, space in suitable_spaces_for_event(
                                event, self.spaces
                            ).items()
                        )
                        <= 1
                    )

    def constraint_to_one_event_per_schedule(
        self, model: cp_model.CpModel, selected: Dict
    ):
        all_occurrences = {}
        for basket in self.baskets.values():
            for event in basket.events:
                for occurrence_id, occurrence in event.occurrences.items():
                    if all_occurrences.get(occurrence_id):
                        ev = all_occurrences.get(occurrence_id)
                        ev["baskets"].append(basket.id)
                    else:
                        all_occurrences[occurrence_id] = {
                            "occurrence": occurrence,
                            "baskets": [basket.id],
                            "event": event,
                        }
        for occurrence_id, occurrence_data in all_occurrences.items():
            event = occurrence_data["event"]
            model.Add(
                sum(
                    self.performed[(occurrence_id, space_id, event.id, basket_id)]
                    for basket_id in occurrence_data["baskets"]
                    for space_id, space in suitable_spaces_for_event(
                        event, self.spaces
                    ).items()
                )
                <= 1
            )





    # Objective
    def maximize_old(self, model: cp_model.CpModel, selected: Dict):
        foo = self.durations.values()
        for val in foo:
            print(val)
        model.Maximize(
            sum(

                self.durations.values()

            )
        )

    # Objective
    def maximize(self, model: cp_model.CpModel, selected: Dict):
        for basket in self.baskets.values():
            for event in basket.events:
                for event_occurrence_id, occurrence in event.occurrences.items():
                    for space_id, space in suitable_spaces_for_event(
                        event, self.spaces
                    ).items():
                        print(self.performed[(event_occurrence_id, space_id, event.id, basket.id)])
        model.Maximize(
            sum(
                self.performed[(event_occurrence_id, space_id, event.id, basket.id)]
                #self.durations[(event_occurrence_id, space_id, event.id, basket.id)]
                #* basket.score
                for basket in self.baskets.values()
                for event in basket.events
                for event_occurrence_id, occurrence in event.occurrences.items()
                for space_id, space in suitable_spaces_for_event(
                    event, self.spaces
                ).items()
            )
        )
