
# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        DOCTOR = 'DOCTOR', 'Doctor'
        PATIENT = 'PATIENT', 'Patient'
        RECEPTIONIST = 'RECEPTIONIST', 'Receptionist'

    email = models.EmailField(
        null=True,
        blank=True
    )
    mobile_number = models.CharField(
        max_length=15,
        null=True,
        blank=True
    )
    aadhaar_number = models.CharField(
        max_length=12,
        unique=True,
        null=True,
        blank=True
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username