from __future__ import annotations

from tilavarauspalvelu.utils.verkkokauppa.exceptions import VerkkokauppaError


class ProductError(VerkkokauppaError):
    pass


class CreateProductError(ProductError):
    pass


class GetProductMappingError(ProductError):
    pass


class ParseProductError(ProductError):
    pass


class ParseAccountingError(ProductError):
    pass


class CreateOrUpdateAccountingError(ProductError):
    pass
