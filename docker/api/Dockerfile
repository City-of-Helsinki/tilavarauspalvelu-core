FROM python:3.8

WORKDIR /usr/src/app

ENV APP_NAME tilanvarauspalvelu

RUN apt-get update && apt-get install -y postgresql-client gdal-bin python-pydot python-pydot-ng graphviz

COPY requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN echo 'alias rs="python manage.py runserver 0:8000"' >> ~/.bashrc
