from django.db import transaction

from spaces.models import Space
from tilavarauspalvelu.celery import app


@app.task(name="rebuild_space_tree_hierarchy")
def rebuild_space_tree_hierarchy():
    with transaction.atomic():
        Space.objects.rebuild()
