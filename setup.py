from setuptools import setup, find_packages
from tilanvarauspalvelu import __version__

setup(
    name="tilavarauspalvelu",
    version=__version__,
    packages=find_packages("."),
    include_package_data=True,
    install_requires=[],
    zip_safe=False,
)
