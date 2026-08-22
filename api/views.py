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


from patients.models import PatientProfile
from .serializers import (
    PatientSerializer,
    PatientCreateSerializer,
    PatientUpdateSerializer,
)


from datetime import date

from appointments.models import Appointment

from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentUpdateSerializer,
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
                aadhaar_number = data.pop('aadhaar_number', '')

                user = User(
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    mobile_number=mobile_number,
                    aadhaar_number=aadhaar_number,
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
                aadhaar_number = data.pop('aadhaar_number', None)

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

                if aadhaar_number is not None:
                    user.aadhaar_number = aadhaar_number

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




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def patient_list_create(request):

    # GET - Any authenticated user can view patients
    if request.method == 'GET':

        patients = PatientProfile.objects.select_related(
            'user'
        ).all()

        serializer = PatientSerializer(
            patients,
            many=True
        )

        return Response(serializer.data)

    # POST - Only Admin and Receptionist can create patients
    elif request.method == 'POST':

        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response(
                {
                    'error': 'You do not have permission to create a patient.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PatientCreateSerializer(
            data=request.data
        )

        if serializer.is_valid():

            with transaction.atomic():

                data = serializer.validated_data

                username = data.pop('username')
                password = data.pop('password')
                first_name = data.pop('first_name')
                last_name = data.pop('last_name')
                email = data.pop('email', '')
                mobile_number = data.pop('mobile_number', '')
                aadhaar_number = data.pop('aadhaar_number', '')

                user = User(
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    mobile_number=mobile_number,
                    aadhaar_number=aadhaar_number,
                    role=User.Role.PATIENT
                )

                user.set_password(password)
                user.save()

                patient = PatientProfile.objects.create(
                    user=user,
                    **data
                )

                return Response(
                    PatientSerializer(patient).data,
                    status=status.HTTP_201_CREATED
                )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def patient_detail(request, pk):

    try:
        patient = PatientProfile.objects.select_related(
            'user'
        ).get(pk=pk)

    except PatientProfile.DoesNotExist:
        return Response(
            {
                'error': 'Patient not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # GET
    if request.method == 'GET':

        serializer = PatientSerializer(patient)

        return Response(serializer.data)

    # PUT and DELETE require Admin/Receptionist
    if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
        return Response(
            {
                'error': 'You do not have permission to manage patients.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # PUT
    elif request.method == 'PUT':

        serializer = PatientUpdateSerializer(
            patient,
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
                aadhaar_number = data.pop('aadhaar_number', None)

                user = patient.user

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

                if aadhaar_number is not None:
                    user.aadhaar_number = aadhaar_number

                user.save()

                for field, value in data.items():
                    setattr(patient, field, value)

                patient.save()

                return Response(
                    PatientSerializer(patient).data
                )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # DELETE
    elif request.method == 'DELETE':

        with transaction.atomic():

            user = patient.user

            patient.delete()

            if user:
                user.delete()

        return Response(
            {
                'message': 'Patient deleted successfully.'
            },
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def appointment_list_create(request):

    # GET - authenticated users can view appointments
    if request.method == 'GET':

        appointments = Appointment.objects.select_related(
            'patient__user',
            'doctor__user',
            'doctor__department'
        ).all()

        serializer = AppointmentSerializer(
            appointments,
            many=True
        )

        return Response(serializer.data)

    # POST
    elif request.method == 'POST':

        serializer = AppointmentCreateSerializer(
            data=request.data
        )

        if serializer.is_valid():

            patient = serializer.validated_data['patient']
            doctor = serializer.validated_data['doctor']
            appointment_date = serializer.validated_data[
                'appointment_date'
            ]
            appointment_time = serializer.validated_data[
                'appointment_time'
            ]

            # Patient can only create appointment for themselves
            if request.user.role == User.Role.PATIENT:

                if patient.user_id != request.user.id:
                    return Response(
                        {
                            'error':
                            'You can only create appointments for yourself.'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Only Admin, Receptionist and Patient can create
            elif request.user.role not in [
                User.Role.ADMIN,
                User.Role.RECEPTIONIST
            ]:
                return Response(
                    {
                        'error':
                        'You do not have permission to create appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            # Prevent past appointments
            if appointment_date < date.today():
                return Response(
                    {
                        'error':
                        'Appointment date cannot be in the past.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Prevent double booking
            doctor_booked = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=appointment_date,
                appointment_time=appointment_time
            ).exclude(
                status=Appointment.Status.CANCELLED
            ).exists()

            if doctor_booked:
                return Response(
                    {
                        'error':
                        'Doctor is already booked for this date and time.'
                    },
                    status=status.HTTP_409_CONFLICT
                )

            appointment = serializer.save()

            return Response(
                AppointmentSerializer(appointment).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def appointment_detail(request, pk):

    try:
        appointment = Appointment.objects.select_related(
            'patient__user',
            'doctor__user',
            'doctor__department'
        ).get(pk=pk)

    except Appointment.DoesNotExist:
        return Response(
            {
                'error': 'Appointment not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # GET
    if request.method == 'GET':

        # Admin and Receptionist can view any appointment
        if request.user.role in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:
            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data)

        # Doctor can view only their appointments
        if request.user.role == User.Role.DOCTOR:

            if appointment.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data)

        # Patient can view only their appointments
        if request.user.role == User.Role.PATIENT:

            if appointment.patient.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data)

    # PUT and DELETE permissions
    if request.user.role not in [
        User.Role.ADMIN,
        User.Role.RECEPTIONIST,
        User.Role.DOCTOR,
        User.Role.PATIENT
    ]:
        return Response(
            {
                'error':
                'You do not have permission to manage this appointment.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # PUT
    if request.method == 'PUT':

        # Doctor can update only their appointments
        if request.user.role == User.Role.DOCTOR:

            if appointment.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only update your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # Patient can update only their appointments
        elif request.user.role == User.Role.PATIENT:

            if appointment.patient.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only update your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = AppointmentUpdateSerializer(
            appointment,
            data=request.data
        )

        if serializer.is_valid():

            data = serializer.validated_data

            appointment_date = data.get(
                'appointment_date',
                appointment.appointment_date
            )

            appointment_time = data.get(
                'appointment_time',
                appointment.appointment_time
            )

            doctor = appointment.doctor

            # Prevent double booking during update
            doctor_booked = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=appointment_date,
                appointment_time=appointment_time
            ).exclude(
                pk=appointment.pk
            ).exclude(
                status=Appointment.Status.CANCELLED
            ).exists()

            if doctor_booked:
                return Response(
                    {
                        'error':
                        'Doctor is already booked for this date and time.'
                    },
                    status=status.HTTP_409_CONFLICT
                )

            # Prevent past appointment dates
            if appointment_date < date.today():
                return Response(
                    {
                        'error':
                        'Appointment date cannot be in the past.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            appointment = serializer.save()

            return Response(
                AppointmentSerializer(appointment).data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # DELETE
    elif request.method == 'DELETE':

        # Patient can only cancel their own appointment
        if request.user.role == User.Role.PATIENT:

            if appointment.patient.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only cancel your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            # Instead of physically deleting it,
            # mark it as cancelled.
            appointment.status = Appointment.Status.CANCELLED
            appointment.save(
                update_fields=['status']
            )

            return Response(
                {
                    'message':
                    'Appointment cancelled successfully.'
                },
                status=status.HTTP_200_OK
            )

        # Doctor can delete/cancel only their appointments
        elif request.user.role == User.Role.DOCTOR:

            if appointment.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only cancel your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            appointment.status = Appointment.Status.CANCELLED
            appointment.save(
                update_fields=['status']
            )

            return Response(
                {
                    'message':
                    'Appointment cancelled successfully.'
                },
                status=status.HTTP_200_OK
            )

        # Admin and Receptionist can actually delete
        elif request.user.role in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:

            appointment.delete()

            return Response(
                {
                    'message':
                    'Appointment deleted successfully.'
                },
                status=status.HTTP_204_NO_CONTENT
            )