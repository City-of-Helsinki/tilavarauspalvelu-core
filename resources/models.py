from django.db import models

class Resource(models.Model):
    name = models.CharField(verbose_name=_('Name'), max_length=255)
