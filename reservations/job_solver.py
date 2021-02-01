import math
from random import randrange

from ortools.sat.python import cp_model

from applications.models import Application


# flake8: noqa
def solve_assignment():
    # Data.
    num_spaces = 5
    max_score = 50
    cost = []
    for i in range(num_spaces):
        foo = []
        for j in range(30):
            foo.append(randrange(100))
        cost.append(foo)

    total_size_max = 240

    num_applications = len(cost[0])
    all_spaces = range(num_spaces)
    all_applications = []
    for i in range(num_applications):
        all_applications.append(
            {
                "id": i,
                "duration": 50 if i % 2 == 0 else 60,
                "score": randrange(1, max_score),
                "start": 0 if i % 2 == 0 else 30,
                "end": 180 if i % 2 == 0 else 240,
            },
        )

    # Model.
    model = cp_model.CpModel()

    starts = []
    ends = []

    # Variables
    selected = [
        [model.NewBoolVar("x[%i,%i]" % (i, j["id"])) for j in all_applications]
        for i in all_spaces
    ]

    # Constraints

    # Each task is assigned to at most one space.
    for j in all_applications:
        model.Add(sum(selected[i][j["id"]] for i in all_spaces) <= 1)

    for space in all_spaces:
        intervals = []
        for application in all_applications:
            duration = application["duration"]
            release_date = application["start"]
            due_date = application["end"]
            print(
                "job %2i: start = %5i, duration = %4i, end = %6i"
                % (application["id"], release_date, duration, due_date)
            )
            name_suffix = "_%i" % application["id"]
            start = model.NewIntVar(release_date, due_date, "s" + name_suffix)
            end = model.NewIntVar(release_date, due_date, "e" + name_suffix)
            performed = selected[space][application["id"]]

            interval = model.NewOptionalIntervalVar(
                start,
                duration,
                end,
                performed,
                "interval_%i_on_s%i" % (application["id"], space),
            )
            starts.append(start)
            ends.append(end)
            intervals.append(interval)

        # No overlapping within space
        model.AddNoOverlap(intervals)

    # No overlap constraint.
    # Total task size for each space is at most total_size_max
    for i in all_spaces:
        model.Add(
            sum(j["duration"] * selected[i][j["id"]] for j in all_applications)
            <= total_size_max
        )

    # Objective
    model.Maximize(
        sum(
            selected[i][j["id"]] * j["duration"] * math.ceil(j["score"])
            for j in all_applications
            for i in all_spaces
        )
    )

    # Solve and output solution.
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL:
        print("Total cost = %i" % solver.ObjectiveValue())
        print()
        for i in all_spaces:
            print()
            for j in all_applications:
                if solver.BooleanValue(selected[i][j["id"]]):
                    print(
                        "Space ",
                        i,
                        " assigned to application event ",
                        j,
                        "  Duration = ",
                        j["duration"],
                        solver.Value(starts[j["id"]]),
                    )

        print()

    print("Statistics")
    print("  - conflicts : %i" % solver.NumConflicts())
    print("  - branches  : %i" % solver.NumBranches())
    print("  - wall time : %f s" % solver.WallTime())


solve_assignment()
