from django.conf import settings
from elasticsearch_django.index import create_index, delete_index, update_index

from config.celery import app


@app.task(name="Update ReservationUnit Elastic index")
def update_reservation_unit_elastic_index() -> None:
    index = next(iter(settings.SEARCH_SETTINGS["indexes"].keys()))
    update_index(index)


@app.task(name="Create ReservationUnit Elastic index")
def create_reservation_unit_elastic_index() -> None:
    index = next(iter(settings.SEARCH_SETTINGS["indexes"].keys()))
    create_index(index)


@app.task(name="Delete ReservationUnit Elastic index")
def delete_reservation_unit_elastic_index() -> None:
    index = next(iter(settings.SEARCH_SETTINGS["indexes"].keys()))
    delete_index(index)
