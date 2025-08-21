const API_URL = 'http://localhost:3000';
const commonPasswords = [
    'Password123!', 'Qwerty123$', 'Admin2024#', '12345678aA!',
    'Password2024!', 'Qwertyuiop1@', 'Welcome123#', 'Secret2024$'
];
const suffixes = ['Star', 'Light', 'Glow', 'Spark', 'Flame'];

const form = document.getElementById('profile-form');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const birthdateInput = document.getElementById('birthdate');
const passwordInput = document.getElementById('password');
const generatePasswordButton = document.getElementById('generate-password');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const middleNameInput = document.getElementById('middleName');
const nicknameInput = document.getElementById('nickname');
const regenerateNicknameButton = document.getElementById('regenerate-nickname');
const nicknameAttemptsSpan = document.getElementById('nickname-attempts');
const submitButton = document.getElementById('submit-button');
const logoutButton = document.getElementById('logout-button');
let nicknameAttempts = 5;

function setInitialAttemptsText() {
    nicknameAttemptsSpan.textContent = `Remaining nickname generation attempts: ${nicknameAttempts}`;
}

function setMaxBirthdate() {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    birthdateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let password = '';
    const minLength = 8;
    const maxLength = 20;
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

    const hasUpper = /[A-Z]/;
    const hasLower = /[a-z]/;
    const hasDigit = /\d/;
    const hasSpecial = /[@$!%*?&]/;

    do {
        password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (
        !hasUpper.test(password) ||
        !hasLower.test(password) ||
        !hasDigit.test(password) ||
        !hasSpecial.test(password) ||
        commonPasswords.includes(password)
    );

    return password;
}

async function generateNickname(firstName, lastName) {
    const firstPart = firstName.slice(0, Math.floor(Math.random() * 3) + 1);
    const lastPart = lastName.slice(0, Math.floor(Math.random() * 3) + 1);
    const number = Math.floor(Math.random() * 990) + 10;
    const useSuffix = Math.random() > 0.5;
    const suffix = useSuffix ? suffixes[Math.floor(Math.random() * suffixes.length)] : '';
    const nickname = `${firstPart}${lastPart}${number}${suffix}`;

    const exists = await validateNicknameExists(nickname);
    if (!exists.isValid && nicknameAttempts > 0) {
        return generateNickname(firstName, lastName);
    }
    return nickname;
}

function validatePhoneFormat(phone) {
    const phoneRegex = /^\+375\s?\(?(?:29|33|44|25)\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    if (!phoneRegex.test(phone)) {
        return { isValid: false, message: 'Phone must be in Belarus format: +375 (XX) XXX-XX-XX' };
    }
    return { isValid: true, message: '' };
}

async function validatePhoneExists(phone, userId) {
    try {
        const response = await fetch(`${API_URL}/users?phone=${encodeURIComponent(phone)}`);
        const users = await response.json();
        if (users.length > 0 && users[0].id !== Number(userId)) {
            return { isValid: false, message: 'Phone number already registered' };
        }
        return { isValid: true, message: '' };
    } catch (error) {
        console.error('Error checking phone:', error);
        return { isValid: false, message: 'Server error' };
    }
}

function validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Invalid email format' };
    }
    return { isValid: true, message: '' };
}

async function validateEmailExists(email, userId) {
    try {
        const response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
        const users = await response.json();
        if (users.length > 0 && users[0].id !== Number(userId)) {
            return { isValid: false, message: 'Email already registered' };
        }
        return { isValid: true, message: '' };
    } catch (error) {
        console.error('Error checking email:', error);
        return { isValid: false, message: 'Server error' };
    }
}

function validateNicknameFormat(nickname) {
    if (!nickname) {
        return { isValid: false, message: 'Nickname is required' };
    }
    return { isValid: true, message: '' };
}

async function validateNicknameExists(nickname, userId) {
    try {
        const response = await fetch(`${API_URL}/users?nickname=${encodeURIComponent(nickname)}`);
        const users = await response.json();
        if (users.length > 0 && users[0].id !== Number(userId)) {
            return { isValid: false, message: 'Nickname already taken' };
        }
        return { isValid: true, message: '' };
    } catch (error) {
        console.error('Error checking nickname:', error);
        return { isValid: false, message: 'Server error' };
    }
}

function validateBirthdate(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return { isValid: age - 1 >= 16, message: 'You must be at least 16 years old' };
    }
    return { isValid: age >= 16, message: '' };
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    if (!passwordRegex.test(password)) {
        return { isValid: false, message: 'Password must be 8-20 characters, include uppercase, lowercase, digit, and special character' };
    }
    if (commonPasswords.includes(password)) {
        return { isValid: false, message: 'Password is too common' };
    }
    return { isValid: true, message: '' };
}

