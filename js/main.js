// ========================================
// PIEL DE MAR - Main JavaScript v2 (Simplificado)
// Sin sistema de turnos ni Google Maps
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    // ========================================
    // CONFIGURACIÓN GENERAL (SIMPLIFICADA)
    // ========================================
    const CONFIG = {
        // Transición del hero
        HERO_AUTO_TRIGGER_MS:   5000,
        HERO_LOGO_MORPH_MS:      600,
        HERO_NAVBAR_SHOW_MS:    1000,
        HERO_CONTENT_SHOW_MS:   1300,
        HERO_HIDE_MS:           1500,

        // Carrusel
        CAROUSEL_AUTOPLAY_MS:   5000,
        CAROUSEL_RESIZE_DEBOUNCE: 150
    };

    // ========================================
    // UTILIDADES
    // ========================================

    /**
     * Muestra un mensaje de notificación accesible al usuario
     * en lugar de alert() bloqueante.
     */
    function showToast(message, type = 'success') {
        let toast = document.getElementById('pdm-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'pdm-toast';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            toast.style.cssText = `
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: ${type === 'error' ? '#c44' : '#054954'};
                color: #efefed;
                padding: 1rem 2rem;
                border-radius: 50px;
                font-family: 'Fahkwang', sans-serif;
                font-size: 1rem;
                z-index: 9999;
                box-shadow: 0 8px 30px rgba(5,73,84,0.3);
                transition: transform 0.4s ease;
                max-width: 90vw;
                text-align: center;
            `;
            document.body.appendChild(toast);
        }
        toast.style.background = type === 'error' ? '#c44' : '#054954';
        toast.textContent = message;
        toast.getBoundingClientRect();
        toast.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
        }, 4000);
    }

    // ========================================
    // INICIALIZAR LUCIDE ICONS
    // ========================================
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ========================================
    // ELEMENTOS DEL DOM — HERO Y NAVBAR
    // ========================================
    const hero           = document.getElementById('hero');
    const logoContainer  = document.querySelector('.logo-container');
    const mainLogo       = document.getElementById('mainLogo');
    const navbar         = document.getElementById('navbar');
    const mainContent    = document.getElementById('mainContent');
    const menuToggle     = document.getElementById('menuToggle');
    const navMenu        = document.getElementById('navMenu');
    const navLinks       = document.querySelectorAll('.nav-link');

    // ========================================
    // PREVENIR SCROLL DURANTE EL HERO
    // ========================================
    if (hero) {
        document.body.style.overflow = 'hidden';
    }

    // ========================================
    // TRANSICIÓN DEL HERO
    // ========================================
    let transitionTriggered = false;
    let transitionTimer     = null;

    function triggerTransition() {
        if (transitionTriggered) return;
        transitionTriggered = true;

        clearTimeout(transitionTimer);

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        logoContainer?.classList.add('transitioning');

        setTimeout(() => mainLogo?.classList.add('morphing'),
            reducedMotion ? 0 : CONFIG.HERO_LOGO_MORPH_MS);

        setTimeout(() => navbar?.classList.add('visible'),
            reducedMotion ? 0 : CONFIG.HERO_NAVBAR_SHOW_MS);

        setTimeout(() => mainContent?.classList.add('visible'),
            reducedMotion ? 0 : CONFIG.HERO_CONTENT_SHOW_MS);

        setTimeout(() => {
            if (hero) hero.style.display = 'none';
            document.body.style.overflow = '';
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
            adjustSplitSections();
        }, reducedMotion ? 0 : CONFIG.HERO_HIDE_MS);
    }

    if (hero) {
        hero.addEventListener('click', triggerTransition);
        transitionTimer = setTimeout(triggerTransition, CONFIG.HERO_AUTO_TRIGGER_MS);
    }

    // ========================================
    // MENÚ HAMBURGUESA (MOBILE)
    // ========================================
    function closeMenu() {
        menuToggle?.classList.remove('active');
        navMenu?.classList.remove('active');
        menuToggle?.setAttribute('aria-expanded', 'false');
    }

    menuToggle?.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
        if (navbar && !navbar.contains(e.target)) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });

    // ========================================
    // SMOOTH SCROLL PARA NAVEGACIÓN
    // ========================================
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href?.startsWith('#')) return;

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
                         - (navbar?.offsetHeight ?? 0);

            window.scrollTo({ top: offset, behavior: 'smooth' });
        });
    });

    // ========================================
    // SOMBRA DEL NAVBAR AL HACER SCROLL
    // ========================================
    window.addEventListener('scroll', () => {
        if (!navbar) return;
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    // ========================================
    // ANIMACIÓN DE ENTRADA 
    // ========================================
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('anim-visible');
                animObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold:  0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    document.querySelectorAll('.service-card, .tu-hijo-y-vos-card').forEach(card => {
        card.classList.add('anim-card');
        animObserver.observe(card);
    });

    // ========================================
    // AJUSTE DINÁMICO DE SECCIONES PARTIDAS
    // ========================================
    function adjustSplitSections() {
        const sections = document.querySelectorAll('.service-section, .testimonios-section');
        if (window.innerWidth <= 768) {
            sections.forEach(s => s.style.minHeight = '');
            return;
        }
        const navH = navbar?.offsetHeight ?? 0;
        const halfHeight = (window.innerHeight - navH) / 2;
        sections.forEach(s => s.style.minHeight = `${halfHeight}px`);
    }

    // ========================================
    // CARRUSEL DE TESTIMONIOS
    // ========================================
    const track          = document.getElementById('carouselTrack');
    const prevBtn        = document.getElementById('prevBtn');
    const nextBtn        = document.getElementById('nextBtn');
    const dotsContainer  = document.getElementById('carouselDots');
    const carouselStatus = document.getElementById('carouselStatus');

    if (track && prevBtn && nextBtn && dotsContainer) {
        const cards      = Array.from(track.querySelectorAll('.testimonio-card'));
        let currentIndex = 0;
        let visibleCards = getVisibleCards();
        let autoPlayId   = null;

        function getVisibleCards() {
            if (window.innerWidth <= 768)  return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }

        function getCardWidth() {
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            return (cards[0]?.offsetWidth ?? 0) + gap;
        }

        function buildDots() {
            dotsContainer.innerHTML = '';
            const total = Math.max(0, cards.length - visibleCards + 1);
            for (let i = 0; i < total; i++) {
                const dot = document.createElement('button');
                dot.classList.add('carousel-dot');
                dot.setAttribute('aria-label', `Ir al testimonio ${i + 1}`);
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-selected', String(i === 0));
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }
        }

        function updateDots() {
            dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                const active = i === currentIndex;
                dot.classList.toggle('active', active);
                dot.setAttribute('aria-selected', String(active));
            });
        }

        function updateButtons() {
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= cards.length - visibleCards;
        }

        function goToSlide(index) {
            const maxIndex = Math.max(0, cards.length - visibleCards);
            currentIndex   = Math.max(0, Math.min(index, maxIndex));

            track.style.willChange = 'transform';
            track.style.transform  = `translateX(-${currentIndex * getCardWidth()}px)`;

            track.addEventListener('transitionend', () => {
                track.style.willChange = 'auto';
            }, { once: true });

            updateDots();
            updateButtons();

            if (carouselStatus) {
                carouselStatus.textContent =
                    `Testimonio ${currentIndex + 1} de ${cards.length - visibleCards + 1}`;
            }
        }

        function startAutoPlay() {
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reducedMotion) return;
            stopAutoPlay();
            autoPlayId = setInterval(() => {
                const maxIndex = cards.length - visibleCards;
                goToSlide(currentIndex < maxIndex ? currentIndex + 1 : 0);
            }, CONFIG.CAROUSEL_AUTOPLAY_MS);
        }

        function stopAutoPlay() {
            clearInterval(autoPlayId);
            autoPlayId = null;
        }

        prevBtn.addEventListener('click', () => {
            stopAutoPlay();
            goToSlide(currentIndex - 1);
            startAutoPlay();
        });
        nextBtn.addEventListener('click', () => {
            stopAutoPlay();
            goToSlide(currentIndex + 1);
            startAutoPlay();
        });

        // Pausar al hover
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

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoPlay();
            } else {
                startAutoPlay();
            }
        });

        // Recalcular en resize con debounce
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                visibleCards = getVisibleCards();
                buildDots();
                goToSlide(0);
                adjustSplitSections();
            }, CONFIG.CAROUSEL_RESIZE_DEBOUNCE);
        });

        // Inicializar
        buildDots();
        updateButtons();
        startAutoPlay();
    }

});
// ========================================
// SLIDER DE INTRODUCCIÓN - OPTIMIZADO CONVERSIÓN
// ========================================

const introTrack = document.getElementById('introSliderTrack');
const introPrevBtn = document.getElementById('introPrevBtn');
const introNextBtn = document.getElementById('introNextBtn');
const introDotsContainer = document.getElementById('introSliderDots');
const introSliderStatus = document.getElementById('introSliderStatus');

if (introTrack && introPrevBtn && introNextBtn && introDotsContainer) {
    const introSlides = Array.from(introTrack.querySelectorAll('.intro-slide'));
    let introCurrentIndex = 0;
    let introAutoPlayId = null;
    const INTRO_AUTOPLAY_MS = 5000; // 5 segundos (≥ 4s para no bajar conversión)

    // Obtener ancho de slide
    function getIntroSlideWidth() {
        return introSlides[0]?.offsetWidth ?? 0;
    }

    // Construir indicadores (dots)
    function buildIntroDots() {
        introDotsContainer.innerHTML = '';
        introSlides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('intro-slider-dot');
            dot.setAttribute('aria-label', `Ir a diapositiva ${i + 1}`);
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-selected', String(i === 0));
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToIntroSlide(i));
            introDotsContainer.appendChild(dot);
        });
    }

    // Actualizar indicadores
    function updateIntroDots() {
        introDotsContainer.querySelectorAll('.intro-slider-dot').forEach((dot, i) => {
            const active = i === introCurrentIndex;
            dot.classList.toggle('active', active);
            dot.setAttribute('aria-selected', String(active));
        });
    }

    // Actualizar botones
    function updateIntroButtons() {
        introPrevBtn.disabled = introCurrentIndex === 0;
        nextBtn.disabled = introCurrentIndex >= introSlides.length - 1;
    }

    // Ir a slide específico
    function goToIntroSlide(index) {
        const maxIndex = introSlides.length - 1;
        introCurrentIndex = Math.max(0, Math.min(index, maxIndex));

        introTrack.style.willChange = 'transform';
        introTrack.style.transform = `translateX(-${introCurrentIndex * getIntroSlideWidth()}px)`;

        // Marcar slide activo
        introSlides.forEach((slide, i) => {
            slide.classList.toggle('active', i === introCurrentIndex);
        });

        introTrack.addEventListener('transitionend', () => {
            introTrack.style.willChange = 'auto';
        }, { once: true });

        updateIntroDots();
        updateIntroButtons();

        // Actualizar estado accesible
        if (introSliderStatus) {
            introSliderStatus.textContent = `Diapositiva ${introCurrentIndex + 1} de ${introSlides.length}`;
        }
    }

    // Autoplay (se detiene al llegar al final - no hace loop)
    function startIntroAutoPlay() {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) return;
        
        stopIntroAutoPlay();
        
        // Solo iniciar si no estamos en la última slide
        if (introCurrentIndex < introSlides.length - 1) {
            introAutoPlayId = setInterval(() => {
                if (introCurrentIndex < introSlides.length - 1) {
                    goToIntroSlide(introCurrentIndex + 1);
                } else {
                    // Llegamos al final - detener autoplay
                    stopIntroAutoPlay();
                }
            }, INTRO_AUTOPLAY_MS);
        }
    }

    function stopIntroAutoPlay() {
        clearInterval(introAutoPlayId);
        introAutoPlayId = null;
    }

    // Event listeners
    introPrevBtn.addEventListener('click', () => {
        stopIntroAutoPlay();
        goToIntroSlide(introCurrentIndex - 1);
        startIntroAutoPlay();
    });

    introNextBtn.addEventListener('click', () => {
        stopIntroAutoPlay();
        goToIntroSlide(introCurrentIndex + 1);
        startIntroAutoPlay();
    });

    // Pausar al hover
    introTrack.addEventListener('mouseenter', stopIntroAutoPlay);
    introTrack.addEventListener('mouseleave', startIntroAutoPlay);

    // Soporte táctil (swipe)
    let introTouchStartX = 0;
    let introTouchEndX = 0;

    introTrack.addEventListener('touchstart', (e) => {
        introTouchStartX = e.touches[0].clientX;
        stopIntroAutoPlay();
    }, { passive: true });

    introTrack.addEventListener('touchmove', (e) => {
        introTouchEndX = e.touches[0].clientX;
    }, { passive: true });

    introTrack.addEventListener('touchend', () => {
        const diff = introTouchStartX - introTouchEndX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe izquierda → siguiente
                goToIntroSlide(introCurrentIndex + 1);
            } else {
                // Swipe derecha → anterior
                goToIntroSlide(introCurrentIndex - 1);
            }
        }
        startIntroAutoPlay();
    });

    // Pausar cuando la página está oculta
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopIntroAutoPlay();
        } else {
            startIntroAutoPlay();
        }
    });

    // Teclado (accesibilidad)
    document.addEventListener('keydown', (e) => {
        // Solo responder si el slider está en viewport
        const rect = introTrack.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (!inView) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            stopIntroAutoPlay();
            goToIntroSlide(introCurrentIndex - 1);
            startIntroAutoPlay();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            stopIntroAutoPlay();
            goToIntroSlide(introCurrentIndex + 1);
            startIntroAutoPlay();
        }
    });

    // Recalcular en resize con debounce
    let introResizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(introResizeTimer);
        introResizeTimer = setTimeout(() => {
            goToIntroSlide(introCurrentIndex);
        }, 150);
    });

    // Inicializar
    buildIntroDots();
    updateIntroButtons();
    introSlides[0]?.classList.add('active');
    
    // Iniciar autoplay después de un pequeño delay
    // (permite que el usuario vea el slide 1 completo primero)
    setTimeout(() => {
        startIntroAutoPlay();
    }, 1000);
}