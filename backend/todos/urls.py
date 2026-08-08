from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),
    path('todos/', views.todo_list_create_view, name='todo_list_create'),
    path('todos/<int:pk>/', views.todo_detail_view, name='todo_detail'),
]
