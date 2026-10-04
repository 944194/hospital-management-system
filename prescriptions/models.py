from django.db import models

from medical_records.models import MedicalRecord


class PrescriptionGroup(models.Model):

    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.PROTECT,
        related_name='prescription_groups'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"PRE{self.id:04d} - "
            f"{self.medical_record.patient.patient_id}"
        )


class Prescription(models.Model):

    prescription_group = models.ForeignKey(
        PrescriptionGroup,
        on_delete=models.CASCADE,
        related_name='medicines',
        null=True,
        blank=True
    )

    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.PROTECT,
        related_name='prescriptions'
    )

    medicine_name = models.CharField(
        max_length=200
    )

    dosage = models.CharField(
        max_length=100
    )

    frequency = models.CharField(
        max_length=100
    )

    duration = models.CharField(
        max_length=100
    )

    instructions = models.TextField(
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
            f"{self.medicine_name} - "
            f"{self.medical_record.patient.patient_id}"
        )
