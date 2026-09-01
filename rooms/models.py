

# Create your models here.
from django.db import models

from departments.models import Department


class Room(models.Model):

    class RoomType(models.TextChoices):
        GENERAL = 'GENERAL', 'General'
        SEMI_PRIVATE = 'SEMI_PRIVATE', 'Semi Private'
        PRIVATE = 'PRIVATE', 'Private'
        ICU = 'ICU', 'ICU'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'

    room_number = models.CharField(
        max_length=20,
        unique=True
    )

    room_type = models.CharField(
        max_length=20,
        choices=RoomType.choices
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='rooms'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.room_number} - {self.get_room_type_display()}"


class Bed(models.Model):

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        OCCUPIED = 'OCCUPIED', 'Occupied'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'

    room = models.ForeignKey(
        Room,
        on_delete=models.PROTECT,
        related_name='beds'
    )

    bed_number = models.CharField(
        max_length=20
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['room', 'bed_number'],
                name='unique_bed_per_room'
            )
        ]

    def __str__(self):
        return f"{self.room.room_number} - Bed {self.bed_number}"




