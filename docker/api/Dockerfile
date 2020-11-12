FROM python:3.6

WORKDIR /usr/src/app

ENV APP_NAME tilanvarauspalvelu

RUN apt-get update && apt-get install -y postgresql-client python-pydot python-pydot-ng graphviz

COPY requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN echo 'alias rs="python manage.py runserver 0.0.0.0:8000"' >> ~/.bashrc
