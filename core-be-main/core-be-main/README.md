## Prerequisites
Python version >= `3.9`
Postgres >= `14.9`

## Installation
1. Python 

windows
https://www.python.org/downloads/

macOS
```commandline
brew install python3
```
Linux
```commandline
sudo apt-get install python3.9
```

2. Postgres

windows
https://www.postgresql.org/download/windows/

macOS
https://www.postgresql.org/download/macosx/

Linux
```commandline
sudo apt install postgresql postgresql-contrib
```

3. Clone Repository from git.
```commandline
git clone git@github.com:Monetizely-Inc/core-be.git
```
4. Set Up Virtual Environment
You can create a virtual environment inside root directory core-be like this,
```
>pip install virtualenv
>python<version> -m venv <virtual-environment-name>
# To activate it
> source <virtual-environment-name>/bin/activate
```

Run the following command to install all the required packages,
```
pip install -r requirements.txt
```

## Project Settings File
Project `settings.py` files are located at `core-be\monetizely` directory & has been decoupled based on the environment like `local.py`, & `production.py` files. This has been done to manage configurations based on different envs & it reduces efforts to change the settings every time we deploy the app on production or staging servers.

 - settings.py : 
    It contains all the common settings which we will use in every env.

 - local.py : It contains all the settings which we will use in running app locally.

 - production.py : 
    It contains all the settings which we will use in production server.


## Project Configurations
The best practice for managing the configuration values like database password, app secret key or third party API keys should be kept `.env` file.


## Database Setup.
Create a database in Postgres with any name e.g `monetizely`. Now set the following key/value pairs in the `.env` file.
```
DATABASE_NAME=monetizely
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_PORT=3306
```
After you have created a database you need to run the migrations to set up the required tables for this database.
To run migrations use the following command
```commandline
python manage.py makemigrations && python manage.py migrate
```
This will set up all the required tables for this project.

To start a local server run the command

```commandline
python manage.py runserver
```

You can access the swagger documentation at

http://127.0.0.1:8000/
