from ..exceptions import VerkkokauppaError


class ProductError(VerkkokauppaError):
    pass


class CreateProductError(ProductError):
    pass


class ParseProductError(ProductError):
    pass
