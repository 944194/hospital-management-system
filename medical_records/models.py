from django.db import models

# Create your models here.

from patients.models import PatientProfile
from doctors.models import DoctorProfile
from appointments.models import Appointment


class MedicalRecord(models.Model):

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.PROTECT,
        related_name='medical_records'
    )

    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.PROTECT,
        related_name='medical_records'
    )

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.PROTECT,
        related_name='medical_record'
    )

    symptoms = models.TextField()

    diagnosis = models.TextField()

    treatment = models.TextField(
        blank=True
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
            f"{self.appointment.appointment_date}"
        )