const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('main.login form');
    if (!loginForm) return;

    const isSignUp = document.title.includes('회원가입');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userIdInput = document.getElementById('userId');
        const passwordInput = document.getElementById('password');

        const username = userIdInput ? userIdInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        if (!username || !password) {
            alert('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        if (isSignUp) {
            const passwordConfirmInput = document.getElementById('passwordConfirm');
            const passwordConfirm = passwordConfirmInput ? passwordConfirmInput.value.trim() : '';

            if (password !== passwordConfirm) {
                alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/signup/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    alert('회원가입이 완료되었습니다!');
                    window.location.href = '/todo/';
                } else {
                    alert(data.error || '회원가입에 실패했습니다.');
                }
            } catch (err) {
                console.error(err);
                alert('서버와 통신할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.');
            }
        } else {
            try {
                const res = await fetch(`${API_BASE}/login/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    window.location.href = '/todo/';
                } else {
                    alert(data.error || '로그인에 실패했습니다.');
                }
            } catch (err) {
                console.error(err);
                alert('서버와 통신할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.');
            }
        }
    });
});
