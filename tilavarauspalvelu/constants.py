from __future__ import annotations

# SRID 4326 - Spatial Reference System Identifier number 4326.
# EPSG:4326 - It's the same thing, but EPSG is the name of the authority maintaining an SRID reference.
# WGS 84 - World Geodetic System from 1984. It's the coordinate system used in GPS.
#
# 4326 is the identifier number (SRID) for WGS 84 in the EPSG reference.
# So in summary SRID 4326 == EPSG:4326 == WGS 84 == "GPS coordinates".
#
# The coordinates in this coordinate system are numbers in the range of
# -90.0000 to 90.0000 for latitude and -180.0000 to 180.0000 for longitude.
COORDINATE_SYSTEM_ID: int = 4326


# Hash value for when there are never any opening hours
# See https://github.com/City-of-Helsinki/hauki `hours.models.Resource._get_date_periods_as_hash`
NEVER_ANY_OPENING_HOURS_HASH = "d41d8cd98f00b204e9800998ecf8427e"  # md5(b"").hexdigest()
