// Email validation function with proper error handling
export const validateEmail = (email) => {
    if (!email) {
        return { isValid: false, message: "Please enter an email address." };
    }

    // Check if email contains @ symbol
    if (!email.includes('@')) {
        return { isValid: false, message: "Email must contain '@' symbol." };
    }

    const [localPart, domain] = email.split('@');

    // Check if both parts exist
    if (!localPart || !domain) {
        return { isValid: false, message: "Invalid email format." };
    }

    // Check minimum length for local part (username)
    if (localPart.length < 3) {
        return { isValid: false, message: "Email username must be at least 3 characters long." };
    }

    // Check if username starts with a number or special character
    if (/^[0-9._-]/.test(localPart)) {
        return { isValid: false, message: "Email username cannot start with a number or special character." };
    }

    // Check for domain parts
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
        return { isValid: false, message: "Invalid domain format." };
    }

    // Check domain part length
    if (domainParts[0].length < 2) {
        return { isValid: false, message: "Domain name is too short." };
    }

    // Validate top-level domain
    const validTopLevelDomains = [
        'com', 'net', 'org', 'edu', 'gov', 'mil', 'int',
        'info', 'biz', 'name', 'pro', 'museum', 'coop',
        'aero', 'asia', 'cat', 'jobs', 'mobi', 'tel',
        'travel', 'xyz', 'dev', 'app', 'io', 'co'
    ];

    const topLevelDomain = domainParts[domainParts.length - 1].toLowerCase();
    if (!validTopLevelDomains.includes(topLevelDomain)) {
        return { isValid: false, message: "Invalid or uncommon top-level domain." };
    }

    // Check length restrictions
    if (email.length > 254) {
        return { isValid: false, message: "Email address is too long." };
    }

    if (localPart.length > 64) {
        return { isValid: false, message: "Email username is too long." };
    }

    // Check for consecutive special characters
    if (/[._-]{2,}/.test(localPart)) {
        return { isValid: false, message: "Invalid email format: consecutive special characters not allowed." };
    }

    // Check for common email providers' minimum length
    const commonProviders = {
        'gmail.com': 3,
        'yahoo.com': 3,
        'hotmail.com': 3,
        'outlook.com': 3
    };

    if (commonProviders[domain.toLowerCase()] &&
        localPart.length < commonProviders[domain.toLowerCase()]) {
        return {
            isValid: false,
            message: `${domain} requires at least ${commonProviders[domain.toLowerCase()]} characters in username.`
        };
    }

    // Basic email regex pattern for final check
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        return { isValid: false, message: "Invalid email format." };
    }

    return { isValid: true, message: "" };
};