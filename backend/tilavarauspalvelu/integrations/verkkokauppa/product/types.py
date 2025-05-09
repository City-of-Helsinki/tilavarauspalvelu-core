from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from tilavarauspalvelu.integrations.verkkokauppa.product.exceptions import ParseAccountingError, ParseProductError


@dataclass(frozen=True)
class CreateProductParams:
    namespace: str
    namespace_entity_id: str
    merchant_id: str

    def to_json(self) -> dict[str, Any]:
        return {
            "namespace": self.namespace,
            "namespaceEntityId": str(self.namespace_entity_id),
            "merchantId": str(self.merchant_id),
        }


@dataclass(frozen=True)
class Product:
    product_id: uuid.UUID
    namespace: str
    namespace_entity_id: str
    merchant_id: uuid.UUID

    @classmethod
    def from_json(cls, json: dict[str, Any]) -> Product:
        try:
            return Product(
                product_id=uuid.UUID(json["productId"]),
                namespace=json["namespace"],
                namespace_entity_id=json["namespaceEntityId"],
                merchant_id=uuid.UUID(json["merchantId"]),
            )
        except (KeyError, ValueError) as e:
            msg = "Could not parse product"
            raise ParseProductError(msg) from e


@dataclass(frozen=True)
class ProductInvoicingParams:
    sales_org: str
    sales_office: str
    material: str
    order_type: str

    def __bool__(self) -> bool:
        return bool(self.sales_org and self.sales_office and self.material and self.order_type)

    def to_json(self) -> dict[str, Any]:
        return {
            "salesOrg": self.sales_org,
            "salesOffice": self.sales_office,
            "material": self.material,
            "orderType": self.order_type,
        }


@dataclass(frozen=True)
class CreateOrUpdateAccountingParams:
    vat_code: str
    internal_order: str
    profit_center: str
    project: str
    operation_area: str
    company_code: str
    main_ledger_account: str
    balance_profit_center: str
    product_invoicing: ProductInvoicingParams

    def to_json(self) -> dict[str, Any]:
        json = {
            "vatCode": self.vat_code,
            "companyCode": self.company_code,
            "mainLedgerAccount": self.main_ledger_account,
            "balanceProfitCenter": self.balance_profit_center,
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

        if self.product_invoicing:
            json["productInvoicing"] = self.product_invoicing.to_json()

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
    balance_profit_center: str

    @classmethod
    def from_json(cls, json: dict[str, Any]) -> Accounting:
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
                balance_profit_center=json["balanceProfitCenter"],
            )
        except (KeyError, ValueError) as e:
            msg = "Could not parse accounting"
            raise ParseAccountingError(msg) from e
