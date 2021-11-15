from dataclasses import dataclass
from typing import Any, Dict
from uuid import UUID

from .exceptions import ParseProductError


@dataclass(frozen=True)
class CreateProductParams:
    namespace: str
    namespace_entity_id: str

    def to_json(self) -> Dict[str, Any]:
        return {
            "namespace": self.namespace,
            "namespaceEntityId": self.namespace_entity_id,
        }


@dataclass(frozen=True)
class Product:
    product_id: UUID
    namespace: str
    namespace_entity_id: str

    @classmethod
    def from_json(cls, json: Dict[str, Any]) -> "Product":
        try:
            return Product(
                product_id=UUID(json["productId"]),
                namespace=json["namespace"],
                namespace_entity_id=json["namespaceEntityId"],
            )
        except (KeyError, ValueError) as e:
            raise ParseProductError("Could not parse product") from e
