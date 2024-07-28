from helusers.apps import HelusersAdminConfig


class TVPAdminConfig(HelusersAdminConfig):
    default_site = "tvp_admin.admin_site.TVPAdminSite"
