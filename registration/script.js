const API_URL = 'http://localhost:3000';
const commonPasswords = [
    'Password123!', 'Qwerty123$', 'Admin2024#', '12345678aA!',
    'Password2024!', 'Qwertyuiop1@', 'Welcome123#', 'Secret2024$'
];
const suffixes = ['Star', 'Light', 'Glow', 'Spark', 'Flame'];

const form = document.getElementById('registration-form');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const birthdateInput = document.getElementById('birthdate');
const passwordInput = document.getElementById('password');
const generatePasswordButton = document.getElementById('generate-password');
const passwordConfirmInput = document.getElementById('password-confirm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const middleNameInput = document.getElementById('middleName');
const nicknameInput = document.getElementById('nickname');
const regenerateNicknameButton = document.getElementById('regenerate-nickname');
const nicknameAttemptsSpan = document.getElementById('nickname-attempts');
const agreementCheckbox = document.getElementById('agreement');
const agreementLink = document.getElementById('agreement-link');
const submitButton = document.getElementById('submit-button');
const modal = document.getElementById('agreement-modal');
const agreementText = document.getElementById('agreement-text');
const confirmAgreementButton = document.getElementById('confirm-agreement');
const closeModalButton = document.getElementById('close-modal');
let nicknameAttempts = 5;

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setInitialAttemptsText() {
    nicknameAttemptsSpan.textContent = `Осталось попыток генерации ника: ${nicknameAttempts}`;
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
        return { isValid: false, message: 'Телефон должен быть в формате: +375 (XX) XXX-XX-XX' };
    }
    return { isValid: true, message: '' };
}

async function validatePhoneExists(phone) {
    try {
        const response = await fetch(`${API_URL}/users?phone=${encodeURIComponent(phone)}`);
        const users = await response.json();
        if (users.length > 0) {
            return { isValid: false, message: 'Этот номер телефона уже зарегистрирован' };
        }
        return { isValid: true, message: '' };
    } catch (error) {
        console.error('Ошибка при проверке телефона:', error);
        return { isValid: false, message: 'Ошибка сервера' };
    }
}

function validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Неверный формат email' };
    }
    return { isValid: true, message: '' };
}

async function validateEmailExists(email) {
    try {
        const response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
        const users = await response.json();
        if (users.length > 0) {
            return { isValid: false, message: 'Этот email уже зарегистрирован' };
        }
        return { isValid: true, message: '' };
    } catch (error) {
        console.error('Ошибка при проверке email:', error);
        return { isValid: false, message: 'Ошибка сервера' };
    }
}

function validateNicknameFormat(nickname) {
    if (!nickname) {
        return { isValid: false, message: 'Никнейм обязателен' };
    }
    return { isValid: true, message: '' };
}

async function validateNicknameExists(nickname) {
    try {
        const response = await fetch(`${API_URL}/users?nickname=${encodeURIComponent(nickname)}`);
        const users = await response.json();
        if (users.length > 0) {
            return { isValid: false, message: 'Этот никнейм уже занят' };
        }
        return { isValid: true, message: '' };
    } catch (error) {
        console.error('Ошибка при проверке никнейма:', error);
        return { isValid: false, message: 'Ошибка сервера' };
    }
}

function validateBirthdate(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return { isValid: age - 1 >= 16, message: 'Вам должно быть не менее 16 лет' };
    }
    return { isValid: age >= 16, message: '' };
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    if (!passwordRegex.test(password)) {
        return { isValid: false, message: 'Пароль должен быть 8-20 символов, включать заглавные и строчные буквы, цифры и специальные символы' };
    }
    if (commonPasswords.includes(password)) {
        return { isValid: false, message: 'Пароль слишком распространён' };
    }
    return { isValid: true, message: '' };
}

