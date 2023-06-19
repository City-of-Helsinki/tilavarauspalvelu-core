from django.conf import settings
from elasticsearch_django.index import create_index, delete_index, update_index

from tilavarauspalvelu.celery import app


@app.task(name="Update ReservationUnit Elastic index")
def update_reservation_unit_elastic_index() -> None:
    index = list(settings.SEARCH_SETTINGS["indexes"].keys())[0]
    update_index(index)


@app.task(name="Create ReservationUnit Elastic index")
def create_reservation_unit_elastic_index() -> None:
    index = list(settings.SEARCH_SETTINGS["indexes"].keys())[0]
    create_index(index)


@app.task(name="Delete ReservationUnit Elastic index")
def delete_reservation_unit_elastic_index() -> None:
    index = list(settings.SEARCH_SETTINGS["indexes"].keys())[0]
    delete_index(index)
