from django.db import models

# Create your models here.

from appointments.models import Appointment


class Bill(models.Model):

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash'
        CARD = 'CARD', 'Card'
        UPI = 'UPI', 'UPI'
        NET_BANKING = 'NET_BANKING', 'Net Banking'
        OTHER = 'OTHER', 'Other'

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.PROTECT,
        related_name='bill'
    )

    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    additional_charges = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        null=True,
        blank=True
    )

    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
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
            f"Bill #{self.id} - "
            f"{self.appointment.patient.patient_id}"
        )