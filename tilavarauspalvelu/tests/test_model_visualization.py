from collections import OrderedDict
from json import dumps, loads
from pathlib import Path
from typing import Union

from assertpy import assert_that
from django.core import management
from pytest import mark


@mark.django_db
def test_model_visualization_is_up_to_date(tmp_path):
    # The graph items may be in a different order, so deeply
    # sort the dicts/lists to make sure they are comparable.
    def sort(obj: Union[dict, list]) -> Union[dict, list]:
        if isinstance(obj, dict):
            obj = OrderedDict(sorted(obj.items()))
            for k, v in obj.items():
                if isinstance(v, (dict, list)):
                    obj[k] = sort(v)
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                if isinstance(v, (dict, list)):
                    obj[i] = sort(v)
            obj = sorted(obj, key=lambda x: dumps(x))
        return obj

    root_path = Path(__file__).parent.parent.parent
    filename = "tilavarauspalvelu_visualized.json"
    expected_graph_path = root_path / filename
    actual_graph_path = tmp_path / filename
    management.call_command("graph_models", "--output", actual_graph_path)
    expected = sort(loads(expected_graph_path.read_text())["graphs"])
    actual = sort(loads(actual_graph_path.read_text())["graphs"])
    assert_that(actual).described_as(
        "The data model visualization is not up-to-date."
    ).is_equal_to(expected)
