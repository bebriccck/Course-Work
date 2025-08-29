const API_URL = 'http://localhost:3000';
const commonPasswords = [
    'Password123!', 'Qwerty123$', 'Admin2024#', '12345678aA!',
    'Password2024!', 'Qwertyuiop1@', 'Welcome123#', 'Secret2024$'
];
const suffixes = ['Star', 'Light', 'Glow', 'Spark', 'Flame'];

const touched = {
    phone: false, email: false, birthdate: false, password: false,
    firstName: false, lastName: false, nickname: false
};

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

async function loadTranslations(file, lang = localStorage.getItem('lang') || 'en') {
    try {
        const response = await fetch(`../translates/${lang}/${file}.json`);
        if (!response.ok) throw new Error(`Failed to load ${file}.json for ${lang}`);
        return await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
        return {};
    }
}

async function setInitialAttemptsText() {
    const translations = await loadTranslations('profile');
    nicknameAttemptsSpan.textContent = translations.nickname_attempts.replace('{attempts}', nicknameAttempts);
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

    const exists = await validateNicknameExists(nickname, localStorage.getItem('userId'));
    if (!exists.isValid && nicknameAttempts > 0) {
        return generateNickname(firstName, lastName);
    }
    return nickname;
}

async function validatePhoneFormat(phone, translations) {
    const phoneRegex = /^\+375\s?\(?(?:29|33|44|25)\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    if (!phoneRegex.test(phone)) {
        return { isValid: false, message: translations.phone_invalid_format };
    }
    return { isValid: true, message: '' };
}

async function validatePhoneExists(phone, userId, translations) {
    try {
        const response = await fetch(`${API_URL}/users?phone=${encodeURIComponent(phone)}`);
        const users = await response.json();
        if (users.length > 0 && users[0].id !== Number(userId)) {
            return { isValid: false, message: translations.phone_exists };
        }
        return { isValid: true, message: '' };
    } catch (error) {
        console.error('Error checking phone:', error);
        return { isValid: false, message: translations.server_error };
    }
}

async function validateEmailFormat(email, translations) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, message: translations.email_invalid_format };
    }
    return { isValid: true, message: '' };
}

async function validateEmailExists(email, userId, translations) {
    try {
        const response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
        const users = await response.json();
        if (users.length > 0 && users[0].id !== Number(userId)) {
            return { isValid: false, message: translations.email_exists };
        }
        return { isValid: true, message: '' };
    } catch (error) {
        console.error('Error checking email:', error);
        return { isValid: false, message: translations.server_error };
    }
}

async function validateNicknameFormat(nickname, translations) {
    if (!nickname) {
        return { isValid: false, message: translations.nickname_required };
    }
    return { isValid: true, message: '' };
}

async function validateNicknameExists(nickname, userId, translations) {
    try {
        const response = await fetch(`${API_URL}/users?nickname=${encodeURIComponent(nickname)}`);
        const users = await response.json();
        if (users.length > 0 && users[0].id !== Number(userId)) {
            return { isValid: false, message: translations.nickname_exists };
        }
        return { isValid: true, message: '' };
    } catch (error) {
        console.error('Error checking nickname:', error);
        return { isValid: false, message: translations.server_error };
    }
}

async function validateBirthdate(birthdate, translations) {
    const today = new Date();
    const birth = new Date(birthdate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return { isValid: age - 1 >= 16, message: translations.birthdate_too_young };
    }
    return { isValid: age >= 16, message: '' };
}

async function validatePassword(password, translations) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    if (!passwordRegex.test(password)) {
        return { isValid: false, message: translations.password_invalid_format };
    }
    if (commonPasswords.includes(password)) {
        return { isValid: false, message: translations.password_too_common };
    }
    return { isValid: true, message: '' };
}

async function validateForm() {
    if (!form || !phoneInput || !emailInput || !birthdateInput || !passwordInput ||
        !firstNameInput || !lastNameInput || !nicknameInput || !submitButton ||
        !generatePasswordButton || !regenerateNicknameButton || !logoutButton) {
        console.error('Missing DOM elements');
        setTimeout(validateForm, 100);
        return;
    }

    const translations = await loadTranslations('profile');
    const userId = localStorage.getItem('userId');
    let isValid = true;
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });

    if (touched.phone) {
        const phoneValidation = await validatePhoneFormat(phoneInput.value, translations);
        if (!phoneValidation.isValid) {
            document.getElementById('phone-error').textContent = phoneValidation.message;
            isValid = false;
        }
    }

    if (touched.email) {
        const emailValidation = await validateEmailFormat(emailInput.value, translations);
        if (!emailValidation.isValid) {
            document.getElementById('email-error').textContent = emailValidation.message;
            isValid = false;
        }
    }

    if (touched.birthdate) {
        const birthdateValidation = await validateBirthdate(birthdateInput.value, translations);
        if (!birthdateValidation.isValid) {
            document.getElementById('birthdate-error').textContent = birthdateValidation.message;
            isValid = false;
        }
    }

    if (touched.password) {
        const passwordValidation = await validatePassword(passwordInput.value, translations);
        if (!passwordValidation.isValid) {
            document.getElementById('password-error').textContent = passwordValidation.message;
            isValid = false;
        }
    }

    if (touched.firstName && !firstNameInput.value.trim()) {
        document.getElementById('firstName-error').textContent = translations.firstName_required;
        isValid = false;
    }

    if (touched.lastName && !lastNameInput.value.trim()) {
        document.getElementById('lastName-error').textContent = translations.lastName_required;
        isValid = false;
    }

    if (touched.nickname) {
        const nicknameValidation = await validateNicknameFormat(nicknameInput.value, translations);
        if (!nicknameValidation.isValid) {
            document.getElementById('nickname-error').textContent = nicknameValidation.message;
            isValid = false;
        }
    }

    submitButton.disabled = !isValid || !phoneInput.value || !emailInput.value || !birthdateInput.value ||
                           !passwordInput.value || !firstNameInput.value || !lastNameInput.value || !nicknameInput.value;

    console.log('Applying translations for profile form');
    window.applyTranslations && window.applyTranslations(await loadTranslations('profile'), document);
}

