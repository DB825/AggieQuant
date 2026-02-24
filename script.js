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
});
