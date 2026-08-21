from django.urls import path

from .views import (
    register,
    profile,
    department_list_create,
    department_detail,
    doctor_list_create,
    doctor_detail,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [

    # Authentication
    path(
        'auth/register/',
        register,
        name='register'
    ),

    path(
        'auth/login/',
        TokenObtainPairView.as_view(),
        name='login'
    ),

    path(
        'auth/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),

    path(
        'auth/profile/',
        profile,
        name='profile'
    ),

    # Departments
    path(
        'departments/',
        department_list_create,
        name='department_list_create'
    ),

    path(
        'departments/<int:pk>/',
        department_detail,
        name='department_detail'
    ),

    #Doctors
    path(
        'doctors/',
        doctor_list_create,
        name='doctor_list_create'
    ),

    path(
        'doctors/<int:pk>/',
        doctor_detail,
        name='doctor_detail'
    ),
]