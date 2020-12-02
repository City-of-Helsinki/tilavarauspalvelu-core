from setuptools import find_packages, setup

from tilanvarauspalvelu import __version__

setup(
    name="tilavarauspalvelu",
    version=__version__,
    packages=find_packages("."),
    include_package_data=True,
    install_requires=[],
    zip_safe=False,
)
