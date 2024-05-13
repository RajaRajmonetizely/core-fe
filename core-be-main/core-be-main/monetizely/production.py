import os
from api.utils.aws_utils.secrets import AwsSecret

from .settings import *  # noqa

DEBUG = False

db_cred = AwsSecret.get(env.str("DB_SECRET_NAME"))
aws_cred = AwsSecret.get(env.str("AWS_ACCESS_SECRET"))

DATABASES["default"] = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': db_cred["name"],
    'USER': db_cred["username"],
    'PASSWORD': db_cred["password"],
    'HOST': db_cred["host"],
    'PORT': db_cred["port"]
}
DATABASES["default"]["ATOMIC_REQUESTS"] = True  # noqa F405
DATABASES["default"]["CONN_MAX_AGE"] = env.int("CONN_MAX_AGE", default=60)  # noqa F405

AWS_KEY = aws_cred["AWS_KEY_ID"]
AWS_SECRET = aws_cred["AWS_SECRET_ACCESS_KEY"]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=False)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True)
SECURE_HSTS_PRELOAD = env.bool("DJANGO_SECURE_HSTS_PRELOAD", default=True)
SECURE_CONTENT_TYPE_NOSNIFF = env.bool("DJANGO_SECURE_CONTENT_TYPE_NOSNIFF", default=True)
AWS_QUERYSTRING_AUTH = False
_AWS_EXPIRY = 60 * 60 * 24 * 7
TEMPLATES[-1]["OPTIONS"]["loaders"] = [  # type: ignore[index] # noqa F405
    (
        "django.template.loaders.cached.Loader",
        [
            "django.template.loaders.filesystem.Loader",
            "django.template.loaders.app_directories.Loader",
        ],
    )
]

