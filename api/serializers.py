from django.contrib.auth import get_user_model
from rest_framework import serializers
from departments.models import Department
from doctors.models import DoctorProfile

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

    class Meta:
        model = DoctorProfile
        fields = [
            'username',
            'password',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
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

    class Meta:
        model = DoctorProfile
        fields = [
            'username',
            'password',
            'first_name',
            'last_name',
            'email',
            'mobile_number',
            'department',
            'specialization',
            'qualification',
            'license_number',
            'experience_years',
            'consultation_fee',
        ]


