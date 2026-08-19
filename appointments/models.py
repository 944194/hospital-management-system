from django.db import models

# Create your models here.

from patients.models import PatientProfile
from doctors.models import DoctorProfile


class Appointment(models.Model):

    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        NO_SHOW = 'NO_SHOW', 'No Show'

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.PROTECT,
        related_name='appointments'
    )

    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.PROTECT,
        related_name='appointments'
    )

    appointment_date = models.DateField()

    appointment_time = models.TimeField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED
    )

    reason = models.TextField(
        blank=True
    )

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.patient.patient_id} - "
            f"{self.doctor.user.get_full_name()} - "
            f"{self.appointment_date} "
            f"{self.appointment_time}"
        )