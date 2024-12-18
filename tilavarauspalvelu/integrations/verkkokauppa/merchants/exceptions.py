from __future__ import annotations

from tilavarauspalvelu.integrations.verkkokauppa.exceptions import VerkkokauppaError


class CreateMerchantError(VerkkokauppaError):
    pass


class UpdateMerchantError(VerkkokauppaError):
    pass


class ParseMerchantInfoError(VerkkokauppaError):
    pass


class ParseMerchantError(VerkkokauppaError):
    pass


class GetMerchantError(VerkkokauppaError):
    pass
