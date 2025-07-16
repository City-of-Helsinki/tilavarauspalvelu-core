from __future__ import annotations

from undine import QueryType
from undine.relay import Node

from tilavarauspalvelu.models import AgeGroup

__all__ = [
    "AgeGroupNode",
]


class AgeGroupNode(QueryType[AgeGroup], interfaces=[Node]): ...
