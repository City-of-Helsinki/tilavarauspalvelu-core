from .address import AddressAdmin
from .allocated_time_slot import AllocatedTimeSlotAdmin
from .application import ApplicationAdmin
from .application_round import ApplicationRoundAdmin
from .application_section import ApplicationSectionAdmin
from .city import CityAdmin
from .person import PersonAdmin

__all__ = [
    "AddressAdmin",
    "ApplicationAdmin",
    "ApplicationSectionAdmin",
    "ApplicationRoundAdmin",
    "CityAdmin",
    "PersonAdmin",
    "AllocatedTimeSlotAdmin",
]
