FROM postgres:11

RUN apt-get update && apt-get install --no-install-recommends -y \
        postgis postgresql-11-postgis-2.5 postgresql-11-postgis-2.5-scripts

RUN localedef -i fi_FI -c -f UTF-8 -A /usr/share/locale/locale.alias fi_FI.UTF-8

ENV LANG fi_FI.UTF-8