async function validateForm() {
    const userId = localStorage.getItem('userId');
    let isValid = true;
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });

    const phoneValidation = validatePhoneFormat(phoneInput.value);
    if (!phoneValidation.isValid) {
        document.getElementById('phone-error').textContent = phoneValidation.message;
        isValid = false;
    }

    const emailValidation = validateEmailFormat(emailInput.value);
    if (!emailValidation.isValid) {
        document.getElementById('email-error').textContent = emailValidation.message;
        isValid = false;
    }

    const birthdateValidation = validateBirthdate(birthdateInput.value);
    if (!birthdateValidation.isValid) {
        document.getElementById('birthdate-error').textContent = birthdateValidation.message;
        isValid = false;
    }

    const passwordValidation = validatePassword(passwordInput.value);
    if (!passwordValidation.isValid) {
        document.getElementById('password-error').textContent = passwordValidation.message;
        isValid = false;
    }

    if (!firstNameInput.value.trim()) {
        document.getElementById('firstName-error').textContent = 'First name is required';
        isValid = false;
    }

    if (!lastNameInput.value.trim()) {
        document.getElementById('lastName-error').textContent = 'Last name is required';
        isValid = false;
    }

    const nicknameValidation = validateNicknameFormat(nicknameInput.value);
    if (!nicknameValidation.isValid) {
        document.getElementById('nickname-error').textContent = nicknameValidation.message;
        isValid = false;
    }

    submitButton.disabled = !isValid;
}

async function validateFormOnSubmit(userId) {
    let isValid = true;

    const phoneExistsValidation = await validatePhoneExists(phoneInput.value, userId);
    if (!phoneExistsValidation.isValid) {
        document.getElementById('phone-error').textContent = phoneExistsValidation.message;
        isValid = false;
    }

    const emailExistsValidation = await validateEmailExists(emailInput.value, userId);
    if (!emailExistsValidation.isValid) {
        document.getElementById('email-error').textContent = emailExistsValidation.message;
        isValid = false;
    }

    const nicknameExistsValidation = await validateNicknameExists(nicknameInput.value, userId);
    if (!nicknameExistsValidation.isValid) {
        document.getElementById('nickname-error').textContent = nicknameExistsValidation.message;
        isValid = false;
    }

    return isValid;
}

async function loadUserData() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const user = await response.json();
        phoneInput.value = user.phone;
        emailInput.value = user.email;
        birthdateInput.value = user.birthdate;
        passwordInput.value = user.password;
        firstNameInput.value = user.firstName;
        lastNameInput.value = user.lastName;
        middleNameInput.value = user.middleName || '';
        nicknameInput.value = user.nickname;
        validateForm();
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Failed to load user data');
        window.location.href = '../login/index.html';
    }
}

function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    window.location.href = '../login/index.html';
}

generatePasswordButton.addEventListener('click', () => {
    const password = generatePassword();
    passwordInput.value = password;
    validateForm();
});

regenerateNicknameButton.addEventListener('click', async () => {
    if (nicknameAttempts > 0 && firstNameInput.value && lastNameInput.value) {
        const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
        nicknameInput.value = nickname;
        nicknameAttempts--;
        nicknameAttemptsSpan.textContent = `Remaining nickname generation attempts: ${nicknameAttempts}`;
        if (nicknameAttempts === 0) {
            regenerateNicknameButton.disabled = true;
            nicknameInput.readOnly = false;
        }
        validateForm();
    }
});

firstNameInput.addEventListener('input', async () => {
    if (firstNameInput.value && lastNameInput.value && nicknameAttempts > 0 && !nicknameInput.value) {
        const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
        nicknameInput.value = nickname;
        validateForm();
    }
});

lastNameInput.addEventListener('input', async () => {
    if (firstNameInput.value && lastNameInput.value && nicknameAttempts > 0 && !nicknameInput.value) {
        const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
        nicknameInput.value = nickname;
        validateForm();
    }
});

form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', validateForm);
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    if (!submitButton.disabled) {
        const isValid = await validateFormOnSubmit(userId);
        if (!isValid) {
            submitButton.disabled = true;
            return;
        }

        const user = {
            phone: phoneInput.value,
            email: emailInput.value,
            birthdate: birthdateInput.value,
            password: passwordInput.value,
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            middleName: middleNameInput.value || '',
            nickname: nicknameInput.value,
            role: localStorage.getItem('role') || 'customer'
        };

        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            if (response.ok) {
                alert('Profile updated successfully!');
                nicknameAttempts = 5;
                nicknameAttemptsSpan.textContent = `Remaining nickname generation attempts: ${nicknameAttempts}`;
                regenerateNicknameButton.disabled = false;
                nicknameInput.readOnly = true;
                validateForm();
            } else {
                alert('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Server error');
        }
    }
});

logoutButton.addEventListener('click', logout);

document.addEventListener('DOMContentLoaded', () => {
    setInitialAttemptsText();
    setMaxBirthdate();
    nicknameInput.readOnly = true;
    loadUserData();
});