from django.conf import settings
from django.db import models


class ReceptionistProfile(models.Model):

    receptionist_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        editable=False
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='receptionist_profile'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def save(self, *args, **kwargs):

        # For a new receptionist:
        # First let the database assign the primary key.
        if not self.receptionist_id:

            super().save(*args, **kwargs)

            # Generate Receptionist ID from the database ID.
            self.receptionist_id = f"REC{self.pk:04d}"

            # Save the generated Receptionist ID.
            super().save(
                update_fields=['receptionist_id']
            )

            return

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.receptionist_id} - {self.user.username}"