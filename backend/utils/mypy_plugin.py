from __future__ import annotations

import functools
from typing import TYPE_CHECKING

from mypy.checker import TypeChecker
from mypy.errorcodes import ATTR_DEFINED
from mypy.maptype import map_instance_to_supertype
from mypy.nodes import Decorator, FuncBase
from mypy.plugin import Plugin
from mypy.types import AnyType, Instance, TypeOfAny, get_proper_type

if TYPE_CHECKING:
    from collections.abc import Callable

    from mypy.nodes import TypeInfo
    from mypy.plugin import AttributeContext
    from mypy.types import Type

MODEL_MANAGER = "tilavarauspalvelu.models._base.ModelManager"

# Django marks these public queryset methods `queryset_only`, so the manager does not get them.
QUERYSET_ONLY_METHODS = frozenset({"as_manager", "delete", "adelete", "resolve_expression"})


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

    if not is_copied_to_manager(queryset_type.type, name):
        ctx.api.fail(f'"{manager_type.type.name}" has no attribute "{name}"', ctx.context, code=ATTR_DEFINED)
        return AnyType(TypeOfAny.from_error)

    return ctx.api.expr_checker.analyze_external_member_access(name, queryset_type, ctx.context)


def is_copied_to_manager(queryset_info: TypeInfo, name: str) -> bool:
    """
    Check if the manager gets this queryset member, like 'BaseManager._get_queryset_methods' does.

    At runtime, the manager gets only the public plain functions that are not marked `queryset_only`.
    Properties and classmethods are not plain functions. Staticmethods are, so the manager gets them.
    """
    if name.startswith("_") or name in QUERYSET_ONLY_METHODS:
        return False

    method = queryset_info.get_method(name)
    if isinstance(method, Decorator):
        method = method.func
    if not isinstance(method, FuncBase):
        return False
    return not method.is_property and not method.is_class


def plugin(_version: str) -> type[Plugin]:
    return ModelManagerPlugin
