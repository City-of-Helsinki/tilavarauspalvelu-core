from logging import getLogger

from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from tilavarauspalvelu.celery import app

logger = getLogger(__name__)


@app.task(name="update_origin_hauki_resource_reservable_time_spans")
def update_origin_hauki_resource_reservable_time_spans() -> None:
    logger.info("Updating OriginHaukiResource reservable time spans...")
    HaukiResourceHashUpdater().run()
