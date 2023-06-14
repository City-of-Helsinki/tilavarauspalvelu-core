from django.conf import settings
from elasticsearch_django.index import update_index

from tilavarauspalvelu.celery import app


@app.task(name="Update ReservationUnit Elastic index")
def update_reservation_unit_elastic_index() -> None:
    index = list(settings.SEARCH_SETTINGS["indexes"].keys())[0]
    update_index(index)
