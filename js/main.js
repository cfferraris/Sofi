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
        HERO_AUTO_TRIGGER_MS:   1000,
        HERO_LOGO_MORPH_MS:      600,
        HERO_NAVBAR_SHOW_MS:     700,
        HERO_CONTENT_SHOW_MS:    800,
        HERO_HIDE_MS:           1000,

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
            if (!href?.startsWith('#')) { closeMenu(); return; }

            e.preventDefault();
            history.replaceState(null, '', href);
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

// ========================================
// SERVICIOS Y RECURSOS: CONTENIDO INTERNO ACCESIBLE
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('siteContentDialog');
    const title = document.getElementById('siteContentDialogTitle');
    const eyebrow = document.getElementById('siteContentDialogEyebrow');
    const body = document.getElementById('siteContentDialogBody');
    const closeButton = document.getElementById('siteContentDialogClose');
    const consultButton = document.getElementById('siteContentDialogConsult');
    const footer = document.getElementById('siteContentDialogFooter');
    if (!dialog || !title || !eyebrow || !body || !closeButton || !consultButton || !footer) return;

    const serviceContent = {
        estimulacion: {
            title: 'Estimulación temprana',
            intro: 'Propuestas de juego y exploración adaptadas al momento de desarrollo, los intereses y el ritmo de cada niño.',
            sections: [
                { title: '¿Qué se trabaja?', text: 'La exploración sensorial, el movimiento, la comunicación, el juego compartido y la autonomía cotidiana, sin convertir cada actividad en una exigencia.' },
                { title: 'Ejemplo para casa', text: 'Prepará una cesta con dos o tres objetos seguros de distintas texturas. Dejá que el niño elija, explore y repita. Acompañá con palabras simples lo que está haciendo y seguí su interés.' },
                { title: 'Una clave', text: 'La propuesta debe adaptarse al niño, no al revés. Si se frustra, se cansa o pierde interés, podés hacer una pausa y volver en otro momento.' }
            ]
        },
        emocional: {
            title: 'Acompañamiento emocional',
            intro: 'Un espacio para reconocer emociones, ponerles palabras y construir estrategias de regulación con el acompañamiento adulto.',
            sections: [
                { title: '¿Cómo se acompaña?', text: 'Se parte de situaciones cotidianas y se ofrecen herramientas acordes a la edad. Primero se prioriza la seguridad y la conexión; después, cuando hay calma, se conversa sobre lo ocurrido.' },
                { title: 'Ejemplo de frase', text: '“Veo que estás muy enojado porque terminó el juego. Estoy acá. No voy a dejar que pegues; podemos buscar otra forma de mostrar el enojo”.' },
                { title: 'Una clave', text: 'Validar una emoción no significa permitir cualquier conducta. Se puede reconocer lo que siente el niño y sostener un límite claro al mismo tiempo.' }
            ]
        },
        neurodesarrollo: {
            title: 'Neurodesarrollo infantil',
            intro: 'Orientación para observar el desarrollo de manera integral, reconocer dudas y decidir cuándo conviene consultar.',
            sections: [
                { title: '¿Qué se observa?', text: 'La comunicación, el movimiento, el juego, la interacción, la autonomía y cómo estas habilidades cambian con el tiempo y en distintos contextos.' },
                { title: 'Ejemplo de registro', text: 'Anotá una situación concreta: qué ocurrió, en qué contexto, qué pudo hacer el niño, qué le resultó difícil y qué apoyos parecieron ayudar. Registrar ejemplos específicos facilita conversar con un profesional.' },
                { title: 'Una clave', text: 'Los ritmos de desarrollo varían. Una lista orientativa no permite diagnosticar. Si algo te preocupa o notás una pérdida de habilidades, consultá con un profesional de salud.' }
            ]
        },
        familiar: {
            title: 'Acompañamiento familiar',
            intro: 'Orientación para construir rutinas posibles, revisar situaciones que generan tensión y encontrar respuestas consistentes entre las personas adultas que cuidan.',
            sections: [
                { title: '¿Qué puede incluir?', text: 'Conversaciones sobre rutinas, límites, distribución de tareas, momentos de conexión y necesidades de cada integrante de la familia.' },
                { title: 'Ejemplo de rutina', text: 'Elegí un momento del día que suele ser difícil —por ejemplo, prepararse para dormir— y organizá tres pasos previsibles: guardar un juguete, elegir un cuento y bajar la luz. Anticipá cada paso con calma.' },
                { title: 'Una clave', text: 'No hace falta cambiar toda la rutina de una vez. Empezá por un ajuste pequeño y observá si resulta sostenible para la familia.' }
            ]
        }
    };

    const resourceContent = {
        desarrollo: {
            eyebrow: 'Biblioteca · Desarrollo infantil',
            title: 'Observar para comprender',
            intro: 'El desarrollo se expresa en el movimiento, la comunicación, el juego, la relación con otras personas y la autonomía. Mirar el conjunto ayuda más que comparar una sola habilidad.',
            sections: [
                { title: 'Ejemplo: observación cotidiana', text: 'Durante el juego, observá qué objetos despiertan interés, cómo pide ayuda, si comparte atención con otra persona y qué hace cuando una actividad cambia. Anotá ejemplos concretos, sin etiquetar.' },
                { title: 'Tres preguntas útiles', list: ['¿Qué puede hacer hoy que antes le costaba?', '¿En qué situaciones necesita más apoyo?', '¿Qué cambia cuando el entorno está tranquilo o la consigna es más simple?'] },
                { title: 'Cuándo consultar', text: 'Si una preocupación persiste, afecta la vida cotidiana o notás pérdida de habilidades que ya tenía, conversá con un profesional de salud. Este material no permite establecer diagnósticos.' }
            ]
        },
        crianza: {
            eyebrow: 'Biblioteca · Crianza respetuosa',
            title: 'Conectar y sostener límites',
            intro: 'Acompañar con respeto combina cercanía emocional, límites claros y expectativas acordes a la edad. No requiere resolver cada conflicto de inmediato.',
            sections: [
                { title: 'Ejemplo de situación', text: 'El niño no quiere guardar los juguetes. Acercate, nombrá lo que ocurre y ofrecé una consigna concreta: “Querés seguir jugando. Ahora guardamos los bloques y después elegimos un cuento”.' },
                { title: 'Probá esta secuencia', list: ['Acercate y buscá su atención antes de dar la indicación.', 'Explicá el límite con pocas palabras y tono estable.', 'Ofrecé una alternativa posible, sin retirar el límite.', 'Reconocé el esfuerzo, aunque necesite ayuda.'] },
                { title: 'Para reflexionar', text: '¿La consigna es clara? ¿Es adecuada para su edad? ¿Necesita una transición o ayuda para empezar?' }
            ]
        },
        regulacion: {
            eyebrow: 'Biblioteca · Regulación emocional',
            title: 'Acompañar un momento intenso',
            intro: 'Cuando una emoción desborda, la prioridad es cuidar la seguridad y reducir la intensidad. La explicación larga suele funcionar mejor después, cuando vuelve la calma.',
            sections: [
                { title: 'Antes', text: 'Observá señales tempranas como cansancio, hambre, ruido excesivo o cambios inesperados. Cuando sea posible, anticipá lo que va a pasar y ofrecé pausas.' },
                { title: 'Durante', list: ['Mantené una presencia tranquila y usá pocas palabras.', 'Reducí estímulos y alejás objetos que puedan lastimar.', 'Nombrá la emoción sin exigir que se calme de inmediato.', 'Sostené límites de seguridad sin amenazas ni humillaciones.'] },
                { title: 'Después', text: 'Cuando haya calma, reconstruyan brevemente qué pasó y piensen una alternativa para la próxima vez. No es necesario convertirlo en una charla larga.' }
            ]
        },
        juego: {
            eyebrow: 'Biblioteca · Juego y estimulación',
            title: 'Jugar con lo que ya tenés',
            intro: 'El juego cotidiano puede ofrecer oportunidades de explorar, turnarse, imaginar y resolver pequeños desafíos. No hacen falta materiales costosos ni una actividad perfecta.',
            sections: [
                { title: 'Propuesta de ejemplo: buscar y encontrar', text: 'Con objetos seguros y adecuados a la edad, escondé parcialmente uno bajo una tela y esperá a que el niño lo busque. Si necesita ayuda, mostrá una parte del objeto o hacé una pista sencilla.' },
                { title: 'Cómo acompañar', list: ['Seguí su interés antes de sumar una consigna.', 'Esperá unos segundos para darle tiempo a responder.', 'Convertí sus acciones en turnos de juego.', 'Detené la actividad si pierde interés o se incomoda.'] },
                { title: 'Seguridad', text: 'Elegí materiales apropiados para la edad, evitá piezas pequeñas cuando exista riesgo de atragantamiento y supervisá el juego.' }
            ]
        },
        videos: {
            eyebrow: 'Formato de ejemplo · Video educativo',
            title: 'Guion breve: qué hacer ante una frustración',
            intro: 'Este es un ejemplo de contenido audiovisual, presentado como guion para mostrar el enfoque. No representa un video publicado ni enlaza a un canal externo.',
            sections: [
                { title: 'Duración estimada: 60–90 segundos', text: 'Escena 1 — Situación: un juego termina y el niño protesta. Voz: “A veces, un cambio pequeño puede sentirse enorme”.' },
                { title: 'Idea central', text: 'Escena 2 — Acompañar: el adulto se acerca, baja el tono y dice: “Querías seguir. Te cuesta parar”. Escena 3 — Límite: “No voy a dejar que tires los juguetes. Te ayudo a guardarlos”.' },
                { title: 'Cierre', text: '“Primero seguridad y conexión; después, cuando haya calma, podemos conversar. Cada niño necesita apoyos diferentes”.' }
            ]
        },
        articulos: {
            eyebrow: 'Formato de ejemplo · Lectura',
            title: 'Rutinas previsibles, acompañamiento más claro',
            intro: 'Una rutina sencilla no busca controlar cada minuto: ayuda a anticipar transiciones y reduce la cantidad de instrucciones nuevas que una persona necesita procesar.',
            sections: [
                { title: 'Idea principal', text: 'Elegí una secuencia corta para un momento concreto del día. Usá siempre las mismas palabras, anticipá el cambio y dejá margen para que el niño participe según sus posibilidades.' },
                { title: 'Ejemplo', text: 'Para prepararse para salir: guardar un objeto, ponerse el calzado y elegir qué llevar. Una imagen o una frase breve puede servir como recordatorio.' },
                { title: 'Preguntas para aplicar', list: ['¿Qué paso genera más dificultad?', '¿La rutina es demasiado larga?', '¿Qué parte puede elegir o hacer el niño con menos ayuda?'] },
                { title: 'Nota editorial', text: 'Lectura introductoria de ejemplo. La biblioteca podrá incorporar bibliografía verificada y referencias específicas en una revisión editorial posterior.' }
            ]
        },
        guias: {
            eyebrow: 'Formato de ejemplo · Guía descargable',
            title: 'Una rutina más previsible',
            intro: 'Vista previa de una guía breve para adaptar a la vida familiar. Podés descargarla como archivo HTML para abrirla, guardarla o imprimirla desde el navegador.',
            sections: [
                { title: '1. Elegí un solo momento', text: 'Por ejemplo: prepararse para dormir, salir de casa o guardar los juguetes.' },
                { title: '2. Definí hasta tres pasos', list: ['Decí qué va a pasar primero.', 'Mostrá o nombrá el paso siguiente.', 'Avisá cómo termina la secuencia.'] },
                { title: '3. Observá y ajustá', text: 'Durante varios días, anotá qué ayudó y qué generó dificultad. Simplificá la secuencia si hace falta; no es una prueba que el niño tenga que aprobar.' },
                { title: 'Recordatorio', text: 'Material educativo general. Adaptá la propuesta a la edad, las necesidades y la seguridad de cada niño.' }
            ],
            download: true
        },
        tips: {
            eyebrow: 'Formato de ejemplo · Tips rápidos',
            title: 'Cinco ideas pequeñas para probar hoy',
            intro: 'No hace falta aplicar todas las estrategias al mismo tiempo. Elegí una y observá cómo funciona en tu contexto.',
            sections: [
                { title: 'Ideas prácticas', list: ['Avisá antes de cambiar de actividad.', 'Acercate antes de repetir una indicación.', 'Ofrecé dos opciones posibles, no una lista larga.', 'Describí lo que sí puede hacer: “Los bloques van en la caja”.', 'Reservá unos minutos de juego compartido sin teléfono ni otras tareas.'] },
                { title: 'Cómo evaluar si ayuda', text: 'Buscá cambios pequeños: una transición algo más tranquila, más participación o menos instrucciones repetidas. Si no funciona, ajustá la propuesta; no significa que alguien haya fallado.' }
            ]
        }
    };

    let lastTrigger = null;
    let currentTitle = '';
    function renderSections(sections) {
        return sections.map(function(section) {
            let content = '';
            if (section.text) content += '<p>' + section.text + '</p>';
            if (section.list) content += '<ul>' + section.list.map(function(item) { return '<li>' + item + '</li>'; }).join('') + '</ul>';
            return '<section class="site-dialog-section"><h3>' + section.title + '</h3>' + content + '</section>';
        }).join('');
    }
    function openContent(data, trigger, type) {
        lastTrigger = trigger;
        currentTitle = data.title;
        eyebrow.textContent = data.eyebrow || (type === 'service' ? 'Piel de Mar · Servicios' : 'Piel de Mar · Recursos gratuitos');
        title.textContent = data.title;
        body.innerHTML = '<p class="site-dialog-lead">' + data.intro + '</p>' + renderSections(data.sections);
        footer.hidden = false;
        const oldDownload = document.getElementById('siteContentDialogDownload');
        if (oldDownload) oldDownload.remove();
        if (data.download) {
            const downloadButton = document.createElement('button');
            downloadButton.type = 'button';
            downloadButton.id = 'siteContentDialogDownload';
            downloadButton.className = 'btn btn-secondary';
            downloadButton.textContent = 'Descargar guía de ejemplo';
            downloadButton.addEventListener('click', downloadGuide);
            footer.insertBefore(downloadButton, consultButton);
        }
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else {
            dialog.setAttribute('open', '');
            dialog.setAttribute('role', 'dialog');
        }
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
        closeButton.focus();
    }
    function downloadGuide() {
        const guide = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guía Piel de Mar · Rutina previsible</title><style>body{font:16px/1.65 Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 22px;color:#23464b}h1,h2{color:#07515b}header{border-bottom:3px solid #94d1d8;padding-bottom:16px;margin-bottom:24px}.note{background:#eef7f5;padding:14px;border-radius:12px}@media print{body{margin:0}}</style></head><body><header><p>PIEL DE MAR · RECURSO GRATUITO</p><h1>Una rutina más previsible</h1><p>Guía breve para adaptar a la vida familiar</p></header><h2>1. Elegí un solo momento</h2><p>Por ejemplo: prepararse para dormir, salir de casa o guardar los juguetes.</p><h2>2. Definí hasta tres pasos</h2><ol><li>Decí qué va a pasar primero.</li><li>Mostrá o nombrá el paso siguiente.</li><li>Avisá cómo termina la secuencia.</li></ol><h2>3. Observá y ajustá</h2><p>Durante varios días, anotá qué ayudó y qué generó dificultad. Simplificá la secuencia si hace falta; no es una prueba que el niño tenga que aprobar.</p><p class="note"><strong>Importante:</strong> material educativo general. Adaptá la propuesta a la edad, las necesidades y la seguridad de cada niño. No reemplaza una consulta profesional.</p></body></html>';
        const blob = new Blob([guide], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'piel-de-mar-guia-rutina-previsible.html';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
    document.querySelectorAll('[data-service-key]').forEach(function(trigger) {
        trigger.addEventListener('click', function() {
            const data = serviceContent[trigger.dataset.serviceKey];
            if (data) openContent(Object.assign({ eyebrow: 'Piel de Mar · Servicios' }, data), trigger, 'service');
        });
    });
    document.querySelectorAll('[data-resource-key]').forEach(function(trigger) {
        trigger.addEventListener('click', function() {
            const data = resourceContent[trigger.dataset.resourceKey];
            if (data) openContent(data, trigger, 'resource');
        });
    });
    function closeDialog() {
        if (dialog.open && typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
        if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    }
    closeButton.addEventListener('click', closeDialog);
    dialog.addEventListener('click', function(event) {
        if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener('cancel', function(event) {
        event.preventDefault();
        closeDialog();
    });
    consultButton.addEventListener('click', function() {
        closeDialog();
        const target = document.getElementById('consulta');
        if (!target) return;
        const navbar = document.getElementById('navbar');
        const offset = target.getBoundingClientRect().top + window.scrollY - (navbar ? navbar.offsetHeight : 0);
        window.scrollTo({ top: offset, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
});
