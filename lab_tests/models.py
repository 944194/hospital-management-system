from django.db import models

# Create your models here.

from patients.models import PatientProfile
from doctors.models import DoctorProfile
from medical_records.models import MedicalRecord


class LabTest(models.Model):

    class Status(models.TextChoices):
        REQUESTED = 'REQUESTED', 'Requested'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.PROTECT,
        related_name='lab_tests'
    )

    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.PROTECT,
        related_name='lab_tests'
    )

    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.PROTECT,
        related_name='lab_tests'
    )

    test_name = models.CharField(
        max_length=200
    )

    test_type = models.CharField(
        max_length=100
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REQUESTED
    )

    test_date = models.DateField(
        null=True,
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
            f"{self.test_name} - "
            f"{self.patient.patient_id}"
        )




class LabResult(models.Model):

    lab_test = models.OneToOneField(
        LabTest,
        on_delete=models.PROTECT,
        related_name='result'
    )

    result = models.TextField()

    normal_range = models.CharField(
        max_length=200,
        blank=True
    )

    remarks = models.TextField(
        blank=True
    )

    result_date = models.DateField(
        null=True,
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
            f"Result - {self.lab_test.test_name} - "
            f"{self.lab_test.patient.patient_id}"
        )