import csv
import io

from django.db import connection
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import parsers, status
from rest_framework.generics import GenericAPIView

from api.auth.authentication import CognitoAuthentication
from api.tenant.models import Tenant
from api.user.models import OrgHierarchy
from api.user.models import User
from api.user.serializers import (
    OrgHierarchyCreateSerializer,
    OrgHierarchyUpdateSerializer,
)
from api.user.utils import TrieNode, get_tenant_id_from_email
from api.utils.custom_exception_handler import FileNotFoundException
from api.utils.responses import ResponseBuilder


class OrgHierarchyCreateView(GenericAPIView):
    serializer_class = OrgHierarchyCreateSerializer

    @staticmethod
    def post(request):
        serializer = OrgHierarchyCreateSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return ResponseBuilder.success(
                message="Organization Hierarchy created successfully",
                data=serializer.data,
                status_code=status.HTTP_201_CREATED,
            )

        return ResponseBuilder.errors(
            message="Invalid data in the request",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class OrgHierarchyStructureView(GenericAPIView):
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "include_users",
                openapi.IN_QUERY,
                description="Include Users in hierarchy",
                type=openapi.TYPE_BOOLEAN,
                required=False,
            )
        ]
    )
    def get(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        query = """
        WITH RECURSIVE hierarchical_list AS (
              SELECT id, name, parent_id, 1 AS level
              FROM org_hierarchy WHERE parent_id IS null and tenant_id= %s
              and is_deleted = false
            
              UNION ALL
            
              SELECT t.id, t.name, t.parent_id, hl.level + 1
              FROM org_hierarchy t
              INNER JOIN hierarchical_list hl ON t.parent_id = hl.id
            )
            SELECT id, name, parent_id, level
            FROM hierarchical_list
            ORDER BY level, id;
        """
        include_users = request.query_params.get("include_users")
        cursor = connection.cursor()
        cursor.execute(query, [tenant_id])
        desc = cursor.description
        hierarchy_list = [dict(zip([col[0] for col in desc], row)) for row in cursor.fetchall()]
        if include_users == 'true':
            for hierarchy in hierarchy_list:
                users_list = User.objects.filter(
                    org_hierarchy_id=hierarchy["id"], is_deleted=False)
                hierarchy.update({"users": [{"id": item.id, "name": item.name}
                                            for item in users_list]})
        return ResponseBuilder.success(
            message="success", data=hierarchy_list, status_code=status.HTTP_200_OK
        )

    def build_tree(self, parent_id, tenant_id):
        org_root_node = OrgHierarchy.objects.filter(
            parent_id=parent_id, tenant_id=tenant_id, is_deleted=False
        )

        root = TrieNode(None, "Root")

        for node in org_root_node:
            trie_node = TrieNode(node.id, node.name)
            root.children.append(trie_node)
            self.add_child_nodes(trie_node)

        return root

    def add_child_nodes(self, parent_node):
        child_nodes = OrgHierarchy.objects.filter(parent_id=parent_node.id)

        for node in child_nodes:
            trie_node = TrieNode(node.id, node.name)

            parent_node.children.append(trie_node)

            self.add_child_nodes(trie_node)

    def serialize_tree(self, rootNode):
        if not rootNode.children:
            return []

        root_children_data = []
        for root in rootNode.children:
            serialized_root_data = {
                "id": root.id,
                "name": root.name,
                "children": self.serialize_tree(root),
            }

            root_children_data.append(serialized_root_data)

        return root_children_data


class OrgHierarchyView(GenericAPIView):
    serializer_class = OrgHierarchyUpdateSerializer

    @staticmethod
    def patch(request, id):
        result = OrgHierarchy.objects.get(id=id, is_deleted=False)
        serializer = OrgHierarchyUpdateSerializer(
            result, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return ResponseBuilder.success(data=serializer.data)
        else:
            return ResponseBuilder.errors(data=serializer.errors)

    @staticmethod
    def delete(request, id):
        result = OrgHierarchy.objects.get(id=id, is_deleted=False)
        result.is_deleted = True
        result.save()
        return ResponseBuilder.success(
            message="Organization Hierarchy Deleted Successfully")


class OrgHierarchyFromCSVView(GenericAPIView):
    parser_classes = [parsers.MultiPartParser]
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        operation_description="Upload an Excel file to create OrgHierarchy objects.",
        manual_parameters=[
            openapi.Parameter(
                "file",
                openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description="Excel file containing OrgHierarchy data.",
            )
        ],
    )
    def put(self, request):
        """Create or update OrgHierarchy objects from a CSV file."""
        tenant_id = get_tenant_id_from_email(request.user[0])
        tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
        csv_file = request.FILES.get("file")
        if not csv_file:
            raise FileNotFoundException("No file uploaded.")
        try:
            csv_text = io.TextIOWrapper(csv_file, encoding="utf-8")
            csv_reader = csv.reader(csv_text)
            next(csv_reader)  # Skip the header row

            org_hierarchy_list = []

            for row in csv_reader:
                if not any(
                        row
                ):  # Check if the row is empty or contains only empty values
                    continue  # Skip empty row and move to the next row

                id_value, name, parent_role_id = row[:3]

                existing_org = OrgHierarchy.objects.filter(
                    id_ext_key=id_value, tenant_id=tenant_id, is_deleted=False
                ).first()
                if existing_org:
                    # Use the existing_org
                    org_hierarchy = existing_org
                else:
                    # Create a new org_hierarchy object
                    org_hierarchy = OrgHierarchy()
                    org_hierarchy.id_ext_key = id_value
                    org_hierarchy.tenant_id = tenant
                    org_hierarchy_list.append(org_hierarchy)

                # Set the properties of org_hierarchy object
                org_hierarchy.name = name
                org_hierarchy.parent_role_ext_key = parent_role_id

                org_hierarchy_list.append(org_hierarchy)

            # Map parent_id based on parent_role_ext_key
            org_hierarchy_dict = {org.id_ext_key: org for org in org_hierarchy_list}

            for org_hierarchy in org_hierarchy_list:
                if org_hierarchy.parent_role_ext_key:
                    parent_role_ext_key = org_hierarchy.parent_role_ext_key
                    while parent_role_ext_key:
                        parent_org = org_hierarchy_dict.get(parent_role_ext_key)
                        if parent_org:
                            org_hierarchy.parent_id = parent_org
                            break
                        else:
                            parent_role_ext_key = (
                                parent_org.parent_role_ext_key if parent_org else None
                            )

            # Bulk create or update the OrgHierarchy objects based on id_ext_key
            for org_hierarchy in org_hierarchy_list:
                if org_hierarchy.id_ext_key:
                    existing_org = OrgHierarchy.objects.filter(
                        id_ext_key=org_hierarchy.id_ext_key,
                        tenant_id=tenant_id,
                        is_deleted=False,
                    ).first()
                    if existing_org:
                        if existing_org.name != org_hierarchy.name:
                            existing_org.name = org_hierarchy.name

                        # Update parent-child relationship if parent_role_ext_key has changed
                        if (
                                org_hierarchy.parent_role_ext_key
                                and existing_org.parent_role_ext_key
                                != org_hierarchy.parent_role_ext_key
                        ):
                            parent_org = org_hierarchy_dict.get(
                                org_hierarchy.parent_role_ext_key
                            )
                            if parent_org:
                                existing_org.parent_id = parent_org
                                existing_org.parent_role_ext_key = (
                                    org_hierarchy.parent_role_ext_key
                                )
                            else:
                                existing_org.parent_id = None
                                existing_org.parent_role_ext_key = (
                                    org_hierarchy.parent_role_ext_key
                                )

                        existing_org.save()
                    else:
                        org_hierarchy.save()

            # Mark hierarchies as deleted
            existing_org_ext_keys = [org.id_ext_key for org in org_hierarchy_list]
            OrgHierarchy.objects.filter(tenant_id=tenant_id).exclude(
                id_ext_key__in=existing_org_ext_keys
            ).update(is_deleted=True, id_ext_key=None, parent_role_ext_key=None)

            # Return success response
            return ResponseBuilder.success(status_code=status.HTTP_200_OK)

        except Exception as e:
            return ResponseBuilder.errors(
                message=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
