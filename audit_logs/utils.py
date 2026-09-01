from audit_logs.models import AuditLog


def create_audit_log(
    user,
    action,
    module,
    description,
    ip_address=None
):
    return AuditLog.objects.create(
        user=user,
        action=action,
        module=module,
        description=description,
        ip_address=ip_address
    )