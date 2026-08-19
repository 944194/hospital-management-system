from django.contrib import admin

# Register your models here.

from .models import DoctorProfile

admin.site.register(DoctorProfile)