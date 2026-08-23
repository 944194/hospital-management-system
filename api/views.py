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

from doctors.models import DoctorProfile, DoctorAvailability
User = get_user_model()
from .serializers import (
    DoctorSerializer,
    DoctorCreateSerializer,
    DoctorUpdateSerializer,
    DoctorAvailabilitySerializer,
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


from medical_records.models import MedicalRecord

from .serializers import (
    MedicalRecordSerializer,
    MedicalRecordCreateSerializer,
    MedicalRecordUpdateSerializer,
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
def doctor_availability_list_create(request):

    # GET
    if request.method == 'GET':

        availabilities = DoctorAvailability.objects.select_related(
            'doctor__user'
        ).all()

        # Doctor → only their own availability
        if request.user.role == User.Role.DOCTOR:
            availabilities = availabilities.filter(
                doctor__user=request.user
            )

        # Admin → all availability
        # Other authenticated users → all availability for now

        serializer = DoctorAvailabilitySerializer(
            availabilities,
            many=True
        )

        return Response(serializer.data)

    # POST
    elif request.method == 'POST':

        # Only Admin and Doctor can create availability
        if request.user.role not in [
            User.Role.ADMIN,
            User.Role.DOCTOR
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to create doctor availability.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()

        # Doctor cannot create availability for another doctor
        if request.user.role == User.Role.DOCTOR:

            try:
                doctor = DoctorProfile.objects.get(
                    user=request.user
                )

            except DoctorProfile.DoesNotExist:
                return Response(
                    {
                        'error': 'Doctor profile not found.'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            data['doctor'] = doctor.id

        serializer = DoctorAvailabilitySerializer(
            data=data
        )

        if serializer.is_valid():

            doctor = serializer.validated_data['doctor']
            day_of_week = serializer.validated_data['day_of_week']
            start_time = serializer.validated_data['start_time']
            end_time = serializer.validated_data['end_time']

            # Validate time range
            if start_time >= end_time:
                return Response(
                    {
                        'error':
                        'Start time must be before end time.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Prevent overlapping availability
            overlapping = DoctorAvailability.objects.filter(
                doctor=doctor,
                day_of_week=day_of_week,
                is_available=True
            ).filter(
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exists()

            if overlapping:
                return Response(
                    {
                        'error':
                        'Doctor already has availability during this time.'
                    },
                    status=status.HTTP_409_CONFLICT
                )

            availability = serializer.save()

            return Response(
                DoctorAvailabilitySerializer(
                    availability
                ).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def doctor_availability_detail(request, pk):

    try:
        availability = DoctorAvailability.objects.select_related(
            'doctor__user'
        ).get(pk=pk)

    except DoctorAvailability.DoesNotExist:
        return Response(
            {
                'error': 'Doctor availability not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # GET
    if request.method == 'GET':

        serializer = DoctorAvailabilitySerializer(
            availability
        )

        return Response(serializer.data)

    # PUT / DELETE permission
    if request.user.role not in [
        User.Role.ADMIN,
        User.Role.DOCTOR
    ]:
        return Response(
            {
                'error':
                'You do not have permission to modify doctor availability.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # Doctor can modify only their own availability
    if request.user.role == User.Role.DOCTOR:

        if availability.doctor.user_id != request.user.id:
            return Response(
                {
                    'error':
                    'You can only modify your own availability.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

    # PUT
    if request.method == 'PUT':

        serializer = DoctorAvailabilitySerializer(
            availability,
            data=request.data
        )

        if serializer.is_valid():

            doctor = serializer.validated_data.get(
                'doctor',
                availability.doctor
            )

            day_of_week = serializer.validated_data.get(
                'day_of_week',
                availability.day_of_week
            )

            start_time = serializer.validated_data.get(
                'start_time',
                availability.start_time
            )

            end_time = serializer.validated_data.get(
                'end_time',
                availability.end_time
            )

            if start_time >= end_time:
                return Response(
                    {
                        'error':
                        'Start time must be before end time.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            overlapping = DoctorAvailability.objects.filter(
                doctor=doctor,
                day_of_week=day_of_week,
                is_available=True,
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exclude(
                pk=availability.pk
            ).exists()

            if overlapping:
                return Response(
                    {
                        'error':
                        'Doctor already has availability during this time.'
                    },
                    status=status.HTTP_409_CONFLICT
                )

            availability = serializer.save()

            return Response(
                DoctorAvailabilitySerializer(
                    availability
                ).data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # DELETE
    elif request.method == 'DELETE':

        availability.delete()

        return Response(
            {
                'message':
                'Doctor availability deleted successfully.'
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

            # --------------------------------
            # Patient ownership
            # --------------------------------

            if request.user.role == User.Role.PATIENT:

                if patient.user_id != request.user.id:

                    return Response(
                        {
                            'error':
                            'You can only create appointments for yourself.'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

            # --------------------------------
            # Role permission
            # --------------------------------

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

            # --------------------------------
            # Prevent past appointments
            # --------------------------------

            if appointment_date < date.today():

                return Response(
                    {
                        'error':
                        'Appointment date cannot be in the past.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # --------------------------------
            # Check doctor availability
            # --------------------------------

            day_of_week = appointment_date.weekday()

            doctor_available = DoctorAvailability.objects.filter(
                doctor=doctor,
                day_of_week=day_of_week,
                is_available=True,
                start_time__lte=appointment_time,
                end_time__gte=appointment_time
            ).exists()

            if not doctor_available:

                return Response(
                    {
                        'error':
                        'Doctor is not available on this date and time.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # --------------------------------
            # Prevent double booking
            # --------------------------------

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

            # --------------------------------
            # Create appointment
            # --------------------------------

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




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def medical_record_list_create(request):

    # GET
    if request.method == 'GET':

        records = MedicalRecord.objects.select_related(
            'patient__user',
            'doctor__user',
            'appointment'
        ).all()

        # Doctor → only their records
        if request.user.role == User.Role.DOCTOR:
            records = records.filter(
                doctor__user=request.user
            )

        # Patient → only their own records
        elif request.user.role == User.Role.PATIENT:
            records = records.filter(
                patient__user=request.user
            )

        # Admin → all records
        # Receptionist → all records for now

        serializer = MedicalRecordSerializer(
            records,
            many=True
        )

        return Response(serializer.data)

    # POST
    elif request.method == 'POST':

        # Only Doctor and Admin can create medical records
        if request.user.role not in [
            User.Role.DOCTOR,
            User.Role.ADMIN
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to create medical records.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = MedicalRecordCreateSerializer(
            data=request.data
        )

        if serializer.is_valid():

            appointment = serializer.validated_data['appointment']

            # Doctor can only create a record for their own appointment
            if request.user.role == User.Role.DOCTOR:

                if appointment.doctor.user_id != request.user.id:
                    return Response(
                        {
                            'error':
                            'You can only create medical records '
                            'for your own appointments.'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Appointment should be completed/confirmed
            if appointment.status not in [
                Appointment.Status.CONFIRMED,
                Appointment.Status.COMPLETED
            ]:
                return Response(
                    {
                        'error':
                        'Medical record can only be created for '
                        'a confirmed or completed appointment.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # One appointment → one medical record
            if MedicalRecord.objects.filter(
                appointment=appointment
            ).exists():
                return Response(
                    {
                        'error':
                        'A medical record already exists for this appointment.'
                    },
                    status=status.HTTP_409_CONFLICT
                )

            # Automatically get patient and doctor
            patient = appointment.patient
            doctor = appointment.doctor

            record = serializer.save(
                patient=patient,
                doctor=doctor
            )

            return Response(
                MedicalRecordSerializer(record).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def medical_record_detail(request, pk):

    try:
        record = MedicalRecord.objects.select_related(
            'patient__user',
            'doctor__user',
            'appointment'
        ).get(pk=pk)

    except MedicalRecord.DoesNotExist:
        return Response(
            {
                'error': 'Medical record not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # -------------------------
    # GET
    # -------------------------
    if request.method == 'GET':

        # Admin can view any record
        if request.user.role == User.Role.ADMIN:
            return Response(
                MedicalRecordSerializer(record).data
            )

        # Doctor can view records of their patients
        if request.user.role == User.Role.DOCTOR:

            if record.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view records of your patients.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            return Response(
                MedicalRecordSerializer(record).data
            )

        # Patient can view only their own record
        if request.user.role == User.Role.PATIENT:

            if record.patient.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view your own medical records.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            return Response(
                MedicalRecordSerializer(record).data
            )

        # Receptionist
        return Response(
            {
                'error':
                'You do not have permission to view medical records.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # -------------------------
    # PUT
    # -------------------------

    # Only Admin and Doctor can update
    if request.user.role not in [
        User.Role.ADMIN,
        User.Role.DOCTOR
    ]:
        return Response(
            {
                'error':
                'You do not have permission to update medical records.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # Doctor can update only their own records
    if request.user.role == User.Role.DOCTOR:

        if record.doctor.user_id != request.user.id:
            return Response(
                {
                    'error':
                    'You can only update records of your patients.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

    serializer = MedicalRecordUpdateSerializer(
        record,
        data=request.data
    )

    if serializer.is_valid():

        record = serializer.save()

        return Response(
            MedicalRecordSerializer(record).data
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )