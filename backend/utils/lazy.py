from __future__ import annotations

import inspect
import re
import sys
from typing import TYPE_CHECKING, Any, NamedTuple

from django.db.models.manager import BaseManager
from django.utils.module_loading import import_string

if TYPE_CHECKING:
    from types import FrameType

    from django.db import models
    from django.db.models import Manager


__all__ = [
    "LazyModelAttribute",
    "LazyModelManager",
]


class LazyModelAttribute:
    """
    Descriptor for accessing an attribute on a Model lazily based on a type hint.
    Should always be used using `LazyModelAttribute.new()`.
    """

    @classmethod
    def new(cls) -> LazyModelAttribute:
        """
        Create a new lazy loaded model attribute for a model.

        Example:

        >>> from typing import TYPE_CHECKING
        >>>
        >>> from django.db import models
        >>>
        >>> if TYPE_CHECKING:
        ...     from .validators import MyModelValidator  # type: ignore
        >>>
        >>> class MyModel(models.Model):
        ...     validators: MyModelValidator = LazyModelAttribute.new()

        Here 'MyModelValidator' is a class that includes validation logic for the model.
        It takes a single argument, which is the model instance begin validated,
        which is the interface required for this descriptor.

        This descriptor is needed because 'MyModelValidator' contains imports from
        other models, so importing it directly to the module might cause cyclical imports.
        That's why it is imported in a 'TYPE_CHECKING' block and only added as a type hint
        for the 'LazyModelAttribute', which can then lazily import the validator when it is first accessed.

        'LazyModelAttribute' differs from properties by also allowing class-level access. Accessing the
        attribute on the class level will return the hinted class itself, which in the validator example will
        allow create validation using classmethods.

        Due to limitations of the Python typing system, the returned type on the class-level will be
        an instance of the typed class, but the actual return value is the hinted class itself.

        This approach is used instead of a more conventional 'decorator-descriptor' approach because
        some type checkers (PyCharm in particular) do not infer types from 'decorator-descriptors'
        correctly (at least when this was written).
        """
        path = _find_attribute_type_hint_path(depth=1)

        # Create a new subclass so that '__import_path__' is unique per lazy-loaded manager.
        class LazyAttribute(cls, __import_path__=path): ...

        return LazyAttribute()

    def __init_subclass__(cls, **kwargs: Any) -> None:
        # '__import_path__' should always be given.
        cls.__import_path__: str = kwargs["__import_path__"]
        """Import path to the type hint."""

        cls.__attribute_class__: type | None = None
        """Type hinted class imported from `__import_path__`."""

    def __get__(self, instance: Any | None, owner: type[Any]) -> Any:
        attribute_class = self.__load_class()
        if instance is None:
            return attribute_class
        return attribute_class(instance)

    def __load_class(self) -> type:
        """Get the lazy-loaded class."""
        cls = type(self)

        # Import the type hint class if it hasn't been imported yet.
        if cls.__attribute_class__ is None:
            cls.__attribute_class__ = import_string(cls.__import_path__)

        return cls.__attribute_class__


class ManagerDeconstructArgs(NamedTuple):
    """Arguments for `BaseManager.deconstruct`."""

    as_manager: bool
    manager_class: str
    qs_class: type[models.QuerySet] | None
    args: tuple[Any, ...]
    kwargs: dict[str, Any]


class LazyModelManager(BaseManager):
    """
    Descriptor for lazily loading a model manager.
    Should always be used using `LazyModelManager.new()`.
    """

    @classmethod
    def new(cls) -> LazyModelManager:
        """
        Create a new lazy loaded model manager for a model.

        Example:

        >>> from typing import TYPE_CHECKING, ClassVar
        >>>
        >>> from django.db import models
        >>>
        >>> if TYPE_CHECKING:
        ...     from .queryset import MyModelManager  # type: ignore
        >>>
        >>> class MyModel(models.Model):
        ...     objects: ClassVar[MyModelManager] = LazyModelManager.new()

        Similarly to `LazyModelAttribute`, this descriptor is needed if 'MyModelManager' (or its queryset)
        contain imports from other models, so that importing it directly to the module might cause cyclical imports.

        Additionally, this class mockey-patches the model's managers, as well as the class attribute for the manager
        after the lazy loading is done, so that the lazy-loaded manager is used directly after it's loaded.
        """
        path = _find_attribute_type_hint_path(depth=1)

        # Create a new subclass so that '__import_path__' is unique per lazy-loaded manager.
        class LazyManager(cls, __import_path__=path): ...

        return LazyManager()

    def __init_subclass__(cls, **kwargs: Any) -> None:
        # '__import_path__' should be given to the initial subclass, but can be omitted if subclassed further.
        # (This is required for django-modeltranslation to work.)
        cls.__import_path__: str = kwargs.get("__import_path__") or cls.__import_path__
        """Import path to the type hint."""

        cls.__manager__: Manager | None = None
        """Type hinted Manager class imported from `__import_path__`."""

    def contribute_to_class(self, cls: type[models.Model], name: str) -> None:
        # Mirror the 'BaseManager.contribute_to_class' method,
        # but use our own '__get__' instead of 'ManagerDescriptor'.
        self.name = self.name or name
        self.model = cls
        setattr(cls, name, self)
        cls._meta.add_manager(self)  # type: ignore[arg-type]

    @property
    def use_in_migrations(self) -> bool:
        manager = self._load_manager()
        return manager.use_in_migrations

    def deconstruct(self) -> ManagerDeconstructArgs:
        # Replace the 'manager_class' argument so the actual manager class is loaded.
        # Skip some of the validation logic in the original method, as we don't need it here.
        return ManagerDeconstructArgs(
            as_manager=False,
            manager_class=self.__import_path__,
            qs_class=None,
            args=self._constructor_args[0],
            kwargs=self._constructor_args[1],
        )

    def __getattr__(self, item: str) -> Any:
        """Called if an attribute is not found in the class."""
        # Manager cannot be loaded until the module containing the model is loaded
        # 'model' exists if 'contribute_to_class' is called after the model is instantiated,
        # although this doesn't guarantee the module is loaded.
        if "model" not in self.__dict__:
            msg = f"{type(self).__name__} has no attribute {item!r}"
            raise AttributeError(msg)

        manager = self._load_manager()

        # If name doesn't exits, this is a call from a related manager.
        # This means we cannot replace the manager in the related model, as we don't know its name.
        # We should still add the model to the manager if missing so that all methods work as expected.
        if self.name is not None:
            self._replace_manager(manager, self.model)
        elif manager.model is None:
            manager.model = self.model

        # Now check if the attribute exists.
        return getattr(manager, item)

    def __get__(self, instance: models.Model | None, model: type[models.Model]) -> Any:
        """Called if accessed from Model class."""
        manager = self._load_manager()
        self._replace_manager(manager, model)
        return getattr(model, self.name)

    def _load_manager(self) -> Manager:
        """Get the lazy-loaded manager."""
        cls = type(self)

        # Import the manager class if it hasn't been imported yet.
        if cls.__manager__ is None:
            manager_class = import_string(cls.__import_path__)
            cls.__manager__ = manager_class()

        return cls.__manager__

    def _replace_manager(self, manager: Manager, model: type[models.Model]) -> None:
        """Replace this lazy manager with the actual manager in the model options manager list."""
        # Managers are immutable (due to 'django-modeltranslation'), so we need to recreate them.
        local_managers = list(model._meta.local_managers)
        model._meta.local_managers = []

        # Only replace this manager with its lazy-loaded version, leave the rest as they are.
        for local_manager in local_managers:
            if self.name == local_manager.name:
                manager.contribute_to_class(model, self.name)
            else:
                model._meta.local_managers.append(local_manager)

        # Make managers immutable again.
        model._meta.local_managers = model._meta.managers  # type: ignore[assignment]

    def __eq__(self, other: object) -> bool:
        manager = self._load_manager()
        return manager == other

    def __hash__(self) -> int:
        manager = self._load_manager()
        return hash(manager)


def _find_attribute_type_hint_path(*, depth: int) -> str:
    """
    Perform some python black magic to find the dotted import path to where a class for an attribute's
    type hint is defined. This can be useful if class for the type hint cannot be imported directly to
    the module the attribute definition is, so its defined inside a 'TYPE_CHECKING' block.
    This function will find that import in the module's code, and determine the import path from it.

    Note that the class attribute and the import should both be defined on a single line for this to work.

    :param depth: How many frames to go back from the caller frame to find the attribute definition.
    """
    frame: FrameType = sys._getframe(depth + 1)  # noqa: SLF001
    source_code = inspect.findsource(frame)[0]
    type_hint = _get_type_hint(frame, source_code)
    module_name = _get_type_hint_module_name(type_hint, frame, source_code)
    return f"{module_name}.{type_hint}"


_WRAPPER_PATTERN = re.compile(r".+\[(?P<type_hint>.+)]$")  # NOSONAR


def _get_type_hint(frame: FrameType, source_code: list[str]) -> str:
    """Get the type hint for the attribute this descriptor defined for."""
    current_line = source_code[frame.f_lineno - 1]
    definition = current_line.split("=", maxsplit=1)[0]
    def_and_type_hint = definition.split(":", maxsplit=1)
    type_hint = def_and_type_hint[1].strip()
    match = _WRAPPER_PATTERN.match(type_hint)
    if match is not None:
        type_hint = match.group("type_hint")
    return type_hint


def _get_type_hint_module_name(type_hint: str, frame: FrameType, source_code: list[str]) -> str:
    """
    Go through the source code for the caller frame to find the line where the type hint
    is imported. Note that the import should be defined on a single line for this to work.
    """
    module_name: str | None = None
    for line in source_code:
        if type_hint in line and "import" in line:
            module_name = line.strip().removeprefix("from").split("import")[0].strip()
            break

    if module_name is None:
        msg = (
            f"Unable to find import path for {type_hint!r}. "
            f"Make sure import for the attribute's type hint is defined on a single line."
        )
        raise RuntimeError(msg)

    # Handle relative imports
    if module_name.startswith("."):
        caller_module: str = frame.f_locals["__module__"]

        # Remove number parts in the caller module equal to the number of relative "dots" in the import
        module_parts = caller_module.split(".")
        for part in module_name.split("."):
            if part:
                break
            module_parts.pop()

        module_name = ".".join(module_parts) + module_name

    return module_name
