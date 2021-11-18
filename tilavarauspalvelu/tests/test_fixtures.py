from pathlib import Path

from django.core import management
from pytest import mark


@mark.django_db
def test_fixtures_load_without_errors():
    root_path = Path(__file__).parent.parent.parent
    fixtures_path = root_path / "fixtures" / "cases.json"
    management.call_command("loaddata", fixtures_path)
