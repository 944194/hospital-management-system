from django.shortcuts import render

# Create your views here.

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone


from django.db import transaction, models
from django.contrib.auth import get_user_model
User = get_user_model()


from departments.models import Department
from doctors.models import DoctorProfile, DoctorAvailability
from patients.models import PatientProfile
from datetime import date, datetime, timedelta
from appointments.models import Appointment
from medical_records.models import MedicalRecord
from prescriptions.models import Prescription
from billing.models import Bill
from lab_tests.models import LabTest, LabResult
from admissions.models import Admission
from rooms.models import Room, Bed
from audit_logs.models import AuditLog
from audit_logs.utils import create_audit_log
from receptionists.models import ReceptionistProfile



from .serializers import (
    RegisterSerializer, 
    UserProfileSerializer,
    PatientProfileUpdateSerializer,
    DepartmentSerializer,
    DoctorSerializer,
    DoctorCreateSerializer,
    DoctorUpdateSerializer,
    DoctorAvailabilitySerializer,
    PatientSerializer,
    PatientCreateSerializer,
    PatientUpdateSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentUpdateSerializer,
    MedicalRecordSerializer,
    MedicalRecordCreateSerializer,
    MedicalRecordUpdateSerializer,
    PrescriptionSerializer,
    BillSerializer,
    LabTestSerializer,
    LabResultSerializer,
    AdmissionSerializer,
    RoomSerializer, 
    BedSerializer,
    AuditLogSerializer,
    AdminUserUpdateSerializer,
    ReceptionistSerializer,
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


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def patient_profile_update(request):

    # Only patients can update their own profile
    if request.user.role != User.Role.PATIENT:
        return Response(
            {
                'error':
                'Only patients can update their own profile.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = PatientProfileUpdateSerializer(
        request.user,
        data=request.data,
        partial=(request.method == 'PATCH')
    )

    if serializer.is_valid():
        serializer.save()

        return Response(
            UserProfileSerializer(
                request.user
            ).data,
            status=status.HTTP_200_OK
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def department_list_create(request):

    if request.method == 'GET':
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)

        return Response(serializer.data)

    elif request.method == 'POST':

        if request.user.role != User.Role.ADMIN:
            return Response(
                {'error': 'Only Admin can create departments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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

    if request.method in ['PUT', 'DELETE'] and request.user.role != User.Role.ADMIN:
        return Response(
            {'error': 'Only Admin can manage departments.'},
            status=status.HTTP_403_FORBIDDEN
        )

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


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
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

    # ==========================================
    # GET DOCTOR
    # ==========================================

    if request.method == 'GET':

        serializer = DoctorSerializer(
            doctor
        )

        return Response(
            serializer.data
        )

    # ==========================================
    # ONLY ADMIN / RECEPTIONIST CAN UPDATE/DELETE
    # ==========================================

    if request.user.role not in [
        User.Role.ADMIN,
        User.Role.RECEPTIONIST
    ]:

        return Response(
            {
                'error':
                    'You do not have permission to manage doctors.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # ==========================================
    # UPDATE DOCTOR
    # ==========================================

    if request.method in ['PUT', 'PATCH']:

        serializer = DoctorUpdateSerializer(
            doctor,
            data=request.data,
            partial=(request.method == 'PATCH')
        )

        if serializer.is_valid():

            try:

                with transaction.atomic():

                    # IMPORTANT:
                    # Use serializer.save() here.
                    #
                    # This calls DoctorUpdateSerializer.update()
                    # which updates:
                    # 1. Doctor/User information
                    # 2. Consultation room
                    # 3. Future SCHEDULED/CONFIRMED
                    #    appointment rooms

                    doctor = serializer.save()

                return Response(
                    DoctorSerializer(doctor).data,
                    status=status.HTTP_200_OK
                )

            except Exception as e:

                return Response(
                    {
                        'error': str(e)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # ==========================================
    # DELETE DOCTOR
    # ==========================================

    if request.method == 'DELETE':

        if request.user.role != User.Role.ADMIN:

            return Response(
                {
                    'error':
                        'Only Admin can delete doctors.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():

            user = doctor.user

            doctor.delete()
            user.delete()

        return Response(
            {
                'message':
                    'Doctor deleted successfully'
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
            User.Role.RECEPTIONIST,
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
        User.Role.RECEPTIONIST,
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


        # --------------------------------
        # Admin / Receptionist
        # → Can view all patients
        # --------------------------------

        if request.user.role in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:
            pass

        # --------------------------------
        # Patient
        # → Can view only their own profile
        # --------------------------------

        elif request.user.role == User.Role.PATIENT:

            patients = patients.filter(
                user=request.user
            )

        # --------------------------------
        # Doctor
        # → Can view patients associated
        #   with their appointments
        # --------------------------------

        elif request.user.role == User.Role.DOCTOR:

            patients = patients.filter(
                appointments__doctor__user=request.user
            ).distinct()

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_search(request):

    # Only Admin and Receptionist can search all patients
    if request.user.role not in [
        User.Role.ADMIN,
        User.Role.RECEPTIONIST
    ]:
        return Response(
            {
                'error': 'You do not have permission to search patients.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    search = request.GET.get('search', '').strip()

    if not search:
        return Response(
            {
                'error': 'Search value is required.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    patients = PatientProfile.objects.select_related(
        'user'
    ).filter(
        models.Q(patient_id__icontains=search) |
        models.Q(user__aadhaar_number=search) |
        models.Q(user__first_name__icontains=search) |
        models.Q(user__last_name__icontains=search)
    )

    serializer = PatientSerializer(
        patients,
        many=True
    )

    return Response(serializer.data)


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

    if request.method == 'DELETE' and request.user.role != User.Role.ADMIN:
        return Response(
            {'error': 'Only Admin can delete patients.'},
            status=status.HTTP_403_FORBIDDEN
        )

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
            'doctor__department',
            'appointment_room'
        ).all().order_by(
            '-appointment_date',
            '-appointment_time'
        )


        # --------------------------------
        # Admin / Receptionist
        # → Can view all appointments
        # --------------------------------

        if request.user.role in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:
            pass

        # --------------------------------
        # Doctor
        # → Can view only appointments
        #   assigned to them
        # --------------------------------

        elif request.user.role == User.Role.DOCTOR:

            appointments = appointments.filter(
                doctor__user=request.user
            )

    # --------------------------------
    # Patient
    # → Can view only their appointments
    # --------------------------------

        elif request.user.role == User.Role.PATIENT:

            appointments = appointments.filter(
                patient__user=request.user
            )

        serializer = AppointmentSerializer(
            appointments,
            many=True
        )

        return Response(serializer.data)

    # POST
    elif request.method == 'POST':

        data = request.data.copy()

        # --------------------------------
        # Patient
        # → Automatically use logged-in
        #   patient's PatientProfile
        # --------------------------------

        if request.user.role == User.Role.PATIENT:

            try:
                patient = PatientProfile.objects.get(
                    user=request.user
                )

            except PatientProfile.DoesNotExist:

                return Response(
                    {
                        'error':
                        'Patient profile not found.'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # Never trust patient ID from frontend
            data['patient'] = patient.id

        serializer = AppointmentCreateSerializer(
            data=data
        )

        if serializer.is_valid():

            patient = serializer.validated_data['patient']

            doctor = serializer.validated_data['doctor']

            # --------------------------------
            # Doctor consultation room
            # → Doctor must have an assigned
            #   consultation room
            # --------------------------------

            if doctor.consultation_room is None:

                return Response(
                    {
                        'error':
                            'This doctor does not have a consultation room assigned.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

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
            # Prevent multiple appointments
            # with same doctor on same date
            # --------------------------------

            patient_already_booked = Appointment.objects.filter(
                patient=patient,
                doctor=doctor,
                appointment_date=appointment_date
            ).exclude(
                status=Appointment.Status.CANCELLED
            ).exists()

            if patient_already_booked:

                return Response(
                    {
                        'error':
                            'You already have an active appointment '
                            'with this doctor on this date.'
                    },
                    status=status.HTTP_409_CONFLICT
                )
             

            # --------------------------------
            # Check doctor availability
            # --------------------------------

            # --------------------------------
            # Check 15-minute appointment slot
            # --------------------------------

            # Appointment duration is fixed at 15 minutes
            APPOINTMENT_DURATION = timedelta(minutes=15)

            # Appointment must start on a 15-minute boundary
            if appointment_time.minute % 15 != 0:
                return Response(
                    {
                        'error':
                            'Appointments can only be booked in 15-minute slots.',
                        'available_timings': []
                    },
                    status=status.HTTP_400_BAD_REQUEST
             )

            day_of_week = appointment_date.weekday()

            # Calculate appointment end time
            appointment_start = datetime.combine(
                appointment_date,
                appointment_time
            )

            appointment_end = appointment_start + APPOINTMENT_DURATION

            doctor_available = False

            available_slots = DoctorAvailability.objects.filter(
                doctor=doctor,
                day_of_week=day_of_week,
                is_available=True
            ).order_by('start_time')

            for slot in available_slots:

                slot_start = datetime.combine(
                    appointment_date,
                    slot.start_time
                )

                slot_end = datetime.combine(
                    appointment_date,
                    slot.end_time
                )

    # Entire 15-minute appointment must fit
    # inside doctor's availability
                if (
                    slot_start <= appointment_start
                    and appointment_end <= slot_end
                ):
                    doctor_available = True
                    break

            if not doctor_available:

                available_slots = DoctorAvailability.objects.filter(
                    doctor=doctor,
                    day_of_week=day_of_week,
                    is_available=True
                ).order_by('start_time')

                if available_slots.exists():

                    timings = []

                    for slot in available_slots:
                        timings.append(
                            f"{slot.start_time.strftime('%I:%M %p')} - "
                            f"{slot.end_time.strftime('%I:%M %p')}"
                        )

                    return Response(
                        {
                            'error':
                                'Doctor is not available at the selected date and time.',
                            'available_timings':
                                timings
                        },
                    status=status.HTTP_400_BAD_REQUEST
                    )

                return Response(
                    {
                        'error':
                            'Doctor is not available on the selected day.',
                        'available_timings': []
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

            appointment = serializer.save(
                appointment_room=doctor.consultation_room
            )

            return Response(
                AppointmentSerializer(appointment).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def appointment_available_slots(request):

    doctor_id = request.GET.get('doctor')
    appointment_date = request.GET.get('date')

    # --------------------------------
    # Validate required parameters
    # --------------------------------

    if not doctor_id:
        return Response(
            {
                'error': 'Doctor is required.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not appointment_date:
        return Response(
            {
                'error': 'Date is required.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # Validate doctor
    # --------------------------------

    try:
        doctor = DoctorProfile.objects.get(
            pk=doctor_id
        )

    except DoctorProfile.DoesNotExist:
        return Response(
            {
                'error': 'Doctor not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if doctor.consultation_room is None:
        return Response(
            {
                'available_slots': [],
                'error': 'This doctor does not have a consultation room assigned.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # Validate date
    # --------------------------------

    try:
        selected_date = date.fromisoformat(
            appointment_date
        )

    except ValueError:
        return Response(
            {
                'error': 'Invalid appointment date.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # Prevent past dates
    # --------------------------------

    if selected_date < date.today():
        return Response(
            {
                'error': 'Appointment date cannot be in the past.',
                'available_slots': []
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # Find doctor's availability
    # --------------------------------

    day_of_week = selected_date.weekday()

    availability = DoctorAvailability.objects.filter(
        doctor=doctor,
        day_of_week=day_of_week,
        is_available=True
    ).order_by(
        'start_time'
    )

    if not availability.exists():
        return Response(
            {
                'available_slots': []
            },
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # Get already booked appointments
    # --------------------------------

    booked_appointments = Appointment.objects.filter(
        doctor=doctor,
        appointment_date=selected_date
    ).exclude(
        status=Appointment.Status.CANCELLED
    ).values_list(
        'appointment_time',
        flat=True
    )

    booked_times = set(
        booked_appointments
    )

    # --------------------------------
    # Generate 15-minute slots
    # --------------------------------

    APPOINTMENT_DURATION = timedelta(
        minutes=15
    )

    available_slots = []

    for availability_slot in availability:

        slot_start = datetime.combine(
            selected_date,
            availability_slot.start_time
        )

        slot_end = datetime.combine(
            selected_date,
            availability_slot.end_time
        )

        current_time = slot_start

        while (
            current_time + APPOINTMENT_DURATION
            <= slot_end
        ):

            slot_time = current_time.time()

            # --------------------------------
            # Don't show already booked slots
            # --------------------------------

            if slot_time not in booked_times:

                available_slots.append(
                    {
                        'value': slot_time.strftime(
                            '%H:%M'
                        ),
                        'display': slot_time.strftime(
                            '%I:%M %p'
                        )
                    }
                )

            current_time += APPOINTMENT_DURATION

    # --------------------------------
    # Remove duplicates
    # --------------------------------

    unique_slots = []
    seen_times = set()

    for slot in available_slots:

        if slot['value'] not in seen_times:

            seen_times.add(
                slot['value']
            )

            unique_slots.append(
                slot
            )

    return Response(
        {
            'available_slots': unique_slots
        },
        status=status.HTTP_200_OK
    )
    

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def appointment_detail(request, pk):

    try:
        appointment = Appointment.objects.select_related(
            'patient__user',
            'doctor__user',
            'doctor__department',
            'appointment_room'
        ).get(pk=pk)

    except Appointment.DoesNotExist:
        return Response(
            {
                'error': 'Appointment not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # ==========================================
    # GET APPOINTMENT
    # ==========================================

    if request.method == 'GET':

        # Admin and Receptionist
        if request.user.role in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:

            serializer = AppointmentSerializer(
                appointment
            )

            return Response(
                serializer.data
            )

        # Doctor
        if request.user.role == User.Role.DOCTOR:

            if appointment.doctor.user_id != request.user.id:

                return Response(
                    {
                        'error':
                            'You can only view your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        if request.user.role == 'DOCTOR':
            if appointment.appointment_date > timezone.localdate():
                return Response(
                    {
                        'error': 'Doctors cannot edit future appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = AppointmentSerializer(
                appointment
            )

            return Response(
                serializer.data
            )

        # Patient
        if request.user.role == User.Role.PATIENT:

            if appointment.patient.user_id != request.user.id:

                return Response(
                    {
                        'error':
                            'You can only view your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = AppointmentSerializer(
                appointment
            )

            return Response(
                serializer.data
            )

    # ==========================================
    # CHECK MANAGEMENT PERMISSION
    # ==========================================

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

    # ==========================================
    # UPDATE APPOINTMENT
    # PUT / PATCH
    # ==========================================

    if request.method in ['PUT', 'PATCH']:

        # ------------------------------------------
        # Doctor can update only their appointments
        # ------------------------------------------

        if request.user.role == User.Role.DOCTOR:

            if appointment.doctor.user_id != request.user.id:

                return Response(
                    {
                        'error':
                            'You can only update your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # ------------------------------------------
        # Patient can update only their appointments
        # ------------------------------------------

        elif request.user.role == User.Role.PATIENT:

            if appointment.patient.user_id != request.user.id:

                return Response(
                    {
                        'error':
                            'You can only update your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # ------------------------------------------
        # Serializer
        # ------------------------------------------

        serializer = AppointmentUpdateSerializer(
            appointment,
            data=request.data,
            partial=(request.method == 'PATCH')
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        # ------------------------------------------
        # Get new values
        # ------------------------------------------

        appointment_date = data.get(
            'appointment_date',
            appointment.appointment_date
        )

        appointment_time = data.get(
            'appointment_time',
            appointment.appointment_time
        )

        new_status = data.get(
            'status',
            appointment.status
        )

        current_status = appointment.status

        # ==========================================
        # STATUS TRANSITION VALIDATION
        # ==========================================

        allowed_transitions = {

            Appointment.Status.SCHEDULED: [
                Appointment.Status.SCHEDULED,
                Appointment.Status.CONFIRMED,
                Appointment.Status.CANCELLED,
            ],

            Appointment.Status.CONFIRMED: [
                Appointment.Status.CONFIRMED,
                Appointment.Status.COMPLETED,
                Appointment.Status.CANCELLED,
                Appointment.Status.NO_SHOW,
            ],

            Appointment.Status.COMPLETED: [
                Appointment.Status.COMPLETED,
            ],

            Appointment.Status.CANCELLED: [
                Appointment.Status.CANCELLED,
            ],

            Appointment.Status.NO_SHOW: [
                Appointment.Status.NO_SHOW,
            ],
        }

        if new_status not in allowed_transitions.get(
            current_status,
            []
        ):

            return Response(
                {
                    'error':
                        f'Cannot change appointment status from '
                        f'{current_status} to {new_status}.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # GET DOCTOR
        # ==========================================

        doctor = appointment.doctor

        # ==========================================
        # DOCTOR MUST HAVE CONSULTATION ROOM
        # ==========================================

        if doctor.consultation_room is None:

            return Response(
                {
                    'error':
                        'This doctor does not have a consultation room assigned.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # PREVENT PAST APPOINTMENT DATE
        # ==========================================

        if appointment_date < date.today():

            return Response(
                {
                    'error':
                        'Appointment date cannot be in the past.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # PREVENT DOUBLE BOOKING
        # ==========================================

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

        # ==========================================
        # CHECK WHETHER DATE/TIME CHANGED
        # ==========================================

        date_changed = (
            appointment_date != appointment.appointment_date
        )

        time_changed = (
            appointment_time != appointment.appointment_time
        )

        appointment_schedule_changed = (
            date_changed or time_changed
        )

        # ==========================================
        # SAVE APPOINTMENT
        # ==========================================

        appointment = serializer.save()

        # ==========================================
        # ROOM SNAPSHOT LOGIC
        # ==========================================
        #
        # If date/time changes:
        # use doctor's CURRENT consultation room.
        #
        # If only status/reason/notes changes:
        # keep the appointment's existing room.
        #
        # This preserves the historical room.
        # ==========================================

        if appointment_schedule_changed:

            appointment.appointment_room = (
                doctor.consultation_room
            )

            appointment.save(
                update_fields=[
                    'appointment_room'
                ]
            )

        # ==========================================
        # RETURN UPDATED APPOINTMENT
        # ==========================================

        appointment = Appointment.objects.select_related(
            'patient__user',
            'doctor__user',
            'doctor__department',
            'appointment_room'
        ).get(
            pk=appointment.pk
        )

        return Response(
            AppointmentSerializer(
                appointment
            ).data,
            status=status.HTTP_200_OK
        )

    # ==========================================
    # DELETE / CANCEL APPOINTMENT
    # ==========================================

    if request.method == 'DELETE':

        # ------------------------------------------
        # Patient
        # ------------------------------------------

        if request.user.role == User.Role.PATIENT:

            if appointment.patient.user_id != request.user.id:

                return Response(
                    {
                        'error':
                            'You can only cancel your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if appointment.status in [
                Appointment.Status.COMPLETED,
                Appointment.Status.CANCELLED,
                Appointment.Status.NO_SHOW
            ]:

                return Response(
                    {
                        'error':
                            f'Appointment cannot be cancelled because its '
                            f'current status is {appointment.status}.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            appointment.status = (
                Appointment.Status.CANCELLED
            )

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

        # ------------------------------------------
        # Doctor
        # ------------------------------------------

        elif request.user.role == User.Role.DOCTOR:

            if appointment.doctor.user_id != request.user.id:

                return Response(
                    {
                        'error':
                            'You can only cancel your own appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if appointment.status in [
                Appointment.Status.COMPLETED,
                Appointment.Status.CANCELLED,
                Appointment.Status.NO_SHOW
            ]:

                return Response(
                    {
                        'error':
                            f'Appointment cannot be cancelled because its '
                            f'current status is {appointment.status}.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            appointment.status = (
                Appointment.Status.CANCELLED
            )

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

        # ------------------------------------------
        # Admin / Receptionist
        # ------------------------------------------

        elif request.user.role in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:

            if appointment.status in [
                Appointment.Status.COMPLETED,
                Appointment.Status.CANCELLED,
                Appointment.Status.NO_SHOW
            ]:

                return Response(
                    {
                        'error':
                            f'Appointment cannot be cancelled because its '
                            f'current status is {appointment.status}.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            appointment.status = (
                Appointment.Status.CANCELLED
            )

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

        # Admin → all records
        if request.user.role == User.Role.ADMIN:
            pass

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

        # Receptionist → no access
        elif request.user.role == User.Role.RECEPTIONIST:

            return Response(
                {
                    'error':
                    'You do not have permission to view medical records.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

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




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def prescription_list_create(request):

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        prescriptions = Prescription.objects.select_related(
            'medical_record__patient__user',
            'medical_record__doctor__user',
            'medical_record__appointment'
        ).all()

        # Doctor → only prescriptions related to their records
        if request.user.role == User.Role.DOCTOR:

            prescriptions = prescriptions.filter(
                medical_record__doctor__user=request.user
            )

        # Patient → only their own prescriptions
        elif request.user.role == User.Role.PATIENT:

            prescriptions = prescriptions.filter(
                medical_record__patient__user=request.user
            )

         # Admin → all prescriptions
        elif request.user.role == User.Role.ADMIN:
            pass

        # Receptionist → no access
        elif request.user.role == User.Role.RECEPTIONIST:

            return Response(
                {
                    'error':
                    'You do not have permission to view prescriptions.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PrescriptionSerializer(
            prescriptions,
            many=True
        )

        return Response(serializer.data)

    # --------------------------------
    # POST
    # --------------------------------

    elif request.method == 'POST':

        # Only Doctor and Admin can create prescriptions
        if request.user.role not in [
            User.Role.DOCTOR,
            User.Role.ADMIN
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to create prescriptions.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PrescriptionSerializer(
            data=request.data
        )

        if serializer.is_valid():

            medical_record = serializer.validated_data[
                'medical_record'
            ]

            # --------------------------------
            # Doctor ownership check
            # --------------------------------

            if request.user.role == User.Role.DOCTOR:

                if medical_record.doctor.user_id != request.user.id:

                    return Response(
                        {
                            'error':
                            'You can only create prescriptions '
                            'for your own medical records.'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

            # --------------------------------
            # Create prescription
            # --------------------------------

            prescription = serializer.save()

            return Response(
                PrescriptionSerializer(
                    prescription
                ).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def prescription_detail(request, pk):

    try:
        prescription = Prescription.objects.select_related(
            'medical_record__patient__user',
            'medical_record__doctor__user',
            'medical_record__appointment'
        ).get(pk=pk)

    except Prescription.DoesNotExist:
        return Response(
            {
                'error': 'Prescription not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        # Patient → only their own prescription
        if request.user.role == User.Role.PATIENT:

            if prescription.medical_record.patient.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view your own prescriptions.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # Doctor → only prescriptions from their medical records
        elif request.user.role == User.Role.DOCTOR:

            if prescription.medical_record.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view prescriptions for your own patients.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # Admin → can view everything
        elif request.user.role == User.Role.ADMIN:
            pass

        # Receptionist → no access
        else:
            return Response(
                {
                    'error':
                    'You do not have permission to view prescriptions.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PrescriptionSerializer(
            prescription
        )

        return Response(serializer.data)

    # --------------------------------
    # PUT
    # --------------------------------

    elif request.method == 'PUT':

        # Only Admin and Doctor can update
        if request.user.role not in [
            User.Role.ADMIN,
            User.Role.DOCTOR
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to update prescriptions.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Doctor → only their own medical records
        if request.user.role == User.Role.DOCTOR:

            if prescription.medical_record.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only update prescriptions '
                        'for your own medical records.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = PrescriptionSerializer(
            prescription,
            data=request.data
        )

        if serializer.is_valid():

            prescription = serializer.save()

            return Response(
                PrescriptionSerializer(
                    prescription
                ).data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def bill_list_create(request):

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        bills = Bill.objects.select_related(
            'appointment__patient__user',
            'appointment__doctor__user',
            'appointment__doctor'
        ).all()

        # Patient → only their own bills
        if request.user.role == User.Role.PATIENT:

            bills = bills.filter(
                appointment__patient__user=request.user
            )

        # Doctor → only bills for their appointments
        elif request.user.role == User.Role.DOCTOR:

            bills = bills.filter(
                appointment__doctor__user=request.user
            )

        # Admin / Receptionist → all bills

        serializer = BillSerializer(
            bills,
            many=True
        )

        return Response(serializer.data)

    # --------------------------------
    # POST
    # --------------------------------

    elif request.method == 'POST':

        # Only Admin and Receptionist can create bills
        if request.user.role not in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to create bills.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        appointment_id = request.data.get('appointment')

        if not appointment_id:
            return Response(
                {
                    'error':
                    'Appointment is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            appointment = Appointment.objects.select_related(
                'doctor'
            ).get(
                id=appointment_id
            )

        except Appointment.DoesNotExist:
            return Response(
                {
                    'error':
                    'Appointment not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------
        # Appointment status validation
        # --------------------------------

        if appointment.status not in [
            Appointment.Status.CONFIRMED,
            Appointment.Status.COMPLETED
        ]:
            return Response(
                {
                    'error':
                    'Bill can only be created for confirmed or completed appointments.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Prevent duplicate bill
        # --------------------------------

        if Bill.objects.filter(
            appointment=appointment
        ).exists():

            return Response(
                {
                    'error':
                    'A bill already exists for this appointment.'
                },
                status=status.HTTP_409_CONFLICT
            )

        # --------------------------------
        # Consultation fee
        # --------------------------------

        consultation_fee = appointment.doctor.consultation_fee

        if consultation_fee is None:
            return Response(
                {
                    'error':
                    'Doctor consultation fee is not configured.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Additional charges
        # --------------------------------

        additional_charges = request.data.get(
            'additional_charges',
            0
        )

        try:
            from decimal import Decimal

            additional_charges = Decimal(
                str(additional_charges)
            )

        except Exception:
            return Response(
                {
                    'error':
                    'Additional charges must be a valid number.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if additional_charges < 0:
            return Response(
                {
                    'error':
                    'Additional charges cannot be negative.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Calculate total
        # --------------------------------

        total_amount = (
            consultation_fee +
            additional_charges
        )

        data = {
            'appointment': appointment.id,
            'consultation_fee': consultation_fee,
            'additional_charges': additional_charges,
            'total_amount': total_amount,
            'payment_status': request.data.get(
                'payment_status',
                Bill.PaymentStatus.PENDING
            ),
            'payment_method': request.data.get(
                'payment_method'
            ),
            'paid_amount': request.data.get(
                'paid_amount',
                0
            ),
            'notes': request.data.get(
                'notes',
                ''
            )
        }

        serializer = BillSerializer(
            data=data
        )

        if serializer.is_valid():

            bill = serializer.save(
                consultation_fee=consultation_fee,
                total_amount=total_amount
            )


            create_audit_log(
                user=request.user,
                action=AuditLog.Action.CREATE,
                module='billing',
                description=(
                    f'Created bill #{bill.id} '
                    f'for appointment #{appointment.id}. '
                    f'Total amount: {bill.total_amount}.'
                ),
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response(
                BillSerializer(bill).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )



@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def bill_detail(request, pk):

    try:
        bill = Bill.objects.select_related(
            'appointment__patient__user',
            'appointment__doctor__user',
            'appointment__doctor'
        ).get(
            id=pk
        )

    except Bill.DoesNotExist:
        return Response(
            {
                'error': 'Bill not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        # Patient → only their own bill
        if request.user.role == User.Role.PATIENT:

            if bill.appointment.patient.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view your own bills.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # Doctor → only bills for their appointments
        elif request.user.role == User.Role.DOCTOR:

            if bill.appointment.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view bills for your appointments.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = BillSerializer(bill)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # PUT / PATCH
    # --------------------------------

    if request.method in ['PUT', 'PATCH']:

        # Only Admin and Receptionist can update payment details
        if request.user.role not in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to update bills.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # --------------------------------
        # Protected fields
        # --------------------------------

        protected_fields = [
            'appointment',
            'consultation_fee',
            'total_amount'
        ]

        for field in protected_fields:

            if field in request.data:

                return Response(
                    {
                        'error':
                        f'{field} cannot be changed.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # Validate paid amount
        # --------------------------------

        if 'paid_amount' in request.data:

            try:
                from decimal import Decimal

                paid_amount = Decimal(
                    str(request.data['paid_amount'])
                )

            except Exception:

                return Response(
                    {
                        'error':
                        'Paid amount must be a valid number.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if paid_amount < 0:

                return Response(
                    {
                        'error':
                        'Paid amount cannot be negative.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if paid_amount > bill.total_amount:

                return Response(
                    {
                        'error':
                        'Paid amount cannot exceed the total amount.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # Validate payment status
        # --------------------------------

        payment_status = request.data.get(
            'payment_status',
            bill.payment_status
        )

        if payment_status not in [
            Bill.PaymentStatus.PENDING,
            Bill.PaymentStatus.PARTIALLY_PAID,
            Bill.PaymentStatus.PAID,
            Bill.PaymentStatus.CANCELLED
        ]:

            return Response(
                {
                    'error':
                    'Invalid payment status.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Get paid amount
        # --------------------------------

        from decimal import Decimal

        paid_amount = request.data.get(
            'paid_amount',
            bill.paid_amount
        )

        try:

            paid_amount = Decimal(
                str(paid_amount)
            )

        except Exception:

            return Response(
                {
                    'error':
                    'Paid amount must be a valid number.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # PENDING validation
        # --------------------------------

        if payment_status == Bill.PaymentStatus.PENDING:

            if paid_amount != Decimal('0.00'):

                return Response(
                    {
                        'error':
                        'Paid amount must be 0 when payment status is PENDING.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # PARTIALLY PAID validation
        # --------------------------------

        elif payment_status == Bill.PaymentStatus.PARTIALLY_PAID:

            if paid_amount <= Decimal('0.00'):

                return Response(
                    {
                        'error':
                        'Paid amount must be greater than 0 for PARTIALLY_PAID status.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if paid_amount >= bill.total_amount:

                return Response(
                    {
                        'error':
                        'Paid amount must be less than the total amount for PARTIALLY_PAID status.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not request.data.get(
                'payment_method',
                bill.payment_method
            ):

                return Response(
                    {
                        'error':
                        'Payment method is required when payment status is PARTIALLY_PAID.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # PAID validation
        # --------------------------------

        elif payment_status == Bill.PaymentStatus.PAID:

            if paid_amount != bill.total_amount:

                return Response(
                    {
                        'error':
                        'Paid amount must equal the total amount when payment status is PAID.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not request.data.get(
                'payment_method',
                bill.payment_method
            ):

                return Response(
                    {
                        'error':
                        'Payment method is required when payment status is PAID.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # CANCELLED validation
        # --------------------------------

        elif payment_status == Bill.PaymentStatus.CANCELLED:

            if paid_amount != Decimal('0.00'):

                return Response(
                    {
                        'error':
                        'Paid amount must be 0 when payment status is CANCELLED.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # Update
        # --------------------------------

        serializer = BillSerializer(
            bill,
            data=request.data,
            partial=(request.method == 'PATCH')
        )

        if serializer.is_valid():

            old_payment_status = bill.payment_status
            old_paid_amount = bill.paid_amount
            bill = serializer.save()

            create_audit_log(
                user=request.user,
                action=AuditLog.Action.UPDATE,
                module='billing',
                description=(
                    f'Updated bill #{bill.id} payment status '
                    f'from {old_payment_status} to '
                    f'{bill.payment_status}. '
                    f'Paid amount changed from '
                    f'{old_paid_amount} to {bill.paid_amount}.'
                ),
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response(
                BillSerializer(bill).data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def lab_test_list_create(request):

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        lab_tests = LabTest.objects.select_related(
            'patient__user',
            'doctor__user',
            'medical_record'
        ).all()

        # Patient → only their own lab tests
        if request.user.role == User.Role.PATIENT:

            lab_tests = lab_tests.filter(
                patient__user=request.user
            )

        # Doctor → only tests for their patients
        elif request.user.role == User.Role.DOCTOR:

            lab_tests = lab_tests.filter(
                doctor__user=request.user
            )

        # Admin → all lab tests
        elif request.user.role == User.Role.ADMIN:
            pass

        # Receptionist → no access
        elif request.user.role == User.Role.RECEPTIONIST:
            return Response(
                {
                    'error':
                    'You do not have permission to view lab tests.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = LabTestSerializer(
            lab_tests,
            many=True
        )

        return Response(serializer.data)

    # --------------------------------
    # POST
    # --------------------------------

    elif request.method == 'POST':

        # Only Admin and Doctor can create lab tests
        if request.user.role not in [
            User.Role.ADMIN,
            User.Role.DOCTOR
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to create lab tests.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        medical_record_id = request.data.get(
            'medical_record'
        )

        if not medical_record_id:
            return Response(
                {
                    'error':
                    'Medical record is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Get medical record
        # --------------------------------

        try:
            medical_record = MedicalRecord.objects.select_related(
                'patient',
                'doctor'
            ).get(
                id=medical_record_id
            )

        except MedicalRecord.DoesNotExist:
            return Response(
                {
                    'error':
                    'Medical record not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------
        # Doctor ownership validation
        # --------------------------------

        if request.user.role == User.Role.DOCTOR:

            if medical_record.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only create lab tests for your own patients.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # --------------------------------
        # Get patient and doctor
        # from medical record
        # --------------------------------

        patient = medical_record.patient
        doctor = medical_record.doctor

        # --------------------------------
        # Required fields
        # --------------------------------

        test_name = request.data.get(
            'test_name'
        )

        test_type = request.data.get(
            'test_type'
        )

        if not test_name:
            return Response(
                {
                    'error':
                    'Test name is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not test_type:
            return Response(
                {
                    'error':
                    'Test type is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Create lab test
        # --------------------------------

        data = {
            'patient': patient.id,
            'doctor': doctor.id,
            'medical_record': medical_record.id,
            'test_name': test_name,
            'test_type': test_type,
            'status': LabTest.Status.REQUESTED,
            'test_date': request.data.get(
                'test_date'
            ),
            'notes': request.data.get(
                'notes',
                ''
            )
        }

        serializer = LabTestSerializer(
            data=data
        )

        if serializer.is_valid():

            lab_test = LabTest.objects.create(
                patient=patient,
                doctor=doctor,
                medical_record=medical_record,
                test_name=test_name,
                test_type=test_type,
                status=LabTest.Status.REQUESTED,
                test_date=request.data.get('test_date'),
                notes=request.data.get('notes', '')
            )

            create_audit_log(
                user=request.user,
                action=AuditLog.Action.CREATE,
                module='lab_tests',
                description=(
                    f'Created lab test #{lab_test.id} '
                    f'({lab_test.test_name}) for '
                    f'patient {lab_test.patient.patient_id}.'
                ),
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response(
                LabTestSerializer(lab_test).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )



@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def lab_test_detail(request, pk):

    try:
        lab_test = LabTest.objects.select_related(
            'patient__user',
            'doctor__user',
            'medical_record'
        ).get(
            id=pk
        )

    except LabTest.DoesNotExist:
        return Response(
            {
                'error': 'Lab test not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        # Patient → own tests only
        if request.user.role == User.Role.PATIENT:

            if lab_test.patient.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view your own lab tests.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # Doctor → own tests only
        elif request.user.role == User.Role.DOCTOR:

            if lab_test.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view lab tests for your patients.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif request.user.role == User.Role.RECEPTIONIST:

            return Response(
                {
                    'error':
                    'You do not have permission to view lab tests.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = LabTestSerializer(lab_test)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # PUT / PATCH
    # --------------------------------

    if request.method in ['PUT', 'PATCH']:

        # Only Doctor and Admin can update
        if request.user.role not in [
            User.Role.DOCTOR,
            User.Role.ADMIN
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to update lab tests.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # --------------------------------
        # Doctor ownership
        # --------------------------------

        if request.user.role == User.Role.DOCTOR:

            if lab_test.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only update lab tests for your patients.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # --------------------------------
        # Prevent relationship changes
        # --------------------------------

        protected_fields = [
            'patient',
            'doctor',
            'medical_record'
        ]

        for field in protected_fields:

            if field in request.data:

                return Response(
                    {
                        'error':
                        f'{field} cannot be changed.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # Status validation
        # --------------------------------

        new_status = request.data.get(
            'status',
            lab_test.status
        )

        allowed_statuses = [
            LabTest.Status.REQUESTED,
            LabTest.Status.IN_PROGRESS,
            LabTest.Status.COMPLETED,
            LabTest.Status.CANCELLED
        ]

        if new_status not in allowed_statuses:

            return Response(
                {
                    'error':
                    'Invalid lab test status.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Status transition validation
        # --------------------------------

        current_status = lab_test.status

        valid_transitions = {
            LabTest.Status.REQUESTED: [
                LabTest.Status.IN_PROGRESS,
                LabTest.Status.CANCELLED
            ],

            LabTest.Status.IN_PROGRESS: [
                LabTest.Status.COMPLETED,
                LabTest.Status.CANCELLED
            ],

            LabTest.Status.COMPLETED: [],

            LabTest.Status.CANCELLED: []
        }

        if (
            new_status != current_status
            and
            new_status not in valid_transitions[current_status]
        ):

            return Response(
                {
                    'error':
                    f'Cannot change lab test status from '
                    f'{current_status} to {new_status}.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Update
        # --------------------------------

        serializer = LabTestSerializer(
            lab_test,
            data=request.data,
            partial=(request.method == 'PATCH')
        )

        if serializer.is_valid():   

            old_status = lab_test.status

            lab_test = serializer.save()


            create_audit_log(
                user=request.user,
                action=AuditLog.Action.UPDATE,
                module='lab_tests',
                description=(
                    f'Updated lab test #{lab_test.id} '
                    f'({lab_test.test_name}) from '
                    f'{old_status} to {lab_test.status}.'
                ),
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response(
                LabTestSerializer(lab_test).data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def lab_result_list_create(request):

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        results = LabResult.objects.select_related(
            'lab_test',
            'lab_test__patient__user',
            'lab_test__doctor__user'
        ).all()

        # Patient → only their own results
        if request.user.role == User.Role.PATIENT:

            results = results.filter(
                lab_test__patient__user=request.user
            )

        # Doctor → only results for their patients
        elif request.user.role == User.Role.DOCTOR:

            results = results.filter(
                lab_test__doctor__user=request.user
            )

        # Admin → all results
        elif request.user.role == User.Role.ADMIN:
            pass

        # Receptionist → no access
        elif request.user.role == User.Role.RECEPTIONIST:
            return Response(
                {
                    'error':
                    'You do not have permission to view lab results.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = LabResultSerializer(
            results,
            many=True
        )

        return Response(serializer.data)

    # --------------------------------
    # POST
    # --------------------------------

    elif request.method == 'POST':

        # Only Doctor and Admin can create results
        if request.user.role not in [
            User.Role.DOCTOR,
            User.Role.ADMIN
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to create lab results.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        lab_test_id = request.data.get(
            'lab_test'
        )

        if not lab_test_id:
            return Response(
                {
                    'error':
                    'Lab test is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Get lab test
        # --------------------------------

        try:

            lab_test = LabTest.objects.select_related(
                'patient',
                'doctor'
            ).get(
                id=lab_test_id
            )

        except LabTest.DoesNotExist:

            return Response(
                {
                    'error':
                    'Lab test not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------
        # Lab test must be completed
        # --------------------------------

        if lab_test.status != LabTest.Status.COMPLETED:

            return Response(
                {
                    'error':
                    'Lab result can only be created for a completed lab test.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Doctor ownership
        # --------------------------------

        if request.user.role == User.Role.DOCTOR:

            if lab_test.doctor.user_id != request.user.id:

                return Response(
                    {
                        'error':
                        'You can only create results for your own patients.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # --------------------------------
        # Prevent duplicate result
        # --------------------------------

        if LabResult.objects.filter(
            lab_test=lab_test
        ).exists():

            return Response(
                {
                    'error':
                    'A result already exists for this lab test.'
                },
                status=status.HTTP_409_CONFLICT
            )

        # --------------------------------
        # Create result
        # --------------------------------

        data = {
            'lab_test': lab_test.id,
            'result': request.data.get(
                'result'
            ),
            'normal_range': request.data.get(
                'normal_range',
                ''
            ),
            'remarks': request.data.get(
                'remarks',
                ''
            ),
            'result_date': request.data.get(
                'result_date'
            )
        }

        serializer = LabResultSerializer(
            data=data
        )

        if serializer.is_valid():

            lab_result = LabResult.objects.create(
            lab_test=lab_test,
            result=request.data.get('result'),
            normal_range=request.data.get(
                'normal_range',
                ''
            ),
            remarks=request.data.get(
                'remarks',
                ''
            ),
            result_date=request.data.get(
                'result_date'
            )
        )

            create_audit_log(
                user=request.user,
                action=AuditLog.Action.CREATE,
                module='lab_results',
                description=(
                    f'Created lab result #{lab_result.id} '
                    f'for lab test #{lab_test.id}.'
                ),
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response(
                LabResultSerializer(lab_result).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )



@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def lab_result_detail(request, pk):

    try:
        lab_result = LabResult.objects.select_related(
            'lab_test',
            'lab_test__patient__user',
            'lab_test__doctor__user'
        ).get(
            id=pk
        )

    except LabResult.DoesNotExist:
        return Response(
            {
                'error': 'Lab result not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        # Patient → own result only
        if request.user.role == User.Role.PATIENT:

            if lab_result.lab_test.patient.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view your own lab results.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # Doctor → own patients only
        elif request.user.role == User.Role.DOCTOR:

            if lab_result.lab_test.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view lab results for your patients.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif request.user.role == User.Role.RECEPTIONIST:

            return Response(
                {
                    'error':
                    'You do not have permission to view lab results.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = LabResultSerializer(lab_result)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # PUT / PATCH
    # --------------------------------

    if request.method in ['PUT', 'PATCH']:

        # Only Doctor and Admin can update
        if request.user.role not in [
            User.Role.DOCTOR,
            User.Role.ADMIN
        ]:
            return Response(
                {
                    'error':
                    'You do not have permission to update lab results.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # --------------------------------
        # Doctor ownership
        # --------------------------------

        if request.user.role == User.Role.DOCTOR:

            if lab_result.lab_test.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only update results for your patients.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # --------------------------------
        # Prevent lab test change
        # --------------------------------

        if 'lab_test' in request.data:

            return Response(
                {
                    'error':
                    'Lab test cannot be changed.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Update
        # --------------------------------

        serializer = LabResultSerializer(
            lab_result,
            data=request.data,
            partial=(request.method == 'PATCH')
        )

        if serializer.is_valid():

            lab_result = serializer.save()

            create_audit_log(
                user=request.user,
                action=AuditLog.Action.UPDATE,
                module='lab_results',
                description=(
                    f'Updated lab result #{lab_result.id} '
                    f'for lab test #{lab_result.lab_test.id}.'
                ),
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response(
                LabResultSerializer(lab_result).data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )





@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):

    # --------------------------------
    # Admin only
    # --------------------------------

    if request.user.role != User.Role.ADMIN:

        return Response(
            {
                'error':
                'Only Admin can access the dashboard.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # --------------------------------
    # Counts
    # --------------------------------

    total_patients = PatientProfile.objects.count()

    total_doctors = DoctorProfile.objects.count()

    total_appointments = Appointment.objects.count()

    total_medical_records = MedicalRecord.objects.count()

    total_prescriptions = Prescription.objects.count()

    total_lab_tests = LabTest.objects.count()

    total_lab_results = LabResult.objects.count()

    total_bills = Bill.objects.count()

    # --------------------------------
    # Appointment statistics
    # --------------------------------

    scheduled_appointments = Appointment.objects.filter(
        status=Appointment.Status.SCHEDULED
    ).count()

    confirmed_appointments = Appointment.objects.filter(
        status=Appointment.Status.CONFIRMED
    ).count()

    completed_appointments = Appointment.objects.filter(
        status=Appointment.Status.COMPLETED
    ).count()

    cancelled_appointments = Appointment.objects.filter(
        status=Appointment.Status.CANCELLED
    ).count()

    no_show_appointments = Appointment.objects.filter(
        status=Appointment.Status.NO_SHOW
    ).count()

    # --------------------------------
    # Billing statistics
    # --------------------------------

    from django.db.models import Sum

    total_billed_amount = Bill.objects.exclude(
        payment_status=Bill.PaymentStatus.CANCELLED
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    total_collected_amount = Bill.objects.aggregate(
        total=Sum('paid_amount')
    )['total'] or 0

    outstanding_amount = (
        total_billed_amount -
        total_collected_amount
    )

    pending_bills = Bill.objects.filter(
        payment_status=Bill.PaymentStatus.PENDING
    ).count()

    partially_paid_bills = Bill.objects.filter(
        payment_status=Bill.PaymentStatus.PARTIALLY_PAID
    ).count()

    paid_bills = Bill.objects.filter(
        payment_status=Bill.PaymentStatus.PAID
    ).count()

    cancelled_bills = Bill.objects.filter(
        payment_status=Bill.PaymentStatus.CANCELLED
    ).count()

    # --------------------------------
    # Lab Test statistics
    # --------------------------------

    requested_lab_tests = LabTest.objects.filter(
        status=LabTest.Status.REQUESTED
    ).count()

    in_progress_lab_tests = LabTest.objects.filter(
        status=LabTest.Status.IN_PROGRESS
    ).count()

    completed_lab_tests = LabTest.objects.filter(
        status=LabTest.Status.COMPLETED
    ).count()

    cancelled_lab_tests = LabTest.objects.filter(
        status=LabTest.Status.CANCELLED
    ).count()

    # --------------------------------
    # Response
    # --------------------------------

    return Response(
        {
            'patients': {
                'total': total_patients
            },

            'doctors': {
                'total': total_doctors
            },

            'appointments': {
                'total': total_appointments,
                'scheduled': scheduled_appointments,
                'confirmed': confirmed_appointments,
                'completed': completed_appointments,
                'cancelled': cancelled_appointments,
                'no_show': no_show_appointments
            },

            'medical_records': {
                'total': total_medical_records
            },

            'prescriptions': {
                'total': total_prescriptions
            },

            'lab_tests': {
                'total': total_lab_tests,
                'requested': requested_lab_tests,
                'in_progress': in_progress_lab_tests,
                'completed': completed_lab_tests,
                'cancelled': cancelled_lab_tests
            },

            'lab_results': {
                'total': total_lab_results
            },

            'billing': {
                'total_bills': total_bills,
                'total_billed_amount': total_billed_amount,
                'total_collected_amount': total_collected_amount,
                'outstanding_amount': outstanding_amount,
                'pending_bills': pending_bills,
                'partially_paid_bills': partially_paid_bills,
                'paid_bills': paid_bills,
                'cancelled_bills': cancelled_bills
            }
        },
        status=status.HTTP_200_OK
    )




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admission_list_create(request):

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        admissions = Admission.objects.select_related(
            'patient__user',
            'doctor__user',
            'department'
        ).all()

        # Patient → own admissions only
        if request.user.role == User.Role.PATIENT:

            admissions = admissions.filter(
                patient__user=request.user
            )

        # Doctor → admissions assigned to them
        elif request.user.role == User.Role.DOCTOR:

            admissions = admissions.filter(
                doctor__user=request.user
            )

        # Admin / Receptionist → all admissions

        serializer = AdmissionSerializer(
            admissions,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # POST
    # --------------------------------

    if request.method == 'POST':

        # Only Admin and Receptionist can create admissions
        if request.user.role not in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:

            return Response(
                {
                    'error':
                    'You do not have permission to create admissions.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # --------------------------------
        # Required fields
        # --------------------------------

        patient_id = request.data.get('patient')

        doctor_id = request.data.get('doctor')

        department_id = request.data.get('department')

        admission_date = request.data.get(
            'admission_date'
        )

        reason = request.data.get(
            'reason'
        )

        room_id = request.data.get('room')

        bed_id = request.data.get('bed')

        # --------------------------------
        # Prevent past admission dates
        # --------------------------------

        if admission_date:
            try:
                admission_date_obj = timezone.datetime.strptime(
                    admission_date,
                    '%Y-%m-%d'
                ).date()
            except (ValueError, TypeError):
                return Response(
                    {
                        'error': 'Invalid admission date format. Use YYYY-MM-DD.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if admission_date_obj < timezone.localdate():
                return Response(
                    {
                        'error': 'Admission date cannot be in the past.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        if not patient_id:

            return Response(
                {
                    'error':
                    'Patient is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not doctor_id:

            return Response(
                {
                    'error':
                    'Doctor is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not department_id:

            return Response(
                {
                    'error':
                    'Department is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not admission_date:

            return Response(
                {
                    'error':
                    'Admission date is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not reason:

            return Response(
                {
                    'error':
                    'Admission reason is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not room_id:

            return Response(
                {
                    'error':
                    'Room is required for admission.'
                },
                 status=status.HTTP_400_BAD_REQUEST
            )

        if not bed_id:

            return Response(
                {
                    'error':
                    'Bed is required for admission.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Validate patient
        # --------------------------------

        try:

            patient = PatientProfile.objects.get(
                id=patient_id
            )

        except PatientProfile.DoesNotExist:

            return Response(
                {
                    'error':
                    'Patient not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------
        # Validate doctor
        # --------------------------------

        try:

            doctor = DoctorProfile.objects.select_related(
                'department'
            ).get(
                id=doctor_id
            )

        except DoctorProfile.DoesNotExist:

            return Response(
                {
                    'error':
                    'Doctor not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------
        # Validate department
        # --------------------------------

        try:

            department = Department.objects.get(
                id=department_id
            )

        except Department.DoesNotExist:

            return Response(
                {
                    'error':
                    'Department not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------
        # Doctor / Department validation
        # --------------------------------

        if doctor.department_id != department.id:

            return Response(
                {
                    'error':
                    'Doctor does not belong to the selected department.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        
        try:

            room = Room.objects.select_related(
                    'department'
                ).get(
                    id=room_id
                    )

        except Room.DoesNotExist:

            return Response(
                {
                    'error':
                    'Room not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )


        if room.status != Room.Status.ACTIVE:

            return Response(
                {
                    'error':
                    'Cannot admit a patient to an inactive room.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        if room.department_id != department.id:

            return Response(
                {
                    'error':
                    'Room does not belong to the selected department.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )




        try:

            bed = Bed.objects.select_related(
                    'room__department'
                ).get(
                    id=bed_id
            )

        except Bed.DoesNotExist:

             return Response(
            {
                'error':
                'Bed not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )


        if bed.room_id != room.id:

            return Response(
            {
                'error':
                'Bed does not belong to the selected room.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


        if bed.status != Bed.Status.AVAILABLE:

            return Response(
            {
                'error':
                'Selected bed is not available.'
            },
            status=status.HTTP_409_CONFLICT
        )

        

        # --------------------------------
        # Prevent duplicate active admission
        # --------------------------------

        active_admission = Admission.objects.filter(
            patient=patient,
            status__in=[
                Admission.Status.ADMITTED,
                Admission.Status.UNDER_TREATMENT
            ]
        ).exists()

        if active_admission:

            return Response(
                {
                    'error':
                    'Patient already has an active admission.'
                },
                status=status.HTTP_409_CONFLICT
            )

        # --------------------------------
        # Create admission
        # --------------------------------

        data = {
            'patient': patient.id,
            'doctor': doctor.id,
            'department': department.id,
            'room': room.id,
            'bed': bed.id,
            'admission_date': admission_date,
            'reason': reason,
            'status': request.data.get(
                'status',
                Admission.Status.ADMITTED
            ),
            'notes': request.data.get(
                'notes',
                ''
            )
        }

        serializer = AdmissionSerializer(
            data=data
        )

        if serializer.is_valid():

            admission = serializer.save()

            bed.status = Bed.Status.OCCUPIED
            bed.save()

            create_audit_log(
                user=request.user,
                action=AuditLog.Action.CREATE,
                module='admissions',
                description=(
                    f'Created admission #{admission.id} '
                    f'for patient {admission.patient.patient_id}.'
                ),
                ip_address=request.META.get('REMOTE_ADDR')
            )


            return Response(
                AdmissionSerializer(admission).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )




@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def admission_detail(request, pk):

    try:
        admission = Admission.objects.select_related(
            'patient__user',
            'doctor__user',
            'department'
        ).get(
            id=pk
        )

    except Admission.DoesNotExist:
        return Response(
            {
                'error': 'Admission not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        # Patient → own admissions only
        if request.user.role == User.Role.PATIENT:

            if admission.patient.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view your own admissions.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # Doctor → assigned admissions only
        elif request.user.role == User.Role.DOCTOR:

            if admission.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only view admissions assigned to you.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = AdmissionSerializer(admission)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # PUT / PATCH
    # --------------------------------

    if request.method in ['PUT', 'PATCH']:

        # Admin and Receptionist → can update any admission
        if request.user.role in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:
            pass

        # Doctor → can update only admissions assigned to them
        elif request.user.role == User.Role.DOCTOR:

            if admission.doctor.user_id != request.user.id:
                return Response(
                    {
                        'error':
                        'You can only update admissions assigned to you.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # Patient → cannot update admissions
        else:
            return Response(
                {
                    'error':
                    'You do not have permission to update admissions.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # --------------------------------
        # Protected fields
        # --------------------------------

        protected_fields = [
            'patient',
            'doctor',
            'department',
            'room',
            'bed',
            'admission_date'
        ]

        for field in protected_fields:

            if field in request.data:

                return Response(
                    {
                        'error':
                        f'{field} cannot be changed after admission.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # Current status
        # --------------------------------

        current_status = admission.status

        new_status = request.data.get(
            'status',
            current_status
        )

        # --------------------------------
        # Validate status
        # --------------------------------

        valid_statuses = [
            Admission.Status.ADMITTED,
            Admission.Status.UNDER_TREATMENT,
            Admission.Status.DISCHARGED,
            Admission.Status.CANCELLED
        ]

        if new_status not in valid_statuses:

            return Response(
                {
                    'error':
                    'Invalid admission status.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Prevent changes after discharge
        # --------------------------------

        if current_status == Admission.Status.DISCHARGED:

            if new_status != Admission.Status.DISCHARGED:

                return Response(
                    {
                        'error':
                        'Discharged admission cannot be changed.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # Prevent changes after cancellation
        # --------------------------------

        if current_status == Admission.Status.CANCELLED:

            if new_status != Admission.Status.CANCELLED:

                return Response(
                    {
                        'error':
                        'Cancelled admission cannot be changed.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # Status transition validation
        # --------------------------------

        allowed_transitions = {

            Admission.Status.ADMITTED: [
                Admission.Status.ADMITTED,
                Admission.Status.UNDER_TREATMENT,
                Admission.Status.DISCHARGED,
                Admission.Status.CANCELLED
            ],

            Admission.Status.UNDER_TREATMENT: [
                Admission.Status.UNDER_TREATMENT,
                Admission.Status.DISCHARGED
            ],

            Admission.Status.DISCHARGED: [
                Admission.Status.DISCHARGED
            ],

            Admission.Status.CANCELLED: [
                Admission.Status.CANCELLED
            ]
        }

        if new_status not in allowed_transitions[current_status]:

            return Response(
                {
                    'error':
                    f'Cannot change admission status from '
                    f'{current_status} to {new_status}.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Discharge date validation
        # --------------------------------

        if new_status == Admission.Status.DISCHARGED:

            if not request.data.get('discharge_date'):

                return Response(
                    {
                        'error':
                        'Discharge date is required when discharging a patient.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------
        # Prevent discharge date otherwise
        # --------------------------------

        if (
            'discharge_date' in request.data
            and new_status != Admission.Status.DISCHARGED
        ):

            return Response(
                {
                    'error':
                    'Discharge date can only be set when admission is DISCHARGED.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Update
        # --------------------------------

        serializer = AdmissionSerializer(
            admission,
            data=request.data,
            partial=(request.method == 'PATCH')
        )

        if serializer.is_valid():

            old_status = admission.status

            admission = serializer.save()


            if (
                admission.status in [
                    Admission.Status.DISCHARGED,
                    Admission.Status.CANCELLED
                ]
                and admission.bed
            ):

                bed = admission.bed

                if bed.status == Bed.Status.OCCUPIED:

                    bed.status = Bed.Status.AVAILABLE
                    bed.save()

            create_audit_log(
                user=request.user,
                action=AuditLog.Action.UPDATE,
                module='admissions',
                description=(
                    f'Updated admission #{admission.id} '
                    f'from {old_status} to {admission.status}.'
                ),
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response(
                AdmissionSerializer(admission).data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def room_list_create(request):

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        rooms = Room.objects.select_related(
            'department'
        ).prefetch_related(
            'beds'
        ).all()

        serializer = RoomSerializer(
            rooms,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # POST
    # --------------------------------

    if request.method == 'POST':

        # Only Admin and Receptionist can create rooms
        if request.user.role not in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:

            return Response(
                {
                    'error':
                    'You do not have permission to create rooms.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        department_id = request.data.get(
            'department'
        )

        room_number = request.data.get(
            'room_number'
        )

        room_type = request.data.get(
            'room_type'
        )

        if not department_id:

            return Response(
                {
                    'error':
                    'Department is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not room_number:

            return Response(
                {
                    'error':
                    'Room number is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not room_type:

            return Response(
                {
                    'error':
                    'Room type is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Validate department
        # --------------------------------

        try:

            department = Department.objects.get(
                id=department_id
            )

        except Department.DoesNotExist:

            return Response(
                {
                    'error':
                    'Department not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------
        # Prevent duplicate room number
        # --------------------------------

        if Room.objects.filter(
            room_number=room_number
        ).exists():

            return Response(
                {
                    'error':
                    'A room with this room number already exists.'
                },
                status=status.HTTP_409_CONFLICT
            )

        # --------------------------------
        # Create room
        # --------------------------------

        data = {
            'room_number': room_number,
            'room_type': room_type,
            'department': department.id,
            'status': request.data.get(
                'status',
                Room.Status.ACTIVE
            )
        }

        serializer = RoomSerializer(
            data=data
        )

        if serializer.is_valid():

            room = serializer.save()

            return Response(
                RoomSerializer(room).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def room_detail(request, pk):

    try:
        room = Room.objects.select_related(
            'department'
        ).prefetch_related(
            'beds'
        ).get(pk=pk)

    except Room.DoesNotExist:
        return Response(
            {
                'error': 'Room not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        serializer = RoomSerializer(room)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # ADMIN / RECEPTIONIST PERMISSION
    # --------------------------------

    if request.user.role not in [
        User.Role.ADMIN,
        User.Role.RECEPTIONIST
    ]:

        return Response(
            {
                'error':
                'You do not have permission to modify rooms.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # =================================
    # DELETE ROOM
    # =================================

    if request.method == 'DELETE':

        # --------------------------------
        # PREVENT DELETING ROOM WITH BEDS
        # --------------------------------

        if room.beds.exists():

            return Response(
                {
                    'error':
                    'Cannot delete this room because it contains beds. Delete the beds first.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # PREVENT DELETING ASSIGNED
        # CONSULTATION ROOM
        # --------------------------------

        if hasattr(room, 'assigned_doctor'):

            doctor = room.assigned_doctor

            return Response(
                {
                    'error':
                    f'Cannot delete this consultation room because it is assigned to doctor {doctor.doctor_id}. Unassign the room from the doctor first.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # DELETE
        # --------------------------------

        room.delete()

        return Response(
            {
                'message':
                'Room deleted successfully.'
            },
            status=status.HTTP_200_OK
        )

    # =================================
    # UPDATE ROOM
    # =================================

    # --------------------------------
    # Department cannot change
    # --------------------------------

    if 'department' in request.data:

        return Response(
            {
                'error':
                'Room department cannot be changed after room creation.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # Room number
    # --------------------------------

    new_room_number = request.data.get(
        'room_number',
        room.room_number
    )

    if not new_room_number or not str(
        new_room_number
    ).strip():

        return Response(
            {
                'error':
                'Room number cannot be empty.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    new_room_number = str(
        new_room_number
    ).strip()

    # --------------------------------
    # Prevent duplicate room number
    # --------------------------------

    duplicate_room = Room.objects.filter(
        room_number=new_room_number
    ).exclude(
        id=room.id
    ).exists()

    if duplicate_room:

        return Response(
            {
                'error':
                'A room with this room number already exists.'
            },
            status=status.HTTP_409_CONFLICT
        )

    # --------------------------------
    # Consultation room protection
    # --------------------------------

    new_room_type = request.data.get(
        'room_type',
        room.room_type
    )

    if (
        room.room_type ==
        Room.RoomType.CONSULTATION
        and new_room_type !=
        Room.RoomType.CONSULTATION
    ):

        if hasattr(room, 'assigned_doctor'):

            return Response(
                {
                    'error':
                    'Cannot change this consultation room to another room type because it is assigned to a doctor.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    # --------------------------------
    # UPDATE
    # --------------------------------

    data = request.data.copy()

    data['room_number'] = (
        new_room_number
    )

    serializer = RoomSerializer(
        room,
        data=data,
        partial=(
            request.method == 'PATCH'
        )
    )

    if serializer.is_valid():

        room = serializer.save()

        return Response(
            RoomSerializer(room).data,
            status=status.HTTP_200_OK
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def bed_list_create(request):

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        beds = Bed.objects.select_related(
            'room__department'
        ).all()

        serializer = BedSerializer(
            beds,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # POST
    # --------------------------------

    if request.method == 'POST':

        # Only Admin and Receptionist can create beds
        if request.user.role not in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:

            return Response(
                {
                    'error':
                    'You do not have permission to create beds.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        room_id = request.data.get('room')

        bed_number = request.data.get('bed_number')

        if not room_id:

            return Response(
                {
                    'error':
                    'Room is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not bed_number:

            return Response(
                {
                    'error':
                    'Bed number is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Validate room
        # --------------------------------

        try:

            room = Room.objects.select_related(
                'department'
            ).get(
                id=room_id
            )

        except Room.DoesNotExist:

            return Response(
                {
                    'error':
                    'Room not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------
        # Consultation rooms cannot
        # contain beds
        # --------------------------------

        if room.room_type == Room.RoomType.CONSULTATION:

            return Response(
                {
                    'error':
                    'Consultation rooms cannot contain beds.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Room must be active
        # --------------------------------

        if room.status != Room.Status.ACTIVE:

            return Response(
                {
                    'error':
                    'Cannot add a bed to an inactive room.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Prevent duplicate bed number
        # --------------------------------

        if Bed.objects.filter(
            room=room,
            bed_number=bed_number
        ).exists():

            return Response(
                {
                    'error':
                    'A bed with this number already exists in this room.'
                },
                status=status.HTTP_409_CONFLICT
            )

        # --------------------------------
        # Create bed
        # --------------------------------

        data = {
            'room': room.id,
            'bed_number': bed_number,
            'status': request.data.get(
                'status',
                Bed.Status.AVAILABLE
            )
        }

        serializer = BedSerializer(
            data=data
        )

        if serializer.is_valid():

            bed = serializer.save()

            return Response(
                BedSerializer(bed).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )



@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def bed_detail(request, pk):

    try:
        bed = Bed.objects.select_related(
            'room__department'
        ).get(pk=pk)

    except Bed.DoesNotExist:
        return Response(
            {
                'error': 'Bed not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        serializer = BedSerializer(bed)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # DELETE
    # --------------------------------

    if request.method == 'DELETE':

        # Only Admin and Receptionist can delete beds
        if request.user.role not in [
            User.Role.ADMIN,
            User.Role.RECEPTIONIST
        ]:

            return Response(
                {
                    'error':
                    'You do not have permission to delete beds.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Do not allow deletion of an occupied bed
        if bed.status == Bed.Status.OCCUPIED:

            return Response(
                {
                    'error':
                    'Cannot delete an occupied bed.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        bed.delete()

        return Response(
            {
                'message':
                'Bed deleted successfully.'
            },
            status=status.HTTP_204_NO_CONTENT
        )

    # --------------------------------
    # UPDATE PERMISSION
    # --------------------------------

    # Only Admin and Receptionist can update beds
    if request.user.role not in [
        User.Role.ADMIN,
        User.Role.RECEPTIONIST
    ]:

        return Response(
            {
                'error':
                'You do not have permission to update beds.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # --------------------------------
    # Protected fields
    # --------------------------------

    # Room cannot be changed after bed creation.
    # Bed number CAN be changed.
    protected_fields = [
        'room'
    ]

    for field in protected_fields:

        if field in request.data:

            return Response(
                {
                    'error':
                    f'{field} cannot be changed after bed creation.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    # --------------------------------
    # Bed number validation
    # --------------------------------

    if 'bed_number' in request.data:

        new_bed_number = str(
            request.data.get('bed_number')
        ).strip()

        if not new_bed_number:

            return Response(
                {
                    'error':
                    'Bed number cannot be empty.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check duplicate bed number inside the same room
        duplicate_bed = Bed.objects.filter(
            room=bed.room,
            bed_number=new_bed_number
        ).exclude(
            id=bed.id
        ).first()

        if duplicate_bed:

            return Response(
                {
                    'error':
                    'This bed number already exists in this room.'
                },
                status=status.HTTP_409_CONFLICT
            )

    # --------------------------------
    # Status validation
    # --------------------------------

    new_status = request.data.get(
        'status',
        bed.status
    )

    valid_statuses = [
        Bed.Status.AVAILABLE,
        Bed.Status.OCCUPIED,
        Bed.Status.MAINTENANCE
    ]

    if new_status not in valid_statuses:

        return Response(
            {
                'error':
                'Invalid bed status.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # Prevent manual release of occupied bed
    # --------------------------------

    if (
        bed.status == Bed.Status.OCCUPIED
        and new_status == Bed.Status.AVAILABLE
    ):

        return Response(
            {
                'error':
                'Occupied bed can only be released when the admission is discharged or cancelled.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # UPDATE
    # --------------------------------

    serializer = BedSerializer(
        bed,
        data=request.data,
        partial=(request.method == 'PATCH')
    )

    if serializer.is_valid():

        bed = serializer.save()

        return Response(
            BedSerializer(bed).data,
            status=status.HTTP_200_OK
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_log_list(request):

    # Only Admin can view audit logs
    if request.user.role != User.Role.ADMIN:

        return Response(
            {
                'error':
                'Only Admin can access audit logs.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    logs = AuditLog.objects.select_related(
        'user'
    ).all().order_by(
        '-created_at'
    )

    serializer = AuditLogSerializer(
        logs,
        many=True
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_list(request):

    # Only Admin can access this API
    if request.user.role != User.Role.ADMIN:
        return Response(
            {'detail': 'Only Admin can manage users.'},
            status=status.HTTP_403_FORBIDDEN
        )

    users = User.objects.all().order_by('id')
    serializer = AdminUserUpdateSerializer(users, many=True)

    return Response(serializer.data)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, pk):

    # Only Admin can access this API
    if request.user.role != User.Role.ADMIN:
        return Response(
            {'detail': 'Only Admin can manage users.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Admin cannot delete their own account
    if request.method == 'DELETE':
        if user.id == request.user.id:
            return Response(
                {'detail': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.delete()

        return Response(
            {'detail': 'User deleted successfully.'},
            status=status.HTTP_200_OK
        )

    # GET user details
    if request.method == 'GET':
        serializer = AdminUserUpdateSerializer(user)
        return Response(serializer.data)

    # PUT update user
    serializer = AdminUserUpdateSerializer(
        user,
        data=request.data
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def receptionist_list_create(request):

    # --------------------------------
    # GET
    # --------------------------------

    if request.method == 'GET':

        # Only Admin can view receptionists
        if request.user.role != User.Role.ADMIN:
            return Response(
                {
                    'error':
                    'Only Admin can access receptionists.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        receptionists = ReceptionistProfile.objects.select_related(
            'user'
        ).all().order_by('id')

        serializer = ReceptionistSerializer(
            receptionists,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------
    # POST
    # --------------------------------

    if request.method == 'POST':

        # Only Admin can create receptionists
        if request.user.role != User.Role.ADMIN:
            return Response(
                {
                    'error':
                    'Only Admin can create receptionists.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()

        # --------------------------------
        # Required fields
        # --------------------------------

        username = data.get('username')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email', '')
        mobile_number = data.get('mobile_number', '')
        aadhaar_number = data.get('aadhaar_number')

        if not username:
            return Response(
                {
                    'error': 'Username is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password:
            return Response(
                {
                    'error': 'Password is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not first_name:
            return Response(
                {
                    'error': 'First name is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not last_name:
            return Response(
                {
                    'error': 'Last name is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not aadhaar_number:
            return Response(
                {
                    'error': 'Aadhaar number is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------
        # Validate username
        # --------------------------------

        if User.objects.filter(
            username=username
        ).exists():

            return Response(
                {
                    'error':
                    'This username is already registered.'
                },
                status=status.HTTP_409_CONFLICT
            )

        # --------------------------------
        # Validate Aadhaar
        # --------------------------------

        if User.objects.filter(
            aadhaar_number=aadhaar_number
        ).exists():

            return Response(
                {
                    'error':
                    'This Aadhaar number is already registered.'
                },
                status=status.HTTP_409_CONFLICT
            )

        # --------------------------------
        # Create User + ReceptionistProfile
        # --------------------------------

        with transaction.atomic():

            user = User(
                username=username,
                first_name=first_name,
                last_name=last_name,
                email=email,
                mobile_number=mobile_number,
                aadhaar_number=aadhaar_number,
                role=User.Role.RECEPTIONIST
            )

            user.set_password(password)
            user.save()

            receptionist = ReceptionistProfile.objects.create(
                user=user
            )

        return Response(
            ReceptionistSerializer(
                receptionist
            ).data,
            status=status.HTTP_201_CREATED
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def receptionist_update(request, pk):

    # Only Admin can update receptionists
    if request.user.role != User.Role.ADMIN:
        return Response(
            {
                'error':
                'Only Admin can update receptionists.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        receptionist = ReceptionistProfile.objects.select_related(
            'user'
        ).get(pk=pk)
    except ReceptionistProfile.DoesNotExist:
        return Response(
            {
                'error':
                'Receptionist not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    user = receptionist.user
    data = request.data

    username = data.get('username')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    mobile_number = data.get('mobile_number')
    aadhaar_number = data.get('aadhaar_number')
    password = data.get('password')

    if username is not None:
        if User.objects.filter(
            username=username
        ).exclude(id=user.id).exists():
            return Response(
                {
                    'error':
                    'This username is already registered.'
                },
                status=status.HTTP_409_CONFLICT
            )

        user.username = username

    if first_name is not None:
        user.first_name = first_name

    if last_name is not None:
        user.last_name = last_name

    if email is not None:
        user.email = email

    if mobile_number is not None:
        user.mobile_number = mobile_number

    if aadhaar_number is not None:
        if User.objects.filter(
            aadhaar_number=aadhaar_number
        ).exclude(id=user.id).exists():
            return Response(
                {
                    'error':
                    'This Aadhaar number is already registered.'
                },
                status=status.HTTP_409_CONFLICT
            )

        user.aadhaar_number = aadhaar_number

    # Password is optional during update
    if password:
        user.set_password(password)

    with transaction.atomic():
        user.save()

    return Response(
        ReceptionistSerializer(receptionist).data,
        status=status.HTTP_200_OK
    )



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def receptionist_delete(request, pk):

    # Only Admin can delete receptionists
    if request.user.role != User.Role.ADMIN:
        return Response(
            {
                'error':
                'Only Admin can delete receptionists.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        receptionist = ReceptionistProfile.objects.select_related(
            'user'
        ).get(pk=pk)
    except ReceptionistProfile.DoesNotExist:
        return Response(
            {
                'error':
                'Receptionist not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    user = receptionist.user

    with transaction.atomic():
        receptionist.delete()
        user.delete()

    return Response(
        {
            'message':
            'Receptionist deleted successfully.'
        },
        status=status.HTTP_200_OK
    )