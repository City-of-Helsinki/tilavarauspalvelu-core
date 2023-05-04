from dataclasses import dataclass
from typing import Any, Dict
from uuid import UUID

from .exceptions import ParseAccountingError, ParseProductError


@dataclass(frozen=True)
class CreateProductParams:
    namespace: str
    namespace_entity_id: str
    merchant_id: str

    def to_json(self) -> Dict[str, Any]:
        return {
            "namespace": self.namespace,
            "namespaceEntityId": str(self.namespace_entity_id),
            "merchantId": str(self.merchant_id),
        }


@dataclass(frozen=True)
class Product:
    product_id: UUID
    namespace: str
    namespace_entity_id: str
    merchant_id: UUID

    @classmethod
    def from_json(cls, json: Dict[str, Any]) -> "Product":
        try:
            return Product(
                product_id=UUID(json["productId"]),
                namespace=json["namespace"],
                namespace_entity_id=json["namespaceEntityId"],
                merchant_id=UUID(json["merchantId"]),
            )
        except (KeyError, ValueError) as e:
            raise ParseProductError("Could not parse product") from e


@dataclass(frozen=True)
class CreateOrUpdateAccountingParams:
    vat_code: str
    internal_order: str
    profit_center: str
    project: str
    operation_area: str
    company_code: str
    main_ledger_account: str

    def to_json(self) -> Dict[str, Any]:
        # balanceProfitCenter was added to web shop as a required field
        # and that broke the agreed API contract. We don't have the field
        # in our model because we don't need it so value is hard-coded to
        # single whitespace.
        json = {
            "vatCode": self.vat_code,
            "companyCode": self.company_code,
            "mainLedgerAccount": self.main_ledger_account,
            "balanceProfitCenter": " ",
        }

        # Verkkokauppa API does not work if these values are None.
        # Fields can be there only if they have a value
        if self.internal_order:
            json["internalOrder"] = self.internal_order

        if self.profit_center:
            json["profitCenter"] = self.profit_center

        if self.project:
            json["project"] = self.project

        if self.operation_area:
            json["operationArea"] = self.operation_area

        return json


@dataclass(frozen=True)
class Accounting:
    product_id: str
    vat_code: str
    internal_order: str
    profit_center: str
    project: str
    operation_area: str
    company_code: str
    main_ledger_account: str

    @classmethod
    def from_json(cls, json: Dict[str, Any]) -> "Accounting":
        try:
            return Accounting(
                product_id=json["productId"],
                vat_code=json["vatCode"],
                internal_order=json["internalOrder"],
                profit_center=json["profitCenter"],
                project=json["project"],
                operation_area=json["operationArea"],
                company_code=json["companyCode"],
                main_ledger_account=json["mainLedgerAccount"],
            )
        except (KeyError, ValueError) as e:
            raise ParseAccountingError("Could not parse accounting") from e
