[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)


Tilanvarauspalvelu-core
===================
This repository contains core of the new reservation platform for city of Helsinki.

# Installation

## Installation with docker

`docker-compose up`

# Running tests and formatting

Tests are run with pytest. You can just run pytest to run all the test. 

To run static code checks and tests with coverage:

In docker

`docker-compose run dev test`

Locally:

`deploy/entrypoint.sh test`

![Tietokantakuvaus](tilanvarauspalvelu_visualized.png)