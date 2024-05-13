from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from api.package.models import PackageDetail
from api.plan.models import Tier


@receiver(post_save, sender=Tier)
def update_package_details(sender, instance, created, **kwargs):
    if created:
        plan_id = instance.plan_id_id
        tier_id = instance.id
        package_detail_exists = PackageDetail.objects.filter(
            package_id__plan_id=plan_id, is_deleted=False).exists()

        if package_detail_exists:
            package = PackageDetail.objects.filter(
                package_id__plan_id=plan_id, is_deleted=False).first()

            _ = PackageDetail.objects.create(
                package_id=package.package_id,
                tier_id=Tier.objects.get(id=tier_id),
                details={},
                tenant_id=instance.tenant_id,
            )


@receiver(pre_save, sender=Tier)
def delete_package_detail(sender, instance, **kwargs):
    plan_id = instance.plan_id_id
    tier_id = instance.id
    package_detail_exists = PackageDetail.objects.filter(
        package_id__plan_id=plan_id, is_deleted=False).exists()

    if package_detail_exists:
        package_details = PackageDetail.objects.filter(tier_id=tier_id, is_deleted=False).first()
        if package_details:
            package_details.is_deleted = True
            package_details.save()
