// Piel de Mar — comportamiento de la página principal

document.addEventListener('DOMContentLoaded', () => {
    const CONFIG = {
        CAROUSEL_RESIZE_DEBOUNCE: 150
    };

    // ========================================
    // INICIALIZAR LUCIDE ICONS
    // ========================================
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

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
            window.open(url, '_blank', 'noopener,noreferrer');
            appointmentForm.hidden = true;
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
    }

    menuToggle?.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
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
        const sections = document.querySelectorAll('.service-section, .testimonios-section');
        if (window.innerWidth <= 768) {
            sections.forEach((section) => section.style.removeProperty('min-height'));
            return;
        }
        const navH = navbar?.offsetHeight ?? 0;
        const halfHeight = (window.innerHeight - navH) / 2;
        sections.forEach((section) => section.style.setProperty('min-height', `${halfHeight}px`));
    }

    // ========================================
    // CARRUSEL DE TESTIMONIOS — MANUAL
    // ========================================
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('carouselDots');
    const carouselStatus = document.getElementById('carouselStatus');

    if (track && prevBtn && nextBtn && dotsContainer) {
        const cards = Array.from(track.querySelectorAll('.testimonio-card'));
        const carouselRegion = track.closest('.testimonios-section');
        let currentIndex = 0;
        let visibleCards = getVisibleCards();

        function getVisibleCards() {
            if (window.innerWidth <= 768) return 1;
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
            for (let i = 0; i < total; i += 1) {
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
            currentIndex = Math.max(0, Math.min(index, maxIndex));
            track.style.willChange = 'transform';
            track.style.transform = `translateX(-${currentIndex * getCardWidth()}px)`;
            track.addEventListener('transitionend', () => track.style.removeProperty('will-change'), { once: true });
            updateDots();
            updateButtons();
            if (carouselStatus) carouselStatus.textContent = `Testimonio ${currentIndex + 1} de ${cards.length - visibleCards + 1}`;
        }

        prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
        nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

        let touchStartX = 0;
        track.addEventListener('touchstart', (event) => { touchStartX = event.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', (event) => {
            const diff = touchStartX - event.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) goToSlide(diff > 0 ? currentIndex + 1 : currentIndex - 1);
        }, { passive: true });

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

        buildDots();
        updateButtons();
        if (carouselRegion) carouselRegion.setAttribute('data-autoplay', 'off');
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
