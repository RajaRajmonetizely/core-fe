import uuid
import threading
from django.db import models


class AbstractModel(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, related_name="created_%(class)ss", db_column="created_by",
    )
    updated_by = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, related_name="updated_%(class)ss", db_column="updated_by",
    )
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        from api.user.models import User

        # Check if the request attribute exists on the current thread
        current_thread = threading.current_thread()
        if hasattr(current_thread, 'request'):
            request = current_thread.request
            if request and hasattr(request, 'user') and request.user:
                try:
                    user_email = request.user[0]
                    user = User.objects.get(email=user_email, is_deleted=False)
                except User.DoesNotExist:
                    user = None
                except Exception as e:
                    user = None
                if not self.created_by:
                    self.created_by = user
                self.updated_by = user

        super().save(*args, **kwargs)


class ESignStatus(models.TextChoices):
    Draft: str = 'Draft'
    InApprovalProcess: str = 'In Approval Process'
    Cancelled: str = 'Cancelled'
    Declined: str = 'Declined'
    Activated: str = 'Activated'
    Expired: str = 'Expired'
    Error: str = 'Error'
