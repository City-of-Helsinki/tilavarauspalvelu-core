from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "Keyword",
    "KeywordCategory",
    "KeywordGroup",
]


class KeywordCategory(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    class Meta:
        db_table = "keyword_category"
        base_manager_name = "objects"

    def __str__(self):
        return f"{self.name}"


class KeywordGroup(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    keyword_category = models.ForeignKey(
        KeywordCategory,
        verbose_name=_("Keyword category"),
        related_name="keyword_groups",
        blank=False,
        null=False,
        on_delete=models.PROTECT,
    )

    class Meta:
        db_table = "keyword_group"
        base_manager_name = "objects"

    def __str__(self):
        return f"{self.name}"


class Keyword(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    keyword_group = models.ForeignKey(
        KeywordGroup,
        verbose_name=_("Keyword group"),
        related_name="keywords",
        blank=False,
        null=False,
        on_delete=models.PROTECT,
    )

    class Meta:
        db_table = "keyword"
        base_manager_name = "objects"

    def __str__(self):
        return f"{self.name}"