async function validateForm() {
    let isValid = true;
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });

    const phoneFormatValidation = validatePhoneFormat(phoneInput.value);
    if (!phoneFormatValidation.isValid) {
        document.getElementById('phone-error').textContent = phoneFormatValidation.message;
        isValid = false;
    } else {
        const phoneExistsValidation = await validatePhoneExists(phoneInput.value);
        if (!phoneExistsValidation.isValid) {
            document.getElementById('phone-error').textContent = phoneExistsValidation.message;
            isValid = false;
        }
    }

    const emailFormatValidation = validateEmailFormat(emailInput.value);
    if (!emailFormatValidation.isValid) {
        document.getElementById('email-error').textContent = emailFormatValidation.message;
        isValid = false;
    } else {
        const emailExistsValidation = await validateEmailExists(emailInput.value);
        if (!emailExistsValidation.isValid) {
            document.getElementById('email-error').textContent = emailExistsValidation.message;
            isValid = false;
        }
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
    if (passwordInput.value !== passwordConfirmInput.value) {
        document.getElementById('password-confirm-error').textContent = 'Пароли не совпадают';
        isValid = false;
    }

    if (!firstNameInput.value.trim()) {
        document.getElementById('firstName-error').textContent = 'Имя обязательно';
        isValid = false;
    }

    if (!lastNameInput.value.trim()) {
        document.getElementById('lastName-error').textContent = 'Фамилия обязательна';
        isValid = false;
    }

    const nicknameFormatValidation = validateNicknameFormat(nicknameInput.value);
    if (!nicknameFormatValidation.isValid) {
        document.getElementById('nickname-error').textContent = nicknameFormatValidation.message;
        isValid = false;
    } else {
        const nicknameExistsValidation = await validateNicknameExists(nicknameInput.value);
        if (!nicknameExistsValidation.isValid) {
            document.getElementById('nickname-error').textContent = nicknameExistsValidation.message;
            isValid = false;
        }
    }

    if (!agreementCheckbox.checked) {
        document.getElementById('agreement-error').textContent = 'Вы должны принять пользовательское соглашение';
        isValid = false;
    }

    submitButton.disabled = !isValid;
}

const debouncedValidateForm = debounce(validateForm, 500);

agreementText.addEventListener('scroll', () => {
    if (agreementText.scrollTop + agreementText.clientHeight >= agreementText.scrollHeight - 5) {
        confirmAgreementButton.disabled = false;
    }
});

agreementLink.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'flex';
});

closeModalButton.addEventListener('click', () => {
    modal.style.display = 'none';
    confirmAgreementButton.disabled = true;
});

confirmAgreementButton.addEventListener('click', () => {
    if (!confirmAgreementButton.disabled) {
        agreementCheckbox.disabled = false;
        agreementCheckbox.checked = true;
        modal.style.display = 'none';
        debouncedValidateForm();
    }
});

agreementCheckbox.addEventListener('click', (e) => {
    if (agreementCheckbox.disabled) {
        e.preventDefault();
    }
});

form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', debouncedValidateForm);
});

generatePasswordButton.addEventListener('click', () => {
    const password = generatePassword();
    passwordInput.value = password;
    passwordConfirmInput.value = password;
    debouncedValidateForm();
});

regenerateNicknameButton.addEventListener('click', async () => {
    if (nicknameAttempts > 0 && firstNameInput.value && lastNameInput.value) {
        const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
        nicknameInput.value = nickname;
        nicknameAttempts--;
        nicknameAttemptsSpan.textContent = `Осталось попыток генерации ника: ${nicknameAttempts}`;
        if (nicknameAttempts === 0) {
            regenerateNicknameButton.disabled = true;
            nicknameInput.readOnly = false;
        }
        debouncedValidateForm();
    }
});

firstNameInput.addEventListener('input', async () => {
    if (firstNameInput.value && lastNameInput.value && nicknameAttempts > 0 && !nicknameInput.value) {
        const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
        nicknameInput.value = nickname;
        debouncedValidateForm();
    }
});

lastNameInput.addEventListener('input', async () => {
    if (firstNameInput.value && lastNameInput.value && nicknameAttempts > 0 && !nicknameInput.value) {
        const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
        nicknameInput.value = nickname;
        debouncedValidateForm();
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!submitButton.disabled) {
        const isValid = await validateForm();
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
            role: 'customer'
        };

        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            if (response.ok) {
                alert('Регистрация успешна!');
                form.reset();
                nicknameAttempts = 5;
                nicknameAttemptsSpan.textContent = `Осталось попыток генерации ника: ${nicknameAttempts}`;
                regenerateNicknameButton.disabled = false;
                agreementCheckbox.disabled = true;
                nicknameInput.readOnly = true;
                setMaxBirthdate();
                window.location.href = '../login/index.html';
            } else {
                alert('Ошибка регистрации');
            }
        } catch (error) {
            console.error('Ошибка сервера:', error);
            alert('Ошибка сервера');
        }
    }
});

setInitialAttemptsText();
setMaxBirthdate();
nicknameInput.readOnly = true;