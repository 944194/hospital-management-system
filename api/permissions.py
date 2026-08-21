from rest_framework.permissions import BasePermission


class IsAdminOrReceptionist(BasePermission):
    """
    Allows access only to ADMIN and RECEPTIONIST users.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ['ADMIN', 'RECEPTIONIST']
        )