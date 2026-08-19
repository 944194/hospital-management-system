from django.contrib import admin

# Register your models here.

from .models import PatientProfile

admin.site.register(PatientProfile)