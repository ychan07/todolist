from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('todos.urls')),
    path('', TemplateView.as_view(template_name='login.html'), name='login_page'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login_page_alt'),
    path('signup/', TemplateView.as_view(template_name='signup.html'), name='signup_page'),
    path('todo/', TemplateView.as_view(template_name='todo.html'), name='todo_page'),
]

