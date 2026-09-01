from django.contrib.auth import get_user_model
from rest_framework import serializers
from departments.models import Department
from doctors.models import DoctorProfile, DoctorAvailability
from patients.models import PatientProfile
from appointments.models import Appointment
from medical_records.models import MedicalRecord
from prescriptions.models import Prescription
from billing.models import Bill
from lab_tests.models import LabTest
from lab_tests.models import LabResult
from admissions.models import Admission
from rooms.models import Room, Bed
from audit_logs.models import AuditLog


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'mobile_number',
            'aadhaar_number',
            'password',
            'first_name',
            'last_name',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')

        user = User(**validated_data)

        # Public registration always creates a patient.
        user.role = User.Role.PATIENT

        user.set_password(password)
        user.save()

        return user


class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'mobile_number',
            'aadhaar_number',
            'first_name',
            'last_name',
            'role',
        ]



class DepartmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Department
        fields = [
            'id',
            'name',
            'description',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']




class DoctorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    first_name = serializers.CharField(
        source='user.first_name',
        read_only=True
    )

    last_name = serializers.CharField(
        source='user.last_name',
        read_only=True
    )

    email = serializers.EmailField(
        source='user.email',
        read_only=True
    )

    mobile_number = serializers.CharField(
        source='user.mobile_number',
        read_only=True
    )

    aadhaar_number = serializers.CharField(
        source='user.aadhaar_number',
        read_only=True
    )

    department_name = serializers.CharField(
        source='department.name',
        read_only=True
    )

    class Meta:
        model = DoctorProfile
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',
            'department',
            'department_name',
            'specialization',
            'qualification',
            'license_number',
            'experience_years',
            'consultation_fee',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'department_name',
            'created_at',
        ]


class DoctorCreateSerializer(serializers.ModelSerializer):

    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField(
        required=False,
        allow_blank=True
    )
    mobile_number = serializers.CharField(
        required=False,
        allow_blank=True
    )
    aadhaar_number = serializers.CharField(
        required=False,
        allow_blank=True
    )

    class Meta:
        model = DoctorProfile
        fields = [
            'username',
            'password',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',
            'department',
            'specialization',
            'qualification',
            'license_number',
            'experience_years',
            'consultation_fee',
        ]


class DoctorUpdateSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        required=False
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=False
    )
    first_name = serializers.CharField(
        required=False
    )
    last_name = serializers.CharField(
        required=False
    )
    email = serializers.EmailField(
        required=False,
        allow_blank=True
    )
    mobile_number = serializers.CharField(
        required=False,
        allow_blank=True
    )
    aadhaar_number = serializers.CharField(
        required=False,
        allow_blank=True
    )

    class Meta:
        model = DoctorProfile
        fields = [
            'username',
            'password',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',
            'department',
            'specialization',
            'qualification',
            'license_number',
            'experience_years',
            'consultation_fee',
        ]



class DoctorAvailabilitySerializer(serializers.ModelSerializer):

    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    day_name = serializers.CharField(
        source='get_day_of_week_display',
        read_only=True
    )

    class Meta:
        model = DoctorAvailability

        fields = [
            'id',
            'doctor',
            'doctor_name',
            'day_of_week',
            'day_name',
            'start_time',
            'end_time',
            'is_available',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'doctor_name',
            'day_name',
            'created_at',
        ]




class PatientSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    first_name = serializers.CharField(
        source='user.first_name',
        read_only=True
    )

    last_name = serializers.CharField(
        source='user.last_name',
        read_only=True
    )

    email = serializers.EmailField(
        source='user.email',
        read_only=True
    )

    mobile_number = serializers.CharField(
        source='user.mobile_number',
        read_only=True
    )

    aadhaar_number = serializers.CharField(
        source='user.aadhaar_number',
        read_only=True
    )

    class Meta:
        model = PatientProfile

        fields = [
            'id',
            'patient_id',

            'username',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',

            'date_of_birth',
            'gender',
            'blood_group',
            'address',

            'emergency_contact_name',
            'emergency_contact_number',

            'guardian_name',
            'guardian_mobile',

            'created_at',
        ]

        read_only_fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',
            'created_at',
        ]


