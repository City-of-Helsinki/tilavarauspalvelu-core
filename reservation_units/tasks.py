from datetime import date
from logging import getLogger

from tilavarauspalvelu.celery import app

from .pricing_updates import update_reservation_unit_pricings

logger = getLogger(__name__)


@app.task(name="update_reservation_unit_pricings")
def _update_reservation_unit_pricings() -> None:
    today = date.today()
    logger.info(f"Updating reservation unit pricing with date {today}")
    num_updated = update_reservation_unit_pricings()
    logger.info(f"Updated {num_updated} reservation units with date {today}")
