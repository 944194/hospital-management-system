from django.urls import path

from .views import (
    register,
    profile,
    department_list_create,
    department_detail,
    doctor_list_create,
    doctor_detail,
    patient_list_create,
    patient_detail,
    appointment_list_create,
    appointment_detail,
    medical_record_list_create,
    medical_record_detail,
    doctor_availability_list_create,
    doctor_availability_detail,
    prescription_list_create,
    prescription_detail,
    bill_list_create,
    bill_detail,
    lab_test_list_create,
    lab_test_detail,
    lab_result_list_create,
    lab_result_detail,
    admin_dashboard,
    admission_list_create,
    admission_detail,
    room_list_create,
    room_detail,
    bed_list_create,
    bed_detail,
    audit_log_list,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [

    # Authentication
    path(
        'auth/register/',
        register,
        name='register'
    ),

    path(
        'auth/login/',
        TokenObtainPairView.as_view(),
        name='login'
    ),

    path(
        'auth/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),

    path(
        'auth/profile/',
        profile,
        name='profile'
    ),

    # Departments
    path(
        'departments/',
        department_list_create,
        name='department_list_create'
    ),

    path(
        'departments/<int:pk>/',
        department_detail,
        name='department_detail'
    ),

    #Doctors
    path(
        'doctors/',
        doctor_list_create,
        name='doctor_list_create'
    ),

    path(
        'doctors/<int:pk>/',
        doctor_detail,
        name='doctor_detail'
    ),

    path(
        'doctor-availability/',
        doctor_availability_list_create,
        name='doctor_availability_list_create'
    ),

    path(
        'doctor-availability/<int:pk>/',
        doctor_availability_detail,
        name='doctor_availability_detail'
    ),

    path(
        'patients/',
        patient_list_create,
        name='patient_list_create'
    ),

    path(
        'patients/<int:pk>/',
        patient_detail,
        name='patient_detail'
    ),

    path(
        'appointments/',
        appointment_list_create,
        name='appointment_list_create'
    ),

    path(
        'appointments/<int:pk>/',
        appointment_detail,
        name='appointment_detail'
    ),

    path(
        'medical-records/',
        medical_record_list_create,
        name='medical_record_list_create'
    ),

    path(
    'medical-records/<int:pk>/',
    medical_record_detail,
    name='medical_record_detail'
    ),

    path(
    'prescriptions/',
    prescription_list_create,
    name='prescription_list_create'
    ),

    path(
    'prescriptions/<int:pk>/',
    prescription_detail,
    name='prescription_detail'
    ),

    path(
    'bills/',
    bill_list_create,
    name='bill_list_create'
    ),

    path(
    'bills/<int:pk>/',
    bill_detail,
    name='bill_detail'
    ),

    path(
    'lab-tests/',
    lab_test_list_create,
    name='lab_test_list_create'
    ),

    path(
    'lab-tests/<int:pk>/',
    lab_test_detail,
    name='lab_test_detail'
    ),

    path(
    'lab-results/',
    lab_result_list_create,
    name='lab_result_list_create'
    ),

    path(
    'lab-results/<int:pk>/',
    lab_result_detail,
    name='lab_result_detail'
    ),


    path(
    'admin/dashboard/',
    admin_dashboard,
    name='admin_dashboard'
    ),

    path(
    'admissions/',
    admission_list_create,
    name='admission_list_create'
    ),

    path(
    'admissions/<int:pk>/',
    admission_detail,
    name='admission_detail'
    ),

    path(
    'rooms/',
    room_list_create,
    name='room_list_create'
    ),

    path(
    'rooms/<int:pk>/',
    room_detail,
    name='room_detail'
    ),


    path(
    'beds/',
    bed_list_create,
    name='bed_list_create'
    ),
    

    path(
    'beds/<int:pk>/',
    bed_detail,
    name='bed_detail'
    ),

    path(
    'audit-logs/',
    audit_log_list,
    name='audit_log_list'
),

]