import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .models import Todo


def parse_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return {}


@csrf_exempt
@require_http_methods(["POST"])
def signup_view(request):
    data = parse_json(request)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    name = data.get('name', '').strip()

    if not username or not password:
        return JsonResponse({'error': '아이디와 비밀번호를 모두 입력해주세요.'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': '이미 존재하는 아이디입니다.'}, status=400)

    user = User.objects.create_user(username=username, password=password, first_name=name)
    login(request, user)
    return JsonResponse({
        'success': True,
        'user': {
            'username': user.username,
            'name': user.first_name or user.username
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    data = parse_json(request)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return JsonResponse({'error': '아이디와 비밀번호를 입력해주세요.'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({
            'success': True,
            'user': {
                'username': user.username,
                'name': user.first_name or user.username
            }
        })
    else:
        return JsonResponse({'error': '아이디 또는 비밀번호가 올바르지 않습니다.'}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({'success': True})


@csrf_exempt
@require_http_methods(["GET"])
def me_view(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': {
                'username': request.user.username,
                'name': request.user.first_name or request.user.username
            }
        })
    return JsonResponse({'authenticated': False})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def todo_list_create_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': '로그인이 필요합니다.'}, status=401)

    if request.method == "GET":
        todos = Todo.objects.filter(user=request.user)
        data = [
            {
                'id': todo.id,
                'title': todo.title,
                'due_date': todo.due_date,
                'status': todo.status,
                'created_at': todo.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for todo in todos
        ]
        return JsonResponse({'todos': data})

    elif request.method == "POST":
        data = parse_json(request)
        title = data.get('title', '').strip()
        due_date = data.get('due_date', '').strip()
        status = data.get('status', 'pending').strip()

        if not title:
            return JsonResponse({'error': '제목을 입력해주세요.'}, status=400)

        todo = Todo.objects.create(
            user=request.user,
            title=title,
            due_date=due_date,
            status=status
        )
        return JsonResponse({
            'success': True,
            'todo': {
                'id': todo.id,
                'title': todo.title,
                'due_date': todo.due_date,
                'status': todo.status,
                'created_at': todo.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=201)


@csrf_exempt
@require_http_methods(["PATCH", "PUT", "DELETE"])
def todo_detail_view(request, pk):
    if not request.user.is_authenticated:
        return JsonResponse({'error': '로그인이 필요합니다.'}, status=401)

    try:
        todo = Todo.objects.get(pk=pk, user=request.user)
    except Todo.DoesNotExist:
        return JsonResponse({'error': '존재하지 않는 Todo입니다.'}, status=404)

    if request.method in ["PATCH", "PUT"]:
        data = parse_json(request)
        if 'title' in data:
            todo.title = data['title'].strip()
        if 'due_date' in data:
            todo.due_date = data['due_date'].strip()
        if 'status' in data:
            todo.status = data['status'].strip()

        todo.save()
        return JsonResponse({
            'success': True,
            'todo': {
                'id': todo.id,
                'title': todo.title,
                'due_date': todo.due_date,
                'status': todo.status,
                'updated_at': todo.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        })

    elif request.method == "DELETE":
        todo.delete()
        return JsonResponse({'success': True})
