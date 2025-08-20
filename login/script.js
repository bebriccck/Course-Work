const API_URL = 'http://localhost:3000';

const form = document.getElementById('login-form');
const loginInput = document.getElementById('login-input');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('submit-button');

function validateLoginFormat(login) {
    const phoneRegex = /^\+375\s?\(?(?:29|33|44|25)\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!phoneRegex.test(login) && !emailRegex.test(login)) {
        return { isValid: false, message: 'Enter a valid Belarus phone number (+375 XX XXX-XX-XX) or email' };
    }
    return { isValid: true, message: '' };
}

async function validateLoginExists(login) {
    try {
        const response = await fetch(`${API_URL}/users?phone=${encodeURIComponent(login)}`);
        const usersByPhone = await response.json();
        if (usersByPhone.length > 0) {
            return { isValid: true, user: usersByPhone[0] };
        }

        const responseEmail = await fetch(`${API_URL}/users?email=${encodeURIComponent(login)}`);
        const usersByEmail = await responseEmail.json();
        if (usersByEmail.length > 0) {
            return { isValid: true, user: usersByEmail[0] };
        }

        return { isValid: false, message: 'Phone or email not found' };
    } catch (error) {
        console.error('Error checking login:', error);
        return { isValid: false, message: 'Server error' };
    }
}

function validatePassword(password, user) {
    if (!password) {
        return { isValid: false, message: 'Password is required' };
    }
    if (user && password !== user.password) {
        return { isValid: false, message: 'Incorrect password' };
    }
    return { isValid: true, message: '' };
}

async function validateForm() {
    let isValid = true;
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });

    const loginValidation = validateLoginFormat(loginInput.value);
    if (!loginValidation.isValid) {
        document.getElementById('login-error').textContent = loginValidation.message;
        isValid = false;
    }

    if (!passwordInput.value) {
        document.getElementById('password-error').textContent = 'Password is required';
        isValid = false;
    }

    submitButton.disabled = !isValid;
}

async function validateFormOnSubmit() {
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

form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', validateForm);
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
            alert('Login successful!');
            form.reset();
            submitButton.disabled = true;
            window.location.href = '../home/index.html';
        } catch (error) {
            console.error('Server error:', error);
            alert('Server error');
        }
    }
});