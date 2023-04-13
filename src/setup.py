from setuptools import setup, find_packages

#

setup(
    name='sae204',
    version='0.1',

    install_requires=[
        'Click',
        'colorama',
        'mysql-connector-python',
        'pandas',
    ],
    entry_points={
        'console_scripts': [
            'sae204 = main:cli',
        ],
    },
)