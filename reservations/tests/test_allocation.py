from reservations.allocation_solver import AllocationSolver


def test_some():
    solver = AllocationSolver()
    print(solver)
    solver.solve()
