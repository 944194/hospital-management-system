from django.db import models

# Create your models here.

from django.conf import settings
from departments.models import Department


class DoctorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profile'
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='doctors'
    )

    specialization = models.CharField(max_length=100)
    qualification = models.CharField(max_length=200)

    license_number = models.CharField(
        max_length=100,
        unique=True
    )

    experience_years = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.specialization}"