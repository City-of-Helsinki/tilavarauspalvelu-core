from dataclasses import dataclass
from typing import List, Optional

from opening_hours.enums import ResourceType


@dataclass(order=True, frozen=True)
class Resource:
    """Represents Resource in hauki"""

    id: int
    name: str
    description: Optional[str]
    address: Optional[str]
    children: List[int]
    parents: List[int]
    organization: str
    origin_id: str
    origin_data_source_name: str
    resource_type: ResourceType = ResourceType.RESERVABLE
