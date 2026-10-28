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
        HERO_AUTO_TRIGGER_MS:    500,
        HERO_LOGO_MORPH_MS:      250,
        HERO_NAVBAR_SHOW_MS:       0,
        HERO_CONTENT_SHOW_MS:    150,
        HERO_HIDE_MS:            700,

        // Carrusel
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
    // SOLICITUD DE TURNOS — WhatsApp
    // El formulario prepara el mensaje; la persona lo envía manualmente.
    // ========================================
    const appointmentForm = document.getElementById('appointmentRequestForm');
    if (appointmentForm) {
        const dateInput = document.getElementById('appointmentDate');
        const periodInput = document.getElementById('appointmentPeriod');
        const timeInput = document.getElementById('appointmentTime');
        const resultPanel = document.getElementById('appointmentRequestResult');
        const statusText = document.getElementById('appointmentRequestStatus');
        const errorText = document.getElementById('appointmentRequestError');
        const WHATSAPP_NUMBER = '5493425004018';

        function localDateString(date = new Date()) {
            const parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Argentina/Buenos_Aires',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).formatToParts(date);
            const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
            return `${values.year}-${values.month}-${values.day}`;
        }

        function setMinimumAppointmentDate() {
            const [year, month, day] = localDateString().split('-').map(Number);
            dateInput.min = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
        }
        setMinimumAppointmentDate();

        const APPOINTMENT_SLOTS = {
            morning: {
                label: 'Mañana',
                times: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
            },
            afternoon: {
                label: 'Tarde',
                times: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30']
            }
        };

        function renderPeriodOptions() {
            periodInput.value = '';
            timeInput.replaceChildren();
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Elegí mañana o tarde';
            timeInput.appendChild(placeholder);
            Object.entries(APPOINTMENT_SLOTS).forEach(([value, period]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = period.label;
                timeInput.appendChild(option);
            });
        }

        function renderTimeOptions(periodKey) {
            const period = APPOINTMENT_SLOTS[periodKey];
            if (!period) {
                renderPeriodOptions();
                return;
            }

            periodInput.value = periodKey;
            timeInput.replaceChildren();

            const changeOption = document.createElement('option');
            changeOption.value = '__change-period__';
            changeOption.textContent = '← Cambiar franja';
            timeInput.appendChild(changeOption);

            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = `Elegí un horario de ${period.label.toLowerCase()}`;
            placeholder.disabled = true;
            placeholder.selected = true;
            timeInput.appendChild(placeholder);

            period.times.forEach((time) => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeInput.appendChild(option);
            });
        }

        renderPeriodOptions();
        timeInput.addEventListener('change', () => {
            if (timeInput.value === 'morning' || timeInput.value === 'afternoon') {
                renderTimeOptions(timeInput.value);
            } else if (timeInput.value === '__change-period__') {
                renderPeriodOptions();
            }
        });

        function resetFeedback() {
            resultPanel.hidden = true;
            errorText.hidden = true;
            errorText.textContent = '';
        }
        appointmentForm.addEventListener('input', resetFeedback);
        appointmentForm.addEventListener('change', resetFeedback);

        function formatDate(date) {
            const [year, month, day] = date.split('-');
            return `${day}/${month}/${year}`;
        }

        appointmentForm.addEventListener('submit', (event) => {
            event.preventDefault();
            resetFeedback();
            if (!appointmentForm.reportValidity()) return;

            const formData = new FormData(appointmentForm);
            const payload = {
                name: String(formData.get('name') || '').trim(),
                insurance: String(formData.get('insurance') || '').trim(),
                reason: String(formData.get('reason') || '').trim(),
                date: String(formData.get('date') || ''),
                period: String(formData.get('period') || ''),
                time: String(formData.get('time') || '')
            };
            const selectedPeriod = APPOINTMENT_SLOTS[payload.period];
            if (!payload.name || !payload.insurance || !payload.reason ||
                !selectedPeriod || !selectedPeriod.times.includes(payload.time)) {
                errorText.textContent = 'Revisá los datos obligatorios y elegí una franja y un horario válidos.';
                errorText.hidden = false;
                return;
            }
            if (payload.date < dateInput.min) {
                dateInput.setCustomValidity('Elegí una fecha a partir de mañana.');
                dateInput.reportValidity();
                dateInput.setCustomValidity('');
                return;
            }

            const message = [
                'Hola, quiero solicitar un turno con Piel de Mar.',
                '',
                `Nombre: ${payload.name}`,
                `Obra social o cobertura: ${payload.insurance}`,
                `Motivo de la consulta: ${payload.reason}`,
                `Fecha deseada: ${formatDate(payload.date)}`,
                `Franja horaria: ${selectedPeriod.label}`,
                `Horario deseado: ${payload.time}`,
                '',
                'Entiendo que este mensaje es una solicitud y que el turno queda confirmado únicamente cuando reciba una respuesta de Piel de Mar por WhatsApp.'
            ].join('\n');

            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            statusText.textContent = 'Tu solicitud fue preparada para WhatsApp. El turno todavía no está confirmado: quedará confirmado cuando Piel de Mar responda tu mensaje.';
            resultPanel.hidden = false;
            resultPanel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });

            window.open(url, '_blank', 'noopener,noreferrer');
            appointmentForm.hidden = true;
        });
    }

    const currentYear = document.getElementById('currentYear');
    if (currentYear) {
        currentYear.textContent = String(new Date().getFullYear());
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
        const carouselRegion = track.closest('.testimonios-section');
        let currentIndex = 0;
        let visibleCards = getVisibleCards();
        let autoPlayId   = null;
        const autoPlayMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

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
                dot.setAttribute('aria-pressed', String(i === 0));
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }
        }

        function updateDots() {
            dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                const active = i === currentIndex;
                dot.classList.toggle('active', active);
                dot.setAttribute('aria-pressed', String(active));
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
            // Autoplay desactivado: el carrusel sólo cambia por acción de la persona.
        }

        function stopAutoPlay() {
            // Se conserva como no-op para mantener los manejadores de interacción compatibles.
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

        // Pausar mientras el usuario interactúa con el carrusel.
        carouselRegion?.addEventListener('mouseenter', stopAutoPlay);
        carouselRegion?.addEventListener('mouseleave', startAutoPlay);
        carouselRegion?.addEventListener('focusin', stopAutoPlay);
        carouselRegion?.addEventListener('focusout', (event) => {
            if (!event.relatedTarget || !carouselRegion.contains(event.relatedTarget)) {
                startAutoPlay();
            }
        });

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
const introRegion = introTrack?.closest('.intro-section');

if (introTrack && introPrevBtn && introNextBtn && introDotsContainer) {
    const introSlides = Array.from(introTrack.querySelectorAll('.intro-slide'));
    let introCurrentIndex = 0;
    let introAutoPlayId = null;
    const introAutoPlayMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

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
            dot.setAttribute('aria-pressed', String(i === 0));
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
            dot.setAttribute('aria-pressed', String(active));
        });
    }

    // Actualizar botones
    function updateIntroButtons() {
        introPrevBtn.disabled = introCurrentIndex === 0;
        introNextBtn.disabled = introCurrentIndex >= introSlides.length - 1;
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
        // Autoplay desactivado: el slider sólo cambia por acción de la persona.
    }

    function stopIntroAutoPlay() {
        // Se conserva como no-op para mantener los manejadores de interacción compatibles.
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

    // Pausar mientras el usuario interactúa con el slider.
    introRegion?.addEventListener('mouseenter', stopIntroAutoPlay);
    introRegion?.addEventListener('mouseleave', startIntroAutoPlay);
    introRegion?.addEventListener('focusin', stopIntroAutoPlay);
    introRegion?.addEventListener('focusout', (event) => {
        if (!event.relatedTarget || !introRegion.contains(event.relatedTarget)) {
            startIntroAutoPlay();
        }
    });

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
    introRegion?.addEventListener('keydown', (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;

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