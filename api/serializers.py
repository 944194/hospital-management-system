from django.contrib.auth import get_user_model
from rest_framework import serializers
from departments.models import Department
from doctors.models import DoctorProfile
from patients.models import PatientProfile
from appointments.models import Appointment

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
        required=False,
        allow_blank=True
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