class PatientCreateSerializer(serializers.ModelSerializer):

    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField(
        required=False,
        allow_blank=True
    )
    mobile_number = serializers.CharField(
        required=False,
        allow_blank=True
    )
    aadhaar_number = serializers.CharField(
        required=False,
        allow_blank=True
    )

    class Meta:
        model = PatientProfile

        fields = [
            'username',
            'password',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',

            'patient_id',
            'date_of_birth',
            'gender',
            'blood_group',
            'address',

            'emergency_contact_name',
            'emergency_contact_number',

            'guardian_name',
            'guardian_mobile',
        ]



class PatientUpdateSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        required=False
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=False
    )

    first_name = serializers.CharField(
        required=False
    )

    last_name = serializers.CharField(
        required=False
    )

    email = serializers.EmailField(
        required=False,
        allow_blank=True
    )

    mobile_number = serializers.CharField(
        required=False,
        allow_blank=True
    )

    aadhaar_number = serializers.CharField(
        required=False,
        allow_blank=True
    )

    class Meta:
        model = PatientProfile

        fields = [
            'username',
            'password',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',

            'patient_id',
            'date_of_birth',
            'gender',
            'blood_group',
            'address',

            'emergency_contact_name',
            'emergency_contact_number',

            'guardian_name',
            'guardian_mobile',
        ]




class AppointmentSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(
        source='patient.user.get_full_name',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    department_name = serializers.CharField(
        source='doctor.department.name',
        read_only=True
    )

    class Meta:
        model = Appointment

        fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'department_name',
            'appointment_date',
            'appointment_time',
            'status',
            'reason',
            'notes',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'patient_name',
            'doctor_name',
            'department_name',
            'created_at',
        ]


class AppointmentCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Appointment

        fields = [
            'patient',
            'doctor',
            'appointment_date',
            'appointment_time',
            'reason',
        ]


class AppointmentUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Appointment

        fields = [
            'appointment_date',
            'appointment_time',
            'status',
            'reason',
            'notes',
        ]



class MedicalRecordSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(
        source='patient.user.get_full_name',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    appointment_date = serializers.DateField(
        source='appointment.appointment_date',
        read_only=True
    )

    appointment_time = serializers.TimeField(
        source='appointment.appointment_time',
        read_only=True
    )

    class Meta:
        model = MedicalRecord

        fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'appointment',
            'appointment_date',
            'appointment_time',
            'symptoms',
            'diagnosis',
            'treatment',
            'notes',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'patient_name',
            'doctor_name',
            'appointment_date',
            'appointment_time',
            'created_at',
            'updated_at',
        ]


class MedicalRecordCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = MedicalRecord

        fields = [
            'appointment',
            'symptoms',
            'diagnosis',
            'treatment',
            'notes',
        ]


class MedicalRecordUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = MedicalRecord

        fields = [
            'symptoms',
            'diagnosis',
            'treatment',
            'notes',
        ]



class PrescriptionSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(
        source='medical_record.patient.user.get_full_name',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='medical_record.doctor.user.get_full_name',
        read_only=True
    )

    medical_record_id = serializers.IntegerField(
        source='medical_record.id',
        read_only=True
    )

    class Meta:
        model = Prescription

        fields = [
            'id',
            'medical_record',
            'medical_record_id',
            'patient_name',
            'doctor_name',
            'medicine_name',
            'dosage',
            'frequency',
            'duration',
            'instructions',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'medical_record',
            'medical_record_id',
            'patient_name',
            'doctor_name',
            'created_at',
            'updated_at',
        ]


class BillSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(
        source='appointment.patient.user.get_full_name',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='appointment.doctor.user.get_full_name',
        read_only=True
    )

    appointment_date = serializers.DateField(
        source='appointment.appointment_date',
        read_only=True
    )

    appointment_time = serializers.TimeField(
        source='appointment.appointment_time',
        read_only=True
    )

    class Meta:
        model = Bill

        fields = [
            'id',
            'appointment',
            'patient_name',
            'doctor_name',
            'appointment_date',
            'appointment_time',
            'consultation_fee',
            'additional_charges',
            'total_amount',
            'payment_status',
            'payment_method',
            'paid_amount',
            'notes',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'patient_name',
            'doctor_name',
            'appointment_date',
            'appointment_time',
            'consultation_fee',
            'total_amount',
            'created_at',
            'updated_at',
        ]



class LabTestSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(
        source='patient.user.get_full_name',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    medical_record_id = serializers.IntegerField(
        source='medical_record.id',
        read_only=True
    )

    class Meta:
        model = LabTest

        fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'medical_record',
            'medical_record_id',
            'test_name',
            'test_type',
            'status',
            'test_date',
            'notes',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'medical_record',
            'medical_record_id',
            'created_at',
            'updated_at',
        ]



class LabResultSerializer(serializers.ModelSerializer):

    lab_test_name = serializers.CharField(
        source='lab_test.test_name',
        read_only=True
    )

    patient_name = serializers.CharField(
        source='lab_test.patient.user.get_full_name',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='lab_test.doctor.user.get_full_name',
        read_only=True
    )

    lab_test_status = serializers.CharField(
        source='lab_test.status',
        read_only=True
    )

    class Meta:
        model = LabResult

        fields = [
            'id',
            'lab_test',
            'lab_test_name',
            'patient_name',
            'doctor_name',
            'lab_test_status',
            'result',
            'normal_range',
            'remarks',
            'result_date',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'lab_test',
            'lab_test_name',
            'patient_name',
            'doctor_name',
            'lab_test_status',
            'created_at',
            'updated_at',
        ]



class AdmissionSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(
        source='patient.user.get_full_name',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    department_name = serializers.CharField(
        source='department.name',
        read_only=True
    )

    room_number = serializers.CharField(
        source='room.room_number',
        read_only=True
    )

    bed_number = serializers.CharField(
        source='bed.bed_number',
        read_only=True
    )

    class Meta:
        model = Admission

        fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'department',
            'department_name',
            'room',
            'room_number',
            'bed',
            'bed_number',
            'admission_date',
            'discharge_date',
            'reason',
            'status',
            'notes',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'patient_name',
            'doctor_name',
            'department_name',
            'room_number',
            'bed_number',
            'created_at',
            'updated_at',
        ]




class RoomSerializer(serializers.ModelSerializer):

    department_name = serializers.CharField(
        source='department.name',
        read_only=True
    )

    bed_count = serializers.IntegerField(
        source='beds.count',
        read_only=True
    )

    class Meta:
        model = Room

        fields = [
            'id',
            'room_number',
            'room_type',
            'department',
            'department_name',
            'status',
            'bed_count',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'department_name',
            'bed_count',
            'created_at',
            'updated_at',
        ]


class BedSerializer(serializers.ModelSerializer):

    room_number = serializers.CharField(
        source='room.room_number',
        read_only=True
    )

    department_name = serializers.CharField(
        source='room.department.name',
        read_only=True
    )

    class Meta:
        model = Bed

        fields = [
            'id',
            'room',
            'room_number',
            'bed_number',
            'status',
            'department_name',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'room_number',
            'department_name',
            'created_at',
            'updated_at',
        ]




class AuditLogSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    class Meta:
        model = AuditLog

        fields = [
            'id',
            'user',
            'username',
            'action',
            'module',
            'description',
            'ip_address',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'user',
            'username',
            'ip_address',
            'created_at',
        ]