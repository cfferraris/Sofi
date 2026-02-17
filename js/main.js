// ========================================
// PIEL DE MAR - Main JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    // ========================================
    // ELEMENTOS DEL DOM
    // ========================================
    const hero          = document.getElementById('hero');
    const logoContainer = document.querySelector('.logo-container');
    const mainLogo      = document.getElementById('mainLogo');
    const navbar        = document.getElementById('navbar');
    const mainContent   = document.getElementById('mainContent');
    const menuToggle    = document.getElementById('menuToggle');
    const navMenu       = document.getElementById('navMenu');
    const navLinks      = document.querySelectorAll('.nav-link');

    // ========================================
    // INICIALIZAR LUCIDE ICONS
    // (primero para que los íconos estén listos
    //  antes de cualquier interacción)
    // ========================================
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ========================================
    // PREVENIR SCROLL DURANTE EL HERO
    // ========================================
    document.body.style.overflow = 'hidden';

    // ========================================
    // TRANSICIÓN DEL HERO
    // ========================================
    let transitionTriggered = false;
    let transitionTimer     = null;

    function triggerTransition() {
        if (transitionTriggered) return;
        transitionTriggered = true;

        clearTimeout(transitionTimer);

        // 1. Logo anima hacia la esquina
        logoContainer.classList.add('transitioning');

        // 2. Fade out del logo principal
        setTimeout(() => {
            mainLogo.classList.add('morphing');
        }, 600);

        // 3. Navbar aparece
        setTimeout(() => {
            navbar.classList.add('visible');
        }, 1000);

        // 4. Contenido principal aparece
        setTimeout(() => {
            mainContent.classList.add('visible');
        }, 1300);

        // 5. Ocultar hero, habilitar scroll, ajustar secciones
        setTimeout(() => {
            hero.style.display = 'none';
            document.body.style.overflow = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            adjustSplitSections();
        }, 1500);
    }

    // Clic en el hero activa la transición
    hero.addEventListener('click', triggerTransition);

    // Automático después de 5 segundos
    transitionTimer = setTimeout(triggerTransition, 5000);

    // ========================================
    // MENÚ HAMBURGUESA (MOBILE)
    // ========================================
    function closeMenu() {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    }

    menuToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            closeMenu();
        }
    });

    // ========================================
    // SMOOTH SCROLL PARA NAVEGACIÓN
    // ========================================
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Solo manejar enlaces internos (#)
            if (!href || !href.startsWith('#')) return;

            e.preventDefault();
            closeMenu();

            if (href === '#piel-de-mar') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const target = document.querySelector(href);
            if (!target) return;

            const offset = target.getBoundingClientRect().top
                         + window.scrollY
                         - navbar.offsetHeight;

            window.scrollTo({ top: offset, behavior: 'smooth' });
        });
    });

    // ========================================
    // SOMBRA DEL NAVBAR AL HACER SCROLL
    // ========================================
    window.addEventListener('scroll', () => {
        navbar.style.boxShadow = window.scrollY > 100
            ? '0 4px 20px rgba(5, 73, 84, 0.1)'
            : 'none';
    }, { passive: true });

    // ========================================
    // ANIMACIÓN DE ENTRADA (INTERSECTION OBSERVER)
    // ========================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity    = '1';
                entry.target.style.transform  = 'translateY(0)';
                observer.unobserve(entry.target); // Animar solo una vez
            }
        });
    }, {
        threshold:   0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    document.querySelectorAll('.service-card, .tu-hijo-y-vos-card').forEach(card => {
        card.style.opacity    = '0';
        card.style.transform  = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // ========================================
    // CARRUSEL DE TESTIMONIOS
    // ========================================
    const track         = document.getElementById('carouselTrack');
    const prevBtn       = document.getElementById('prevBtn');
    const nextBtn       = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('carouselDots');

    if (track && prevBtn && nextBtn && dotsContainer) {
        const cards       = Array.from(track.querySelectorAll('.testimonio-card'));
        let currentIndex  = 0;
        let visibleCards  = getVisibleCards();
        let autoPlay      = null;

        // Crear dots
        function buildDots() {
            dotsContainer.innerHTML = '';
            const total = cards.length - visibleCards + 1;
            for (let i = 0; i < total; i++) {
                const dot = document.createElement('button');
                dot.classList.add('carousel-dot');
                dot.setAttribute('aria-label', `Testimonio ${i + 1}`);
                dot.setAttribute('role', 'tab');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }
        }

        function getVisibleCards() {
            if (window.innerWidth <= 768)  return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }

        function getCardWidth() {
            // Gap es 0 según CSS, pero lo leemos dinámicamente por si cambia
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            return cards[0].offsetWidth + gap;
        }

        function updateDots() {
            dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
                dot.setAttribute('aria-selected', i === currentIndex);
            });
        }

        function updateButtons() {
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= cards.length - visibleCards;
        }

        function goToSlide(index) {
            const maxIndex   = cards.length - visibleCards;
            currentIndex     = Math.max(0, Math.min(index, maxIndex));
            track.style.transform = `translateX(-${currentIndex * getCardWidth()}px)`;
            updateDots();
            updateButtons();
        }

        function startAutoPlay() {
            stopAutoPlay();
            autoPlay = setInterval(() => {
                const maxIndex = cards.length - visibleCards;
                goToSlide(currentIndex < maxIndex ? currentIndex + 1 : 0);
            }, 5000);
        }

        function stopAutoPlay() {
            clearInterval(autoPlay);
        }

        prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
        nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

        track.addEventListener('mouseenter', stopAutoPlay);
        track.addEventListener('mouseleave', startAutoPlay);

        // Soporte táctil (swipe)
        let touchStartX = 0;
        track.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            stopAutoPlay();
        }, { passive: true });
        track.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                goToSlide(diff > 0 ? currentIndex + 1 : currentIndex - 1);
            }
            startAutoPlay();
        }, { passive: true });

        // Recalcular en resize (con debounce para no disparar en cada pixel)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                visibleCards = getVisibleCards();
                buildDots();
                goToSlide(0);
                adjustSplitSections();
            }, 150);
        });

        // Inicializar
        buildDots();
        updateButtons();
        startAutoPlay();
    }

    // ========================================
    // AJUSTE DINÁMICO DE SECCIONES PARTIDAS
    // (Servicios + Testimonios = 1 pantalla)
    // ========================================
    function adjustSplitSections() {
        const sections = document.querySelectorAll('.service-section, .testimonios-section');

        if (window.innerWidth <= 768) {
            sections.forEach(s => s.style.minHeight = '');
            return;
        }

        const halfHeight = (window.innerHeight - navbar.offsetHeight) / 2;
        sections.forEach(s => s.style.minHeight = `${halfHeight}px`);
    }

});