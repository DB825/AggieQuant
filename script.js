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

    if (fileInput && successMsg && fileNameSpan) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const fileName = e.target.files[0].name;
                fileNameSpan.textContent = fileName;
                successMsg.style.display = 'block';
            } else {
                successMsg.style.display = 'none';
            }
        });
    }

    // 5. Custom Form Validation (Apply Page)
    const applyForm = document.querySelector('.apply-form');
    const formErrorMsg = document.getElementById('form-error-msg');
    const errorText = document.getElementById('error-text');

    if (applyForm) {
        applyForm.addEventListener('submit', function (e) {
            let isValid = true;
            let errorMessage = '';

            const gpaInput = document.getElementById('gpa');
            const fileInput = document.getElementById('resume');

            // Reset error
            if (formErrorMsg) formErrorMsg.style.display = 'none';

            // Custom validation logic
            if (gpaInput) {
                const gpaValue = parseFloat(gpaInput.value);
                // HTML5 should already stop non-numbers, but this ensures ranges and decimal validity manually
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
                }
            } else if (isValid && (!fileInput || fileInput.files.length === 0)) {
                // If they bypassed the 'required' HTML attribute somehow
                isValid = false;
                errorMessage = 'Please attach your resume.';
            }

            if (!isValid) {
                e.preventDefault(); // Stop submission
                if (formErrorMsg && errorText) {
                    errorText.textContent = errorMessage;
                    formErrorMsg.style.display = 'block';
                    // Scroll to error
                    formErrorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    alert(errorMessage);
                }
            }
        });
    }

});
