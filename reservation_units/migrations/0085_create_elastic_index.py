from django.conf import settings
from django.db import migrations
from elastic_transport import TransportError
from elasticsearch import BadRequestError
from elasticsearch_django.index import create_index, update_index, delete_index

index = list(settings.SEARCH_SETTINGS["indexes"].keys())[0]

def create_reservation_units_index(*args, **kwargs):
    try:
        create_index(index)
        update_index(index)
    except BadRequestError:
        try:
            delete_index(index)
        except TransportError:
            pass
        else:
            create_index(index)
            update_index(index)


def delete_reservation_units_index(*args, **kwargs):
    try:
        delete_index(index)
    except TransportError:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ("reservation_units", "0084_reservation_unit_image_url_fields"),
    ]

    operations = [migrations.RunPython(create_reservation_units_index, reverse_code=delete_reservation_units_index)]
