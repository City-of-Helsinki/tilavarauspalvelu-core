from modeltranslation.decorators import register
from modeltranslation.translator import TranslationOptions

from .models import Service, TermsOfUse
from .models.building.model import Building
from .models.location.model import Location
from .models.real_estate.model import RealEstate
from .models.resource.model import Resource
from .models.service_sector.model import ServiceSector
from .models.space.model import Space
from .models.unit.model import Unit
from .models.unit_group.model import UnitGroup


@register(Service)
class ServiceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(TermsOfUse)
class TermsOfUseTranslationOptions(TranslationOptions):
    fields = ["name", "text"]


@register(Resource)
class ResourceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Space)
class SpaceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(UnitGroup)
class UnitGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Unit)
class UnitTranslationOptions(TranslationOptions):
    fields = ["name", "description", "short_description"]


@register(RealEstate)
class RealEstateTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Building)
class BuildingTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(ServiceSector)
class ServiceSectorTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Location)
class LocationTranslationOptions(TranslationOptions):
    fields = ["address_street", "address_city"]