async function validateFormOnSubmit(userId) {
    const translations = await loadTranslations('profile');
    let isValid = true;

    const phoneExistsValidation = await validatePhoneExists(phoneInput.value, userId, translations);
    if (!phoneExistsValidation.isValid) {
        document.getElementById('phone-error').textContent = phoneExistsValidation.message;
        isValid = false;
    }

    const emailExistsValidation = await validateEmailExists(emailInput.value, userId, translations);
    if (!emailExistsValidation.isValid) {
        document.getElementById('email-error').textContent = emailExistsValidation.message;
        isValid = false;
    }

    const nicknameExistsValidation = await validateNicknameExists(nicknameInput.value, userId, translations);
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
        phoneInput.value = user.phone || '';
        emailInput.value = user.email || '';
        birthdateInput.value = user.birthdate || '';
        passwordInput.value = user.password || '';
        firstNameInput.value = user.firstName || '';
        lastNameInput.value = user.lastName || '';
        middleNameInput.value = user.middleName || '';
        nicknameInput.value = user.nickname || '';
    } catch (error) {
        console.error('Error loading user data:', error);
        const translations = await loadTranslations('profile');
        alert(translations.load_error);
        window.location.href = '../login/index.html';
    }
}

function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    window.location.href = '../login/index.html';
}

async function initProfileForm() {
    if (!form || !phoneInput || !emailInput || !birthdateInput || !passwordInput ||
        !firstNameInput || !lastNameInput || !nicknameInput || !submitButton ||
        !generatePasswordButton || !regenerateNicknameButton || !logoutButton) {
        console.error('Missing DOM elements');
        setTimeout(initProfileForm, 100);
        return;
    }

    generatePasswordButton.addEventListener('click', () => {
        const password = generatePassword();
        passwordInput.value = password;
        touched.password = true;
        validateForm();
    });

    regenerateNicknameButton.addEventListener('click', async () => {
        if (nicknameAttempts > 0 && firstNameInput.value && lastNameInput.value) {
            const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
            nicknameInput.value = nickname;
            nicknameAttempts--;
            const translations = await loadTranslations('profile');
            nicknameAttemptsSpan.textContent = translations.nickname_attempts.replace('{attempts}', nicknameAttempts);
            if (nicknameAttempts === 0) {
                regenerateNicknameButton.disabled = true;
                nicknameInput.readOnly = false;
            }
            touched.nickname = true;
            validateForm();
        }
    });

    firstNameInput.addEventListener('input', async () => {
        touched.firstName = true;
        if (firstNameInput.value && lastNameInput.value && nicknameAttempts > 0 && !nicknameInput.value) {
            const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
            nicknameInput.value = nickname;
            touched.nickname = true;
        }
        validateForm();
    });

    lastNameInput.addEventListener('input', async () => {
        touched.lastName = true;
        if (firstNameInput.value && lastNameInput.value && nicknameAttempts > 0 && !nicknameInput.value) {
            const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
            nicknameInput.value = nickname;
            touched.nickname = true;
        }
        validateForm();
    });

    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            touched[input.id] = true;
            validateForm();
        });
        input.addEventListener('blur', () => {
            touched[input.id] = true;
            validateForm();
        });
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
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });

                const translations = await loadTranslations('profile');
                if (response.ok) {
                    alert(translations.success_message);
                    nicknameAttempts = 5;
                    nicknameAttemptsSpan.textContent = translations.nickname_attempts.replace('{attempts}', nicknameAttempts);
                    regenerateNicknameButton.disabled = false;
                    nicknameInput.readOnly = true;
                    Object.keys(touched).forEach(key => touched[key] = false);
                    validateForm();
                } else {
                    alert(translations.error_message);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                const translations = await loadTranslations('profile');
                alert(translations.server_error);
            }
        }
    });

    logoutButton.addEventListener('click', logout);
    const lang = localStorage.getItem('lang') || 'en';
    console.log('Applying initial translations for profile form');
    window.applyTranslations && window.applyTranslations(await loadTranslations('profile', lang), document);
    submitButton.disabled = true;
    setInitialAttemptsText();
    setMaxBirthdate();
    nicknameInput.readOnly = true;
    await loadUserData();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initializing profile form');
    (async () => {
        await initProfileForm();
    })();
});