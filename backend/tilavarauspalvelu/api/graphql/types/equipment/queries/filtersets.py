from undine import Filter, FilterSet

from tilavarauspalvelu.models import Equipment


class EquipmentFilterSet(FilterSet[Equipment]):
    pk = Filter(lookup="in")

    rank_gte = Filter("category__rank", lookup="gte")
    rank_lte = Filter("category__rank", lookup="lte")

    name_fi_exact = Filter("name_fi")
    name_sv_exact = Filter("name_sv")
    name_en_exact = Filter("name_en")

    name_fi_contains = Filter("name_fi", lookup="icontains")
    name_sv_contains = Filter("name_sv", lookup="icontains")
    name_en_contains = Filter("name_en", lookup="icontains")

    name_fi_startswith = Filter("name_fi", lookup="istartswith")
    name_sv_startswith = Filter("name_sv", lookup="istartswith")
    name_en_startswith = Filter("name_en", lookup="istartswith")
