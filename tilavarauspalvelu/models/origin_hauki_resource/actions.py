from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import OriginHaukiResource


class OriginHaukiResourceActions:
    def __init__(self, origin_hauki_resource: "OriginHaukiResource") -> None:
        self.origin_hauki_resource = origin_hauki_resource
