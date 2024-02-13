import logging
from typing import Any

from django.core.management.base import BaseCommand

from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Update Hauki opening hours hashes for all OriginHaukiResources"

    def handle(self, *args: Any, **options: Any) -> None:
        HaukiResourceHashUpdater().run()
