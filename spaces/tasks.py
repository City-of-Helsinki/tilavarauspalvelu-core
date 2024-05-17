from django.db.transaction import atomic

from spaces.importers.tprek_unit_importer import TprekUnitImporter
from spaces.models import Space, Unit
from tilavarauspalvelu.celery import app


@app.task(name="rebuild_space_tree_hierarchy")
def rebuild_space_tree_hierarchy() -> None:
    with atomic():
        Space.objects.rebuild()


@app.task(name="update_units_from_tprek")
def update_units_from_tprek() -> None:
    units_to_update = Unit.objects.exclude(tprek_id__isnull=True)
    tprek_unit_importer = TprekUnitImporter()
    tprek_unit_importer.update_unit_from_tprek(units_to_update)
