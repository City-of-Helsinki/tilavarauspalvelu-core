from __future__ import annotations

from helusers.admin_site import AdminSite as HelusersAdminSite


class TVPAdminSite(HelusersAdminSite):
    # TODO: Organise the apps and models in the admin panel to some better order / grouping
    #  e.g. stuff that almost never changes in some separate group, kausivaraus in one, user stuff in another etc.
    #  get_app_list https://docs.djangoproject.com/en/5.0/ref/contrib/admin/#django.contrib.admin.AdminSite.get_app_list
    pass
