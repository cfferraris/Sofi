// Piel de Mar — comportamiento de la página principal

document.addEventListener('DOMContentLoaded', () => {
    const CONFIG = {
        CAROUSEL_RESIZE_DEBOUNCE: 150
    };

    // ========================================
    // ÍCONOS (Lucide v0.468.0, licencia ISC) — alojados en el sitio, sin dependencias externas
    // ========================================
    const LUCIDE_ICONS = {
        'arrow-right': '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
        'book-open': '<path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />',
        'brain': '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M19.938 10.5a4 4 0 0 1 .585.396" /><path d="M6 18a4 4 0 0 1-1.967-.516" /><path d="M19.967 17.484A4 4 0 0 1 18 18" />',
        'brain-circuit': '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M9 13a4.5 4.5 0 0 0 3-4" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M6 18a4 4 0 0 1-1.967-.516" /><path d="M12 13h4" /><path d="M12 18h6a2 2 0 0 1 2 2v1" /><path d="M12 8h8" /><path d="M16 8V5a2 2 0 0 1 2-2" /><circle cx="16" cy="13" r=".5" /><circle cx="18" cy="3" r=".5" /><circle cx="20" cy="21" r=".5" /><circle cx="20" cy="8" r=".5" />',
        'calendar-check': '<path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" />',
        'chevron-left': '<path d="m15 18-6-6 6-6" />',
        'chevron-right': '<path d="m9 18 6-6-6-6" />',
        'clock': '<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />',
        'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />',
        'external-link': '<path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />',
        'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />',
        'heart-handshake': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" /><path d="m18 15-2-2" /><path d="m15 18-2-2" />',
        'info': '<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />',
        'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" />',
        'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" />',
        'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />',
        'message-circle-heart': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M15.8 9.2a2.5 2.5 0 0 0-3.5 0l-.3.4-.35-.3a2.42 2.42 0 1 0-3.2 3.6l3.6 3.5 3.6-3.5c1.2-1.2 1.1-2.7.2-3.7" />',
        'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />',
        'puzzle': '<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" />',
        'sparkles': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" />',
        'sprout': '<path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />',
        'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
        'youtube': '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" />'
    };

    function renderIcons() {
        const svgNS = 'http://www.w3.org/2000/svg';
        document.querySelectorAll('[data-lucide]').forEach((placeholder) => {
            const name = placeholder.getAttribute('data-lucide');
            const inner = LUCIDE_ICONS[name];
            if (!inner) return;
            const svg = document.createElementNS(svgNS, 'svg');
            const attrs = {
                width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none',
                stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
            };
            Object.entries(attrs).forEach(([key, value]) => svg.setAttribute(key, value));
            Array.from(placeholder.attributes).forEach((attr) => {
                if (attr.name !== 'data-lucide' && attr.name !== 'class') svg.setAttribute(attr.name, attr.value);
            });
            svg.setAttribute('class', ['lucide', `lucide-${name}`, placeholder.getAttribute('class')].filter(Boolean).join(' '));
            // Contenido controlado por este archivo (no proviene de la entrada del usuario).
            svg.innerHTML = inner;
            placeholder.replaceWith(svg);
        });
    }
    renderIcons();

    // ========================================
    // SOLICITUD DE TURNOS — WhatsApp
    // ========================================
    const appointmentForm = document.getElementById('appointmentRequestForm');
    if (appointmentForm) {
        const dateInput = document.getElementById('appointmentDate');
        const periodInput = document.getElementById('appointmentPeriod');
        const timeInput = document.getElementById('appointmentTime');
        const resultPanel = document.getElementById('appointmentRequestResult');
        const statusText = document.getElementById('appointmentRequestStatus');
        const errorText = document.getElementById('appointmentRequestError');
        const openWhatsAppLink = document.getElementById('appointmentOpenWhatsApp');
        const copyButton = document.getElementById('appointmentCopyMessage');
        const editButton = document.getElementById('appointmentEditData');
        let preparedMessage = '';
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

        const [year, month, day] = localDateString().split('-').map(Number);
        dateInput.min = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);

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

        function isWeekday(dateString) {
            const [y, m, d] = dateString.split('-').map(Number);
            const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
            return weekday >= 1 && weekday <= 5;
        }

        function validateDate() {
            const value = dateInput.value;
            let message = '';
            if (value && value < dateInput.min) {
                message = 'Elegí una fecha a partir de mañana.';
            } else if (value && !isWeekday(value)) {
                message = 'Atendemos de lunes a viernes. Elegí un día hábil.';
            }
            dateInput.setCustomValidity(message);
            return message === '';
        }
        dateInput.addEventListener('input', validateDate);
        dateInput.addEventListener('change', validateDate);

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
            if (!validateDate()) {
                dateInput.reportValidity();
                return;
            }

            const [selectedYear, selectedMonth, selectedDay] = payload.date.split('-');
            const message = [
                'Hola, quiero solicitar un turno con Piel de Mar.',
                '',
                `Nombre: ${payload.name}`,
                `Obra social o cobertura: ${payload.insurance}`,
                `Motivo de la consulta: ${payload.reason}`,
                `Fecha deseada: ${selectedDay}/${selectedMonth}/${selectedYear}`,
                `Franja horaria: ${selectedPeriod.label}`,
                `Horario deseado: ${payload.time}`,
                '',
                'Entiendo que este mensaje es una solicitud y que el turno queda confirmado únicamente cuando reciba una respuesta de Piel de Mar por WhatsApp.'
            ].join('\n');

            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            statusText.textContent = 'Tu solicitud fue preparada para WhatsApp. El turno todavía no está confirmado: quedará confirmado cuando Piel de Mar responda tu mensaje.';
            resultPanel.hidden = false;
            resultPanel.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'nearest'
            });
            preparedMessage = message;
            if (openWhatsAppLink) openWhatsAppLink.href = url;
            const opened = window.open(url, '_blank', 'noopener,noreferrer');
            appointmentForm.hidden = true;
            if (!opened) {
                statusText.textContent = 'Preparamos tu solicitud, pero el navegador pudo haber bloqueado WhatsApp. Usá "Abrir WhatsApp" o copiá el mensaje. El turno todavía no está confirmado: quedará confirmado cuando Piel de Mar responda tu mensaje.';
            }
        });

        // Respaldo cuando WhatsApp no se abre: el mensaje vive solo en memoria y nunca se renderiza ni se guarda.
        if (copyButton) {
            if (!navigator.clipboard?.writeText) {
                copyButton.hidden = true;
            } else {
                copyButton.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(preparedMessage);
                        statusText.textContent = 'Mensaje copiado. Pegalo en una conversación de WhatsApp con Piel de Mar y envialo. El turno todavía no está confirmado: quedará confirmado cuando Piel de Mar responda tu mensaje.';
                    } catch {
                        statusText.textContent = 'No pudimos copiar el mensaje. Usá "Abrir WhatsApp" o volvé a "Editar mis datos".';
                    }
                });
            }
        }
        editButton?.addEventListener('click', () => {
            resetFeedback();
            preparedMessage = '';
            if (openWhatsAppLink) openWhatsAppLink.href = '#';
            appointmentForm.hidden = false;
            document.getElementById('appointmentName')?.focus();
        });
    }

    const currentYear = document.getElementById('currentYear');
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());

    // ========================================
    // HERO — TRANSICIÓN SIMPLE Y NO BLOQUEANTE
    // ========================================
    const hero = document.getElementById('hero');
    const heroBackground = hero?.querySelector('.hero-background');
    const navbar = document.getElementById('navbar');
    const mainContent = document.getElementById('mainContent');
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    let heroFinished = false;
    function finishHero() {
        if (!hero || heroFinished) return;
        heroFinished = true;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        navbar?.classList.add('visible');
        mainContent?.classList.add('visible');
        heroBackground?.style.setProperty('animation', 'none');
        hero.style.cursor = 'default';

        const hideHero = () => {
            hero.style.display = 'none';
            adjustSplitSections();
        };

        if (reducedMotion) {
            hideHero();
            return;
        }

        // Presentación de marca: el telón sube (solo transform/opacity) y se retira el hero.
        hero.classList.add('hero-leaving');
        window.setTimeout(hideHero, 850);
    }

    if (hero) {
        // El contenido nunca queda bloqueado detrás de una animación larga.
        heroBackground?.style.setProperty('animation', 'none');
        window.setTimeout(finishHero, 1050);
        hero.addEventListener('click', finishHero, { once: true });
    } else {
        navbar?.classList.add('visible');
        mainContent?.classList.add('visible');
    }

    // ========================================
    // MENÚ HAMBURGUESA (MOBILE)
    // ========================================
    function closeMenu() {
        menuToggle?.classList.remove('active');
        navMenu?.classList.remove('active');
        menuToggle?.setAttribute('aria-expanded', 'false');
        menuToggle?.setAttribute('aria-label', 'Abrir menú de navegación');
    }

    menuToggle?.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    });

    document.addEventListener('click', (event) => {
        if (navbar && !navbar.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (!href?.startsWith('#')) {
                closeMenu();
                return;
            }
            event.preventDefault();
            history.replaceState(null, '', href);
            closeMenu();

            if (href === '#piel-de-mar') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const target = document.querySelector(href);
            if (!target) return;
            const offset = target.getBoundingClientRect().top + window.scrollY - (navbar?.offsetHeight ?? 0);
            window.scrollTo({ top: offset, behavior: 'smooth' });
        });
    });

    window.addEventListener('scroll', () => {
        navbar?.classList.toggle('scrolled', window.scrollY > 100);
    }, { passive: true });

    // ========================================
    // ANIMACIÓN DE ENTRADA
    // ========================================
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('anim-visible');
                animObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

    document.querySelectorAll('.service-card, .tu-hijo-y-vos-card').forEach((card) => {
        card.classList.add('anim-card');
        animObserver.observe(card);
    });

    function adjustSplitSections() {
        const sections = document.querySelectorAll('.service-section');
        if (window.innerWidth <= 768) {
            sections.forEach((section) => section.style.removeProperty('min-height'));
            return;
        }
        const navH = navbar?.offsetHeight ?? 0;
        const halfHeight = (window.innerHeight - navH) / 2;
        sections.forEach((section) => section.style.setProperty('min-height', `${halfHeight}px`));
    }

    // ========================================
    // SLIDER DE INTRODUCCIÓN — MANUAL
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

        function getIntroSlideWidth() { return introSlides[0]?.offsetWidth ?? 0; }
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
        function updateIntroDots() {
            introDotsContainer.querySelectorAll('.intro-slider-dot').forEach((dot, i) => {
                const active = i === introCurrentIndex;
                dot.classList.toggle('active', active);
                dot.setAttribute('aria-pressed', String(active));
            });
        }
        function updateIntroButtons() {
            introPrevBtn.disabled = introCurrentIndex === 0;
            introNextBtn.disabled = introCurrentIndex >= introSlides.length - 1;
        }
        function goToIntroSlide(index) {
            const maxIndex = introSlides.length - 1;
            introCurrentIndex = Math.max(0, Math.min(index, maxIndex));
            introTrack.style.willChange = 'transform';
            introTrack.style.transform = `translateX(-${introCurrentIndex * getIntroSlideWidth()}px)`;
            introSlides.forEach((slide, i) => slide.classList.toggle('active', i === introCurrentIndex));
            introTrack.addEventListener('transitionend', () => introTrack.style.removeProperty('will-change'), { once: true });
            updateIntroDots();
            updateIntroButtons();
            if (introSliderStatus) introSliderStatus.textContent = `Diapositiva ${introCurrentIndex + 1} de ${introSlides.length}`;
        }

        introPrevBtn.addEventListener('click', () => goToIntroSlide(introCurrentIndex - 1));
        introNextBtn.addEventListener('click', () => goToIntroSlide(introCurrentIndex + 1));

        let introTouchStartX = 0;
        let introTouchEndX = 0;
        introTrack.addEventListener('touchstart', (event) => {
            introTouchStartX = event.touches[0].clientX;
            introTouchEndX = introTouchStartX;
        }, { passive: true });
        introTrack.addEventListener('touchmove', (event) => { introTouchEndX = event.touches[0].clientX; }, { passive: true });
        introTrack.addEventListener('touchend', () => {
            const diff = introTouchStartX - introTouchEndX;
            if (Math.abs(diff) > 50) goToIntroSlide(diff > 0 ? introCurrentIndex + 1 : introCurrentIndex - 1);
        }, { passive: true });

        introRegion?.addEventListener('keydown', (event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                goToIntroSlide(introCurrentIndex - 1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                goToIntroSlide(introCurrentIndex + 1);
            }
        });

        let introResizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(introResizeTimer);
            introResizeTimer = setTimeout(() => goToIntroSlide(introCurrentIndex), 150);
        });

        buildIntroDots();
        updateIntroButtons();
        introSlides[0]?.classList.add('active');
        if (introRegion) introRegion.setAttribute('data-autoplay', 'off');
    }
});
