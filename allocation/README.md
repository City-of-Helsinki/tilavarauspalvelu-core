Allocation
===================
Allocation algorithm. 

# Workflow

Given that there is an application round that has Applications for ApplicationEvents
for the ApplicationRound. Then you can start allocating the application round. 

Allocation starts from allocation_runner#start_allocation which receives AllocationRequest
as an parameter, which defines which application round should be allocated. 

Runner calls AllocationDataBuilder to build data for allocation solver, converting
django models to objects that are used in the algorithm. 

Runner calls AllocationSolver with the built AllocationData, which handles the actual allocation logic 
and returns AllocationResult, which contains proposal for how the applied for 
ApplicationEvents should be allocated in the format of list of AllocatedEvents. 

The list of AllocatedEvents is passed to AllocationResultMapper with converts the AllocatedEvents
to django models. 

## Locks

Allocation is limited so that only one allocation can be ongoing for
each application round at once, so we don't get concurrent modifications.The state of
this lock is determined from existence of AllocationRequests, if there is 
one for the application round without an end date, then the allocation is in process. 

### Known issues

Most errors are currently caught and locks are removed in case of them, but currently
if requests to Hauki fail when requesting opening hours, those are not caught
and it leads to a lock that can be only solved by removing or setting AllocationRequest
end date to non null. 

# Purpose

The goal of allocation is to maximize the capacity used
weighted by application round specific priorities. These priorities
are expressed by ApplicationRoundBaskets. 

Each basket in an application round can have 
various properties, like purposes, age groups etc. This affects which applications
are picked into that basket, for example purpose of the applied event must
match the purposes defined for the basket in order for it to be picked into that basket.

Basket with lowest order number have the highest priority (eq. basket one gets
priority over basket 2). 

# Solving allocation problem

## Technology

We use google OR tools CP-SAT Solver for solving the allocation as an integer
problem. 

## Date handling

Since we solve this as an integer problem, we need to convert date times
to integers. Integer value of the requested date times is calculated as 
minutes from the beginning of the allocation period divided by allocation precision. Allocation precision is currently 15 minutes. 

## Constraints

### Events per schedule

Allocation is constrained so that each requested event only appears once per schedule. 
For example ApplicationEvent says that they request 2 reservations per week, 
either on monday, tuesday or wednesday (ApplicationEventSchedules). This
constraint ensures that the event can not happen twice on monday.

### By space (reservation unit)

This constraint ensures that each event is only assigned to one 
reservation unit, so it won't be split into two. 

### By events per week

This constraint ensures that each applicationevent doesn't exceed requested
events per week. It can get less that requested events per week though, for example
only one when requesting two. 

### By time limits

This constraint ensures that allocated events are withing the requested time frame
(for example mondays between 12-18 for 2 hours) and the reservation unit is
open on those days. 

## Maximising function

Allocation maximizes sum of durations weighted by basket scores. 

### Known issues

Doesn't currently know how to properly take into account min_duration and
max_duration, so it only gives events with min duration. 

Proposed fix POC, need to introduce extra duration variable and maximize
over that instead sum of "performed" ones. 

Close to working solution

https://github.com/City-of-Helsinki/tilavarauspalvelu-core/compare/allocation_fixes