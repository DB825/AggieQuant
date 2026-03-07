/**
 * AggieQuant Website Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const nav = document.querySelector('.nav');

    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');

            // Toggle HTML icon
            const icon = mobileMenuBtn.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
                document.body.style.overflow = 'hidden'; // Stop background scrolling
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
                document.body.style.overflow = 'hidden';
                document.body.style.overflowY = 'auto'; // Restore
            }
        });

        // Close menu automatically on link click
        const navLinks = document.querySelectorAll('.nav-link, .nav .btn');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (nav.classList.contains('active')) {
                    mobileMenuBtn.click();
                }
            });
        });
    }

    // 1. Navigation Header Scroll Effect
    const header = document.querySelector('.header');

    const handleScroll = () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    // 2. Intersection Observer for scroll animations
    const animationObserverOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, animationObserverOptions);

    const animatedElements = document.querySelectorAll('.fade-up, .reveal');
    animatedElements.forEach(el => {
        animationObserver.observe(el);
    });

    // 3. Trigger immediate animations for Hero section elements visible on load
    setTimeout(() => {
        const heroElements = document.querySelectorAll('.hero .fade-up, .hero .reveal');
        heroElements.forEach(el => {
            el.classList.add('visible');
        });
    }, 150);
    // 4. File Upload UI Feedback (Apply Page)
    const fileInput = document.getElementById('resume');
    const successMsg = document.getElementById('resume-success-msg');
    const fileNameSpan = document.getElementById('attached-file-name');
    const formErrorMsg = document.getElementById('form-error-msg');
    const errorText = document.getElementById('error-text');

    if (fileInput && successMsg && fileNameSpan) {
        fileInput.addEventListener('change', (e) => {
            if (formErrorMsg) formErrorMsg.style.display = 'none';

            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];

                // Real-time limit check
                if (file.size > 4 * 1024 * 1024) {
                    if (formErrorMsg && errorText) {
                        errorText.textContent = 'Your resume exceeds the 4MB limit. Please upload a smaller PDF file.';
                        formErrorMsg.style.display = 'block';
                        fileInput.value = ''; // clear invalid file
                        successMsg.style.display = 'none';
                        return;
                    }
                }

                const fileName = file.name;
                fileNameSpan.textContent = fileName;
                successMsg.style.display = 'block';
            } else {
                successMsg.style.display = 'none';
            }
        });
    }

    // 5. Custom Form Validation (Apply Page)
    const applyForm = document.querySelector('.apply-form');

    if (applyForm) {
        applyForm.setAttribute('novalidate', true);

        applyForm.addEventListener('submit', function (e) {
            let isValid = true;
            let errorMessage = '';

            const gpaInput = document.getElementById('gpa');

            // Reset error
            if (formErrorMsg) formErrorMsg.style.display = 'none';

            // 1. Check basic required fields and formats
            const requiredFields = applyForm.querySelectorAll('[required]');
            for (let i = 0; i < requiredFields.length; i++) {
                const field = requiredFields[i];

                let fieldName = field.name;
                if (field.id) {
                    const label = document.querySelector(`label[for="${field.id}"]`);
                    if (label) {
                        // Strip out asterisks and generic text
                        fieldName = label.textContent.replace('*', '').replace('(PDF only)', '').trim();
                    }
                } else if (field.type === 'radio') {
                    fieldName = 'Track Preference';
                }

                if (field.type === 'radio') {
                    const radioGroup = applyForm.querySelectorAll(`input[name="${field.name}"]`);
                    const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                    if (!isChecked) {
                        isValid = false;
                        errorMessage = `Please select a ${fieldName}.`;
                        break;
                    }
                } else if (field.type === 'file') {
                    if (!field.files || field.files.length === 0) {
                        isValid = false;
                        errorMessage = `The field "${fieldName}" is required.`;
                        break;
                    }
                } else if (!field.value.trim()) {
                    isValid = false;
                    errorMessage = `The field "${fieldName}" is required.`;
                    break;
                } else if (field.type === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(field.value.trim())) {
                        isValid = false;
                        errorMessage = `Please enter a valid email address for "${fieldName}".`;
                        break;
                    }
                }
            }

            // 2. Specific validations
            if (isValid && gpaInput) {
                const gpaValue = parseFloat(gpaInput.value);
                if (isNaN(gpaValue) || gpaValue < 0.0 || gpaValue > 4.0) {
                    isValid = false;
                    errorMessage = 'GPA must be a valid decimal number between 0.00 and 4.00.';
                }
            }

            if (isValid && fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                    isValid = false;
                    errorMessage = 'Incorrect file type. Please submit your resume in PDF format only.';
                } else if (file.size > 4 * 1024 * 1024) { // 4MB limit
                    isValid = false;
                    errorMessage = 'Your resume exceeds the 4MB limit. Please upload a smaller PDF file.';
                }
            }

            if (!isValid) {
                e.preventDefault(); // Stop submission
                if (formErrorMsg && errorText) {
                    errorText.textContent = errorMessage;
                    formErrorMsg.style.display = 'block';
                    formErrorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    alert(errorMessage);
                }
            }
        });
    }

});
