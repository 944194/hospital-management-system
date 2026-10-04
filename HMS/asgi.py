"""
ASGI config for HMS project.
"""

import os

from notifications.middleware import JWTAuthMiddleware
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "HMS.settings")

django_asgi_app = get_asgi_application()

from notifications.routing import websocket_urlpatterns


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(
   	   URLRouter(websocket_urlpatterns)
        ),
    }
)
