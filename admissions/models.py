
# Create your models here.
from django.db import models

from patients.models import PatientProfile
from doctors.models import DoctorProfile
from departments.models import Department


class Admission(models.Model):

    class Status(models.TextChoices):
        ADMITTED = 'ADMITTED', 'Admitted'
        UNDER_TREATMENT = 'UNDER_TREATMENT', 'Under Treatment'
        DISCHARGED = 'DISCHARGED', 'Discharged'
        CANCELLED = 'CANCELLED', 'Cancelled'

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.PROTECT,
        related_name='admissions'
    )

    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.PROTECT,
        related_name='admissions'
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='admissions'
    )

    room = models.ForeignKey(
        'rooms.Room',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='admissions'
    )

    bed = models.ForeignKey(
        'rooms.Bed',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='admissions'
    )

    admission_date = models.DateField()

    discharge_date = models.DateField(
        null=True,
        blank=True
    )

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ADMITTED
    )

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"{self.patient.patient_id} - "
            f"{self.doctor.user.get_full_name()} - "
            f"{self.admission_date}"
        )