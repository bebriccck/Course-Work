const API_URL = 'http://localhost:3000'; // Define API_URL directly

const touched = { login: false, password: false };

function validateLoginFormat(login) {
    const phoneRegex = /^\+375\s?\(?(?:29|33|44|25)\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const lang = localStorage.getItem('lang') || 'en';
    if (!phoneRegex.test(login) && !emailRegex.test(login)) {
        return { isValid: false, message: lang === 'ru' ? 'Введите действительный номер телефона (+375 XX XXX-XX-XX) или email' : 'Enter a valid Belarus phone number (+375 XX XXX-XX-XX) or email' };
    }
    return { isValid: true, message: '' };
}

async function validateLoginExists(login) {
    try {
        const response = await fetch(`${API_URL}/users?phone=${encodeURIComponent(login)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const usersByPhone = await response.json();
        if (usersByPhone.length > 0) {
            return { isValid: true, user: usersByPhone[0] };
        }

        const responseEmail = await fetch(`${API_URL}/users?email=${encodeURIComponent(login)}`);
        if (!responseEmail.ok) throw new Error(`HTTP error! status: ${responseEmail.status}`);
        const usersByEmail = await responseEmail.json();
        if (usersByEmail.length > 0) {
            return { isValid: true, user: usersByEmail[0] };
        }

        const lang = localStorage.getItem('lang') || 'en';
        return { isValid: false, message: lang === 'ru' ? 'Телефон или email не найдены' : 'Phone or email not found' };
    } catch (error) {
        console.error('Error checking login:', error);
        const lang = localStorage.getItem('lang') || 'en';
        return { isValid: false, message: lang === 'ru' ? 'Ошибка сервера. Пожалуйста, попробуйте позже.' : 'Server error. Please try again later.' };
    }
}

function validatePassword(password, user) {
    const lang = localStorage.getItem('lang') || 'en';
    if (!password) {
        return { isValid: false, message: lang === 'ru' ? 'Пароль обязателен' : 'Password is required' };
    }
    if (user && password !== user.password) {
        return { isValid: false, message: lang === 'ru' ? 'Неверный пароль' : 'Incorrect password' };
    }
    return { isValid: true, message: '' };
}

async function validateForm() {
    const form = document.getElementById('login-form');
    const loginInput = document.getElementById('login-input');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('submit-button');
    if (!form || !loginInput || !passwordInput || !submitButton) {
        console.error('Missing DOM elements: login-form, login-input, password, or submit-button');
        setTimeout(validateForm, 100);
        return;
    }

    let isValid = true;
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });

    if (touched.login) {
        const loginValidation = validateLoginFormat(loginInput.value);
        if (!loginValidation.isValid) {
            document.getElementById('login-error').textContent = loginValidation.message;
            isValid = false;
        }
    }

    if (touched.password && !passwordInput.value) {
        const lang = localStorage.getItem('lang') || 'en';
        document.getElementById('password-error').textContent = lang === 'ru' ? 'Пароль обязателен' : 'Password is required';
        isValid = false;
    }

    submitButton.disabled = !isValid || !loginInput.value || !passwordInput.value;
}

async function validateFormOnSubmit() {
    const loginInput = document.getElementById('login-input');
    const passwordInput = document.getElementById('password');
    if (!loginInput || !passwordInput) {
        console.error('Missing DOM elements: login-input or password');
        return { isValid: false, user: null };
    }

    let isValid = true;
    const loginExistsValidation = await validateLoginExists(loginInput.value);
    if (!loginExistsValidation.isValid) {
        document.getElementById('login-error').textContent = loginExistsValidation.message;
        isValid = false;
    } else {
        const passwordValidation = validatePassword(passwordInput.value, loginExistsValidation.user);
        if (!passwordValidation.isValid) {
            document.getElementById('password-error').textContent = passwordValidation.message;
            isValid = false;
        }
    }

    return { isValid, user: loginExistsValidation.user };
}

async function initLoginForm() {
    const form = document.getElementById('login-form');
    const loginInput = document.getElementById('login-input');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('submit-button');
    if (!form || !loginInput || !passwordInput || !submitButton) {
        console.error('Missing DOM elements: login-form, login-input, password, or submit-button');
        setTimeout(initLoginForm, 100);
        return;
    }

    loginInput.addEventListener('input', () => {
        touched.login = true;
        validateForm();
    });
    loginInput.addEventListener('blur', () => {
        touched.login = true;
        validateForm();
    });

    passwordInput.addEventListener('input', () => {
        touched.password = true;
        validateForm();
    });
    passwordInput.addEventListener('blur', () => {
        touched.password = true;
        validateForm();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!submitButton.disabled) {
            const { isValid, user } = await validateFormOnSubmit();
            if (!isValid) {
                submitButton.disabled = true;
                return;
            }

            try {
                localStorage.setItem('userId', user.id);
                localStorage.setItem('role', user.role);
                const lang = localStorage.getItem('lang') || 'en';
                alert(lang === 'ru' ? 'Вход выполнен успешно!' : 'Login successful!');
                form.reset();
                touched.login = false;
                touched.password = false;
                submitButton.disabled = true;
                window.location.href = '../home/index.html';
            } catch (error) {
                console.error('Unexpected error during login:', error);
                const lang = localStorage.getItem('lang') || 'en';
                alert(lang === 'ru' ? 'Ошибка сервера. Пожалуйста, попробуйте позже.' : 'Server error. Please try again later.');
            }
        }
    });

    const lang = localStorage.getItem('lang') || 'en';
    console.log('Applying initial translations for login form');
    window.applyTranslations && window.applyTranslations(await window.loadTranslations('login', lang), document);
    submitButton.disabled = true;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initializing login form');
    (async () => {
        await initLoginForm();
    })();
});