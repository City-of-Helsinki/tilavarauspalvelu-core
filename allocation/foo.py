import collections

# Import Python wrapper for or-tools CP-SAT solver.
from ortools.sat.python import cp_model


def MinimalJobshopSat():
    """Minimal jobshop problem."""
    # Create the model.
    model = cp_model.CpModel()

    jobs_data = [20, 30, 40  # Job2
    ]

    #machines_count = 1 + max(task[0] for job in jobs_data for task in job)
    #all_machines = range(machines_count)

    # Computes horizon dynamically as the sum of all durations.
    horizon = sum(jobs_data)

    # Named tuple to store information about created variables.
    task_type = collections.namedtuple('task_type', 'start end interval')
    # Named tuple to manipulate solution information.
    assigned_task_type = collections.namedtuple('assigned_task_type',
                                                'start job index duration')

    # Creates job intervals and add to the corresponding machine lists.
    all_tasks = {}
    machine_to_intervals = collections.defaultdict(list)

    intervals = []
    for job in jobs_data:
        duration = job
        suffix = '_%i' % (job)
        start_var = model.NewIntVar(0, horizon, 'start' + suffix)
        end_var = model.NewIntVar(0, horizon, 'end' + suffix)
        interval_var = model.NewIntervalVar(start_var, duration, end_var,
                                            'interval' + suffix)

        all_tasks[job] = task_type(start=start_var,
                                   end=end_var,
                                   interval=interval_var)

        intervals.append(interval_var)

    model.AddNoOverlap(intervals)


    # Makespan objective.
    obj_var = model.NewIntVar(0, horizon, 'makespan')

    model.Minimize(obj_var)

    # Solve model.
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL:
        # Create one list of assigned tasks per machine.
        assigned_jobs = collections.defaultdict(list)
        for job in jobs_data:
            val = solver.Value(all_tasks[job])
            print(val)


        # Finally print the solution found.
        print('Optimal Schedule Length: %i' % solver.ObjectiveValue())
        #print(output)


MinimalJobshopSat()
