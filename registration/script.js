const API_URL = 'http://localhost:3000';
const commonPasswords = [
    'Password123!', 'Qwerty123$', 'Admin2024#', '12345678aA!',
    'Password2024!', 'Qwertyuiop1@', 'Welcome123#', 'Secret2024$'
];
const suffixes = ['Star', 'Light', 'Glow', 'Spark', 'Flame'];

const touched = {
    phone: false, email: false, birthdate: false, password: false,
    passwordConfirm: false, firstName: false, lastName: false, nickname: false, agreement: false
};

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

async function setInitialAttemptsText() {
    const translations = await loadTranslations('registration');
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

    const exists = await validateNicknameExists(nickname);
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

async function validatePhoneExists(phone, translations) {
    try {
        const response = await fetch(`${API_URL}/users?phone=${encodeURIComponent(phone)}`);
        const users = await response.json();
        if (users.length > 0) {
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

async function validateEmailExists(email, translations) {
    try {
        const response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
        const users = await response.json();
        if (users.length > 0) {
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

async function validateNicknameExists(nickname, translations) {
    try {
        const response = await fetch(`${API_URL}/users?nickname=${encodeURIComponent(nickname)}`);
        const users = await response.json();
        if (users.length > 0) {
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
    if (!form || !phoneInput || !emailInput || !birthdateInput || !passwordInput || !passwordConfirmInput ||
        !firstNameInput || !lastNameInput || !nicknameInput || !agreementCheckbox || !submitButton) {
        console.error('Missing DOM elements');
        setTimeout(validateForm, 100);
        return;
    }

    const translations = await loadTranslations('registration');
    let isValid = true;
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });

    if (touched.phone) {
        const phoneFormatValidation = await validatePhoneFormat(phoneInput.value, translations);
        if (!phoneFormatValidation.isValid) {
            document.getElementById('phone-error').textContent = phoneFormatValidation.message;
            isValid = false;
        } else {
            const phoneExistsValidation = await validatePhoneExists(phoneInput.value, translations);
            if (!phoneExistsValidation.isValid) {
                document.getElementById('phone-error').textContent = phoneExistsValidation.message;
                isValid = false;
            }
        }
    }

    if (touched.email) {
        const emailFormatValidation = await validateEmailFormat(emailInput.value, translations);
        if (!emailFormatValidation.isValid) {
            document.getElementById('email-error').textContent = emailFormatValidation.message;
            isValid = false;
        } else {
            const emailExistsValidation = await validateEmailExists(emailInput.value, translations);
            if (!emailExistsValidation.isValid) {
                document.getElementById('email-error').textContent = emailExistsValidation.message;
                isValid = false;
            }
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

    if (touched.passwordConfirm && passwordInput.value !== passwordConfirmInput.value) {
        document.getElementById('password-confirm-error').textContent = translations.password_mismatch;
        isValid = false;
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
        const nicknameFormatValidation = await validateNicknameFormat(nicknameInput.value, translations);
        if (!nicknameFormatValidation.isValid) {
            document.getElementById('nickname-error').textContent = nicknameFormatValidation.message;
            isValid = false;
        } else {
            const nicknameExistsValidation = await validateNicknameExists(nicknameInput.value, translations);
            if (!nicknameExistsValidation.isValid) {
                document.getElementById('nickname-error').textContent = nicknameExistsValidation.message;
                isValid = false;
            }
        }
    }

    if (touched.agreement && !agreementCheckbox.checked) {
        document.getElementById('agreement-error').textContent = translations.agreement_required;
        isValid = false;
    }

    submitButton.disabled = !isValid || !phoneInput.value || !emailInput.value || !birthdateInput.value ||
                           !passwordInput.value || !passwordConfirmInput.value || !firstNameInput.value ||
                           !lastNameInput.value || !nicknameInput.value || !agreementCheckbox.checked;

    console.log('Applying translations for registration form');
    window.applyTranslations && window.applyTranslations(await loadTranslations('registration'), document);
}

const debouncedValidateForm = debounce(validateForm, 500);

async function initRegistrationForm() {
    if (!form || !phoneInput || !emailInput || !birthdateInput || !passwordInput || !passwordConfirmInput ||
        !firstNameInput || !lastNameInput || !nicknameInput || !agreementCheckbox || !submitButton ||
        !generatePasswordButton || !regenerateNicknameButton || !agreementLink || !modal ||
        !agreementText || !confirmAgreementButton || !closeModalButton) {
        console.error('Missing DOM elements');
        setTimeout(initRegistrationForm, 100);
        return;
    }

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
            touched.agreement = true;
            modal.style.display = 'none';
            debouncedValidateForm();
        }
    });

    agreementCheckbox.addEventListener('click', (e) => {
        if (agreementCheckbox.disabled) {
            e.preventDefault();
        } else {
            touched.agreement = true;
            debouncedValidateForm();
        }
    });

    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            touched[input.id] = true;
            debouncedValidateForm();
        });
        input.addEventListener('blur', () => {
            touched[input.id] = true;
            debouncedValidateForm();
        });
    });

    generatePasswordButton.addEventListener('click', () => {
        const password = generatePassword();
        passwordInput.value = password;
        passwordConfirmInput.value = password;
        touched.password = true;
        touched.passwordConfirm = true;
        debouncedValidateForm();
    });

    regenerateNicknameButton.addEventListener('click', async () => {
        if (nicknameAttempts > 0 && firstNameInput.value && lastNameInput.value) {
            const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
            nicknameInput.value = nickname;
            nicknameAttempts--;
            const translations = await loadTranslations('registration');
            nicknameAttemptsSpan.textContent = translations.nickname_attempts.replace('{attempts}', nicknameAttempts);
            if (nicknameAttempts === 0) {
                regenerateNicknameButton.disabled = true;
                nicknameInput.readOnly = false;
            }
            touched.nickname = true;
            debouncedValidateForm();
        }
    });

    firstNameInput.addEventListener('input', async () => {
        touched.firstName = true;
        if (firstNameInput.value && lastNameInput.value && nicknameAttempts > 0 && !nicknameInput.value) {
            const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
            nicknameInput.value = nickname;
            touched.nickname = true;
            debouncedValidateForm();
        }
        debouncedValidateForm();
    });

    lastNameInput.addEventListener('input', async () => {
        touched.lastName = true;
        if (firstNameInput.value && lastNameInput.value && nicknameAttempts > 0 && !nicknameInput.value) {
            const nickname = await generateNickname(firstNameInput.value, lastNameInput.value);
            nicknameInput.value = nickname;
            touched.nickname = true;
            debouncedValidateForm();
        }
        debouncedValidateForm();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!submitButton.disabled) {
            await validateForm();
            if (submitButton.disabled) return;

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

                const translations = await loadTranslations('registration');
                if (response.ok) {
                    alert(translations.success_message);
                    form.reset();
                    nicknameAttempts = 5;
                    nicknameAttemptsSpan.textContent = translations.nickname_attempts.replace('{attempts}', nicknameAttempts);
                    regenerateNicknameButton.disabled = false;
                    agreementCheckbox.disabled = true;
                    nicknameInput.readOnly = true;
                    setMaxBirthdate();
                    Object.keys(touched).forEach(key => touched[key] = false);
                    window.location.href = '../login/index.html';
                } else {
                    alert(translations.error_message);
                }
            } catch (error) {
                console.error('Server error:', error);
                const translations = await loadTranslations('registration');
                alert(translations.server_error);
            }
        }
    });

    const lang = localStorage.getItem('lang') || 'en';
    console.log('Applying initial translations for registration form');
    window.applyTranslations && window.applyTranslations(await loadTranslations('registration', lang), document);
    submitButton.disabled = true;
    setInitialAttemptsText();
    setMaxBirthdate();
    nicknameInput.readOnly = true;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initializing registration form');
    (async () => {
        await initRegistrationForm();
    })();
});