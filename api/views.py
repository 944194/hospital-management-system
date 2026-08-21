from django.shortcuts import render

# Create your views here.

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import RegisterSerializer, UserProfileSerializer
from departments.models import Department
from .serializers import DepartmentSerializer

from django.db import transaction
from django.contrib.auth import get_user_model
from doctors.models import DoctorProfile
User = get_user_model()
from .serializers import (
    DoctorSerializer,
    DoctorCreateSerializer,
    DoctorUpdateSerializer,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        return Response(
            {
                'message': 'User registered successfully',
                'user_id': user.id,
                'username': user.username,
                'role': user.role,
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserProfileSerializer(request.user)

    return Response(serializer.data)




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def department_list_create(request):

    if request.method == 'GET':
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)

        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = DepartmentSerializer(data=request.data)

        if serializer.is_valid():
            department = serializer.save()

            return Response(
                DepartmentSerializer(department).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def department_detail(request, pk):

    try:
        department = Department.objects.get(pk=pk)

    except Department.DoesNotExist:
        return Response(
            {'error': 'Department not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = DepartmentSerializer(department)

        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = DepartmentSerializer(
            department,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    elif request.method == 'DELETE':
        department.delete()

        return Response(
            {'message': 'Department deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def doctor_list_create(request):

    if request.method == 'GET':
        doctors = DoctorProfile.objects.select_related(
            'user',
            'department'
        ).all()

        serializer = DoctorSerializer(doctors, many=True)

        return Response(serializer.data)

    elif request.method == 'POST':

        # Only Admin and Receptionist can create doctors
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response(
                {
                    'error': 'You do not have permission to create a doctor.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DoctorCreateSerializer(data=request.data)

        if serializer.is_valid():

            with transaction.atomic():

                data = serializer.validated_data

                username = data.pop('username')
                password = data.pop('password')
                first_name = data.pop('first_name')
                last_name = data.pop('last_name')
                email = data.pop('email', '')
                mobile_number = data.pop('mobile_number', '')

                user = User(
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    mobile_number=mobile_number,
                    role=User.Role.DOCTOR
                )

                user.set_password(password)
                user.save()

                doctor = DoctorProfile.objects.create(
                    user=user,
                    **data
                )

                return Response(
                    DoctorSerializer(doctor).data,
                    status=status.HTTP_201_CREATED
                )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def doctor_detail(request, pk):

    try:
        doctor = DoctorProfile.objects.select_related(
            'user',
            'department'
        ).get(pk=pk)

    except DoctorProfile.DoesNotExist:
        return Response(
            {
                'error': 'Doctor not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # Anyone authenticated can view a doctor
    if request.method == 'GET':
        serializer = DoctorSerializer(doctor)

        return Response(serializer.data)

    # Only Admin and Receptionist can update/delete doctors
    if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
        return Response(
            {
                'error': 'You do not have permission to manage doctors.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # UPDATE DOCTOR
    if request.method == 'PUT':

        serializer = DoctorUpdateSerializer(
            doctor,
            data=request.data
        )

        if serializer.is_valid():

            with transaction.atomic():

                data = serializer.validated_data

                username = data.pop('username', None)
                password = data.pop('password', None)
                first_name = data.pop('first_name', None)
                last_name = data.pop('last_name', None)
                email = data.pop('email', None)
                mobile_number = data.pop('mobile_number', None)

                user = doctor.user

                if username is not None:
                    user.username = username

                if password is not None:
                    user.set_password(password)

                if first_name is not None:
                    user.first_name = first_name

                if last_name is not None:
                    user.last_name = last_name

                if email is not None:
                    user.email = email

                if mobile_number is not None:
                    user.mobile_number = mobile_number

                user.save()

                for field, value in data.items():
                    setattr(doctor, field, value)

                doctor.save()

                return Response(
                    DoctorSerializer(doctor).data
                )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # DELETE DOCTOR
    elif request.method == 'DELETE':

        with transaction.atomic():

            user = doctor.user

            doctor.delete()
            user.delete()

        return Response(
            {
                'message': 'Doctor deleted successfully'
            },
            status=status.HTTP_204_NO_CONTENT
        )