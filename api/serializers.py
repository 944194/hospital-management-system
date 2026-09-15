from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.utils import timezone
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
from receptionists.models import ReceptionistProfile


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    date_of_birth = serializers.DateField()

    gender = serializers.ChoiceField(
        choices=PatientProfile.Gender.choices
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
            'date_of_birth',
            'gender',
        ]

    def create(self, validated_data):

        date_of_birth = validated_data.pop('date_of_birth')
        gender = validated_data.pop('gender')

        password = validated_data.pop('password')

        user = User(**validated_data)

        user.role = User.Role.PATIENT

        user.set_password(password)

        user.save()

        PatientProfile.objects.create(
            user=user,
            date_of_birth=date_of_birth,
            gender=gender
        )

        return user


class UserProfileSerializer(serializers.ModelSerializer):

    patient_id = serializers.SerializerMethodField()
    receptionist_id = serializers.SerializerMethodField()

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
            'patient_id',
            'receptionist_id' 
        ]

    def get_patient_id(self, obj):
        if obj.role == User.Role.PATIENT:
            try:
                return obj.patient_profile.patient_id
            except PatientProfile.DoesNotExist:
                return None

        return None
    
    def get_receptionist_id(self, obj):
        if obj.role == User.Role.RECEPTIONIST:
            try:
                return obj.receptionist_profile.receptionist_id
            except ReceptionistProfile.DoesNotExist:
                return None

        return None



class PatientProfileUpdateSerializer(serializers.ModelSerializer):

    current_password = serializers.CharField(
        write_only=True,
        required=False
    )

    new_password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'current_password',
            'new_password',
            'confirm_password',
        ]

    def validate_username(self, value):

        if User.objects.filter(
            username=value
        ).exclude(
            pk=self.instance.pk
        ).exists():

            raise serializers.ValidationError(
                "This username is already taken."
            )

        return value

    def validate(self, attrs):

        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        current_password = attrs.get('current_password')

        if new_password:

            if not current_password:
                raise serializers.ValidationError({
                    'current_password':
                    'Current password is required to change your password.'
                })

            if not self.instance.check_password(current_password):
                raise serializers.ValidationError({
                    'current_password':
                    'Current password is incorrect.'
                })

            if not confirm_password:
                raise serializers.ValidationError({
                    'confirm_password':
                    'Please confirm your new password.'
                })

            if new_password != confirm_password:
                raise serializers.ValidationError({
                    'confirm_password':
                    'New password and confirm password do not match.'
                })

        elif confirm_password:

            raise serializers.ValidationError({
                'new_password':
                'New password is required.'
            })

        return attrs

    def update(self, instance, validated_data):

        validated_data.pop('current_password', None)

        new_password = validated_data.pop(
            'new_password',
            None
        )

        validated_data.pop(
            'confirm_password',
            None
        )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_password:
            instance.set_password(new_password)

        instance.save()

        return instance



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

    consultation_room = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.filter(
            room_type=Room.RoomType.CONSULTATION
        ),
        required=False,
        allow_null=True
    )

    consultation_room_number = serializers.CharField(
        source='consultation_room.room_number',
        read_only=True
    )

    class Meta:
        model = DoctorProfile
        fields = [
            'id',
            'doctor_id',
            'username',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',
            'department',
            'department_name',
            'consultation_room',
            'consultation_room_number',
            'specialization',
            'qualification',
            'license_number',
            'experience_years',
            'consultation_fee',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'doctor_id',
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

    def validate_username(self, value):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                f"Username '{value}' is already taken. "
                "Please choose another username."
            )

        return value

    def validate_aadhaar_number(self, value):

        if value and User.objects.filter(
            aadhaar_number=value
        ).exists():

            raise serializers.ValidationError(
                "This Aadhaar number is already registered."
            )

        return value

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
        allow_blank=True,
        allow_null=True
    )

    mobile_number = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )

    aadhaar_number = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )

    consultation_room = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.filter(
            room_type=Room.RoomType.CONSULTATION
        ),
        required=False,
        allow_null=True
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
            'consultation_room',
            'department',
            'specialization',
            'qualification',
            'license_number',
            'experience_years',
            'consultation_fee',
        ]

    # ==========================================
    # CONSULTATION ROOM VALIDATION
    # ==========================================

    def validate_consultation_room(self, room):

        if room is None:
            return room

        # Room must be active
        if room.status != Room.Status.ACTIVE:
            raise serializers.ValidationError(
                "The consultation room is not active."
            )

        # Room must be a consultation room
        if room.room_type != Room.RoomType.CONSULTATION:
            raise serializers.ValidationError(
                "Only consultation rooms can be assigned to a doctor."
            )

        # Room must belong to doctor's department
        doctor_department = self.instance.department

        if room.department_id != doctor_department.id:
            raise serializers.ValidationError(
                "The consultation room must belong to the doctor's department."
            )

        # ------------------------------------------
        # Prevent assigning an occupied room
        # ------------------------------------------

        existing_doctor = DoctorProfile.objects.filter(
            consultation_room=room
        ).exclude(
            id=self.instance.id
        ).first()

        if existing_doctor:

            raise serializers.ValidationError(
                "This consultation room is already assigned to another doctor."
            )

        return room

    # ==========================================
    # UPDATE DOCTOR
    # ==========================================

    def update(self, instance, validated_data):

        # ------------------------------------------
        # Store old room ID
        # ------------------------------------------

        old_room_id = instance.consultation_room_id

        # ------------------------------------------
        # Extract User fields
        # ------------------------------------------

        user = instance.user

        username = validated_data.pop(
            'username',
            None
        )

        password = validated_data.pop(
            'password',
            None
        )

        first_name = validated_data.pop(
            'first_name',
            None
        )

        last_name = validated_data.pop(
            'last_name',
            None
        )

        email = validated_data.pop(
            'email',
            None
        )

        mobile_number = validated_data.pop(
            'mobile_number',
            None
        )

        aadhaar_number = validated_data.pop(
            'aadhaar_number',
            None
        )

        # ------------------------------------------
        # Update User fields
        # ------------------------------------------

        if username is not None:
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
            user.aadhaar_number = aadhaar_number

        if password:
            user.set_password(password)

        user.save()

        # ------------------------------------------
        # Update DoctorProfile
        # ------------------------------------------

        instance = super().update(
            instance,
            validated_data
        )

        # Make sure we have the latest room ID
        new_room_id = instance.consultation_room_id

        # ------------------------------------------
        # CHECK WHETHER ROOM CHANGED
        # ------------------------------------------

        room_changed = (
            old_room_id != new_room_id
        )

        # ------------------------------------------
        # UPDATE FUTURE ACTIVE APPOINTMENTS
        # ------------------------------------------

        if room_changed:

            Appointment.objects.filter(
                doctor=instance,
                appointment_date__gte=timezone.localdate(),
                status__in=[
                    Appointment.Status.SCHEDULED,
                    Appointment.Status.CONFIRMED,
                ]
            ).update(
                appointment_room_id=new_room_id
            )

        return instance

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
        allow_blank=False,
        min_length=12,
        max_length=12
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
        allow_blank=False,
        min_length=12,
        max_length=12
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

    appointment_id = serializers.SerializerMethodField()

    def get_appointment_id(self, obj):
        return f"APT{obj.id:04d}"

    patient_name = serializers.CharField(
        source='patient.user.get_full_name',
        read_only=True
    )

    patient_id = serializers.CharField(
        source='patient.patient_id',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    doctor_id = serializers.CharField(
        source='doctor.doctor_id',
        read_only=True
    )

    consultation_room = serializers.PrimaryKeyRelatedField(
        source='appointment_room',
        read_only=True
    )

    consultation_room_number = serializers.CharField(
        source='appointment_room.room_number',
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
            'appointment_id',
            'patient',
            'patient_id',
            'patient_name',

            'doctor',
            'doctor_id',
            'doctor_name',
            'consultation_room',
            'consultation_room_number',

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
            'appointment_id',
            'patient_id',
            'patient_name',
            'doctor_id',
            'doctor_name',
            'consultation_room',
            'consultation_room_number',
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

    medical_record_id = serializers.SerializerMethodField()

    def get_medical_record_id(self, obj):
        return f"MR{obj.id:04d}"

    patient_name = serializers.CharField(
        source='patient.user.get_full_name',
        read_only=True
    )

    patient_id = serializers.CharField(
        source='patient.patient_id',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    doctor_id = serializers.CharField(
        source='doctor.doctor_id',
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
            'medical_record_id',
            'patient',
            'patient_id',
            'patient_name',
            'doctor',
            'doctor_id',
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
            'medical_record_id',
            'patient_id',
            'patient_name',
            'doctor_id',
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

    patient_id = serializers.CharField(
        source='medical_record.patient.patient_id',
        read_only=True
    )

    prescription_id = serializers.SerializerMethodField()

    def get_prescription_id(self, obj):
        return f"PRE{obj.id:04d}"

    doctor_name = serializers.CharField(
        source='medical_record.doctor.user.get_full_name',
        read_only=True
    )

    doctor_id = serializers.CharField(
        source='medical_record.doctor.doctor_id',
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
            'prescription_id',
            'medical_record',
            'medical_record_id',
            'patient_id',
            'patient_name',
            'doctor_id',
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
            'prescription_id',
            'medical_record_id',
            'patient_id',
            'patient_name',
            'doctor_id',
            'doctor_name',
            'created_at',
            'updated_at',
        ]


class BillSerializer(serializers.ModelSerializer):

    bill_id = serializers.SerializerMethodField()

    def get_bill_id(self, obj):
        return f"BILL{obj.id:04d}"

    patient_name = serializers.CharField(
        source='appointment.patient.user.get_full_name',
        read_only=True
    )

    patient_id = serializers.CharField(
        source='appointment.patient.patient_id',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='appointment.doctor.user.get_full_name',
        read_only=True
    )

    doctor_id = serializers.CharField(
        source='appointment.doctor.doctor_id',
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
            'bill_id',
            'appointment',
            'patient_id',
            'patient_name',
            'doctor_id',
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
            'bill_id',
            'patient_id',
            'patient_name',
            'doctor_id',
            'doctor_name',
            'appointment_date',
            'appointment_time',
            'consultation_fee',
            'total_amount',
            'created_at',
            'updated_at',
        ]



class LabTestSerializer(serializers.ModelSerializer):

    lab_test_id = serializers.SerializerMethodField()

    def get_lab_test_id(self, obj):
        return f"LAB{obj.id:04d}"

    patient_name = serializers.CharField(
        source='patient.user.get_full_name',
        read_only=True
    )

    patient_id = serializers.CharField(
        source='patient.patient_id',
        read_only=True
    )


    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    doctor_id = serializers.CharField(
        source='doctor.doctor_id',
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
            'lab_test_id',
            'patient',
            'patient_id',
            'patient_name',
            'doctor',
            'doctor_id',
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
            'lab_test_id',
            'patient',
            'patient_id',
            'patient_name',
            'doctor',
            'doctor_id',
            'doctor_name',
            'medical_record',
            'medical_record_id',
            'created_at',
            'updated_at',
        ]



class LabResultSerializer(serializers.ModelSerializer):

    lab_result_id = serializers.SerializerMethodField()

    def get_lab_result_id(self, obj):
        return f"LABR{obj.id:04d}"

    lab_test_name = serializers.CharField(
        source='lab_test.test_name',
        read_only=True
    )

    patient_name = serializers.CharField(
        source='lab_test.patient.user.get_full_name',
        read_only=True
    )

    patient_id = serializers.CharField(
        source='lab_test.patient.patient_id',
        read_only=True
    )


    doctor_name = serializers.CharField(
        source='lab_test.doctor.user.get_full_name',
        read_only=True
    )

    doctor_id = serializers.CharField(
        source='lab_test.doctor.doctor_id',
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
            'lab_result_id',
            'lab_test',
            'lab_test_name',
            'patient_name',
            'patient_id',
            'doctor_name',
            'doctor_id',
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
            'lab_result_id',
            'lab_test',
            'lab_test_name',
            'patient_name',
            'patient_id',
            'doctor_name',
            'doctor_id',
            'lab_test_status',
            'created_at',
            'updated_at',
        ]



class AdmissionSerializer(serializers.ModelSerializer):

    admission_id = serializers.SerializerMethodField()

    def get_admission_id(self, obj):
        return f"ADM{obj.id:04d}"

    patient_name = serializers.CharField(
        source='patient.user.get_full_name',
        read_only=True
    )

    patient_id = serializers.CharField(
        source='patient.patient_id',
        read_only=True
    )

    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    doctor_id = serializers.CharField(
        source='doctor.doctor_id',
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

    def validate(self, attrs):
        patient = attrs.get('patient')

        # During update, patient is normally not editable,
        # so use the existing admission's patient if needed.
        if patient is None and self.instance:
            patient = self.instance.patient

        # Only check when creating a new admission
        if patient and self.instance is None:
            active_admission = Admission.objects.filter(
                patient=patient,
                status__in=[
                    Admission.Status.ADMITTED,
                    Admission.Status.UNDER_TREATMENT,
                ]
            ).exists()

            if active_admission:
                raise serializers.ValidationError({
                    'patient': 'Patient already has an active admission.'
                })

        return attrs

    class Meta:
        model = Admission

        fields = [
            'id',
            'admission_id',
            'patient',
            'patient_id',
            'patient_name',
            'doctor',
            'doctor_id',
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
            'admission_id',
            'patient_id',
            'patient_name',
            'doctor_id',
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

    assigned_doctor = serializers.IntegerField(
        source='assigned_doctor.id',
        read_only=True,
        allow_null=True
    )

    assigned_doctor_id = serializers.CharField(
        source='assigned_doctor.doctor_id',
        read_only=True,
        allow_null=True
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
            'assigned_doctor',
            'assigned_doctor_id',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'department_name',
            'bed_count',
            'assigned_doctor',
            'assigned_doctor_id',
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

    user_identifier = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog

        fields = [
            'id',
            'user',
            'username',
            'user_identifier',
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
            'user_identifier',
            'ip_address',
            'created_at',
        ]

    def get_user_identifier(self, obj):

        if not obj.user:
            return None

        # Admin → username
        if obj.user.role == User.Role.ADMIN:
            return "admin"

        # Doctor → doctor_id
        if obj.user.role == User.Role.DOCTOR:
            try:
                return obj.user.doctor_profile.doctor_id
            except DoctorProfile.DoesNotExist:
                return None

        # Patient → patient_id
        if obj.user.role == User.Role.PATIENT:
            try:
                return obj.user.patient_profile.patient_id
            except PatientProfile.DoesNotExist:
                return None

        # Receptionist → receptionist_id
        if obj.user.role == User.Role.RECEPTIONIST:
            try:
                return obj.user.receptionist_profile.receptionist_id
            except ReceptionistProfile.DoesNotExist:
                return None

        return None

class AdminUserUpdateSerializer(serializers.ModelSerializer):
    aadhaar_number = serializers.CharField(
        required=True,
        allow_blank=False,
        min_length=12,
        max_length=12
    )

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8
    )

    def validate_aadhaar_number(self, value):
        if User.objects.filter(
            aadhaar_number=value
        ).exclude(
            pk=self.instance.pk
        ).exists():
            raise serializers.ValidationError(
                "This Aadhaar number is already registered."
            )

        return value

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
            'password',
        ]
        read_only_fields = ['id', 'role']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance



class ReceptionistSerializer(serializers.ModelSerializer):

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

    role = serializers.CharField(
        source='user.role',
        read_only=True
    )

    class Meta:
        model = ReceptionistProfile

        fields = [
            'id',
            'receptionist_id',
            'username',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',
            'role',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'receptionist_id',
            'username',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'aadhaar_number',
            'role',
            'created_at',
        ]