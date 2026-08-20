from django.contrib.auth import get_user_model
from rest_framework import serializers
from departments.models import Department

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