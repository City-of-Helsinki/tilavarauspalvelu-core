from __future__ import annotations

import functools
from typing import TYPE_CHECKING

from mypy.checker import TypeChecker
from mypy.errorcodes import ATTR_DEFINED
from mypy.maptype import map_instance_to_supertype
from mypy.plugin import Plugin
from mypy.types import AnyType, Instance, TypeOfAny, get_proper_type

if TYPE_CHECKING:
    from collections.abc import Callable

    from mypy.plugin import AttributeContext
    from mypy.types import Type

MODEL_MANAGER = "tilavarauspalvelu.models._base.ModelManager"


class ModelManagerPlugin(Plugin):
    """
    Type the queryset methods of the model managers.

    At runtime, `ModelManager.__init_subclass__` copies the public queryset methods to the manager.
    The model stub cannot show this, so it gives `ModelManager` a `__getattr__`.
    mypy calls this hook for each name that the manager does not define.
    """

    def get_attribute_hook(self, fullname: str) -> Callable[[AttributeContext], Type] | None:
        class_name, _, attribute_name = fullname.rpartition(".")
        if class_name != MODEL_MANAGER:
            return None
        return functools.partial(queryset_attribute_type, name=attribute_name)


def queryset_attribute_type(ctx: AttributeContext, *, name: str) -> Type:
    manager_type = get_proper_type(ctx.type)
    if not isinstance(manager_type, Instance) or not isinstance(ctx.api, TypeChecker):
        return ctx.default_attr_type

    model_manager_info = next(info for info in manager_type.type.mro if info.fullname == MODEL_MANAGER)
    model_manager_type = map_instance_to_supertype(manager_type, model_manager_info)
    queryset_type = get_proper_type(model_manager_type.args[1])
    if not isinstance(queryset_type, Instance):
        return ctx.default_attr_type

    # The manager gets only the public methods, like 'BaseManager._get_queryset_methods' does.
    if name.startswith("_") or not queryset_type.type.has_readable_member(name):
        ctx.api.fail(f'"{manager_type.type.name}" has no attribute "{name}"', ctx.context, code=ATTR_DEFINED)
        return AnyType(TypeOfAny.from_error)

    return ctx.api.expr_checker.analyze_external_member_access(name, queryset_type, ctx.context)


def plugin(_version: str) -> type[Plugin]:
    return ModelManagerPlugin
