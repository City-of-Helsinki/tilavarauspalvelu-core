import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from tilavarauspalvelu.utils.verkkokauppa.merchants.exceptions import ParseMerchantError, ParseMerchantInfoError


@dataclass(frozen=True)
class MerchantInfo:
    name: str
    street: str
    zip: str
    city: str
    email: str
    phone: str
    url: str
    tos_url: str
    business_id: str
    shop_id: str

    @classmethod
    def from_json(cls, json: dict[str, Any]) -> "MerchantInfo":
        try:
            return MerchantInfo(
                name=json.get("merchantName", ""),
                street=json.get("merchantStreet", ""),
                zip=json.get("merchantZip", ""),
                city=json.get("merchantCity", ""),
                email=json.get("merchantEmail", ""),
                phone=json.get("merchantPhone", ""),
                url=json.get("merchantUrl", ""),
                tos_url=json.get("merchantTermsOfServiceUrl", ""),
                business_id=json.get("merchantBusinessId", ""),
                shop_id=json.get("merchantShopId", ""),
            )
        except (KeyError, ValueError) as err:
            raise ParseMerchantInfoError(f"Could not parse merchant: {err}") from err


@dataclass(frozen=True)
class Merchant:
    id: uuid.UUID
    namespace: str
    created_at: datetime
    updated_at: datetime
    name: str
    street: str
    zip: str
    city: str
    email: str
    phone: str
    url: str
    tos_url: str
    business_id: str
    shop_id: str

    @classmethod
    def from_json(cls, json: dict[str, Any]) -> "Merchant":
        from tilavarauspalvelu.utils.verkkokauppa.helpers import parse_datetime

        try:
            configurations = json["configurations"]
            return Merchant(
                id=uuid.UUID(json["merchantId"]),
                namespace=json["namespace"],
                created_at=parse_datetime(json["createdAt"]),
                updated_at=parse_datetime(json["updatedAt"]),
                name=cls._parse_configuration("merchantName", configurations),
                street=cls._parse_configuration("merchantStreet", configurations),
                zip=cls._parse_configuration("merchantZip", configurations),
                city=cls._parse_configuration("merchantCity", configurations),
                email=cls._parse_configuration("merchantEmail", configurations),
                phone=cls._parse_configuration("merchantPhone", configurations),
                url=cls._parse_configuration("merchantUrl", configurations),
                tos_url=cls._parse_configuration("merchantTermsOfServiceUrl", configurations),
                business_id=cls._parse_configuration("merchantBusinessId", configurations),
                shop_id=cls._parse_configuration("merchantShopId", configurations),
            )
        except (KeyError, ValueError) as err:
            raise ParseMerchantError(f"Could not parse merchant: {err}") from err

    @classmethod
    def _parse_configuration(cls, key: str, configurations: list[dict[str, Any]]) -> str:
        for config in configurations:
            if config["key"] == key:
                return config["value"]
        return ""


@dataclass(init=True, frozen=True)
class UpdateMerchantParams:
    name: str
    street: str
    zip: str
    city: str
    email: str
    phone: str
    url: str
    tos_url: str
    business_id: str
    shop_id: str

    def to_json(self) -> dict[str, Any]:
        return {
            "merchantName": self.name,
            "merchantStreet": self.street,
            "merchantZip": self.zip,
            "merchantCity": self.city,
            "merchantEmail": self.email,
            "merchantPhone": self.phone,
            "merchantUrl": self.url,
            "merchantTermsOfServiceUrl": self.tos_url,
            "merchantBusinessId": self.business_id,
            "merchantShopId": self.shop_id,
        }


@dataclass(init=True, frozen=True)
class CreateMerchantParams(UpdateMerchantParams):
    paytrail_merchant_id: str

    def to_json(self) -> dict[str, Any]:
        json = super().to_json()
        json["merchantPaytrailMerchantId"] = self.paytrail_merchant_id
        return json
