from undine import Order, OrderSet

from tilavarauspalvelu.models import Equipment


class EquipmentOrderSet(OrderSet[Equipment]):
    name = Order()
    name_fi = Order()
    name_en = Order()
    name_sv = Order()
    category_rank = Order("category__rank")
