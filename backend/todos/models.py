from django.db import models
from django.contrib.auth.models import User


class Todo(models.Model):
    STATUS_CHOICES = (
        ('pending', 'To Do'),
        ('completed', 'End To Do'),
        ('failed', 'Not End To Do'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='todos')
    title = models.CharField(max_length=255)
    due_date = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.user.username}] {self.title} ({self.status})"
