from rest_framework.permissions import BasePermission


class IsTenant(BasePermission):
    def has_permission(self, request, view):
        pass


class IsSales(BasePermission):
    def has_permission(self, request, view):
        pass


class IsDealDesk(BasePermission):
    def has_permission(self, request, view):
        pass


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        pass
