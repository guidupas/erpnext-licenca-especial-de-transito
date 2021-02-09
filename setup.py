# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in licenca_transito/__init__.py
from licenca_transito import __version__ as version

setup(
	name='licenca_transito',
	version=version,
	description='Emissao de licencas de transito',
	author='Inova Techy',
	author_email='contato@inovatechy.com',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
