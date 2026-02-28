// ========================================
// PIEL DE MAR - Main JavaScript v1
// ========================================
// Correcciones aplicadas:
// - Un solo DOMContentLoaded unificado
// - Validación completa de formulario
// - Verificación de honeypot anti-spam
// - Sin console.log con datos personales
// - Feedback visual durante submit
// - Error visible al usuario si falla el servidor
// - today() como función para evitar bug de medianoche
// - prefers-reduced-motion respetado en carrusel
// - Page Visibility API para pausar autoplay
// - IntersectionObserver con clases CSS en lugar de estilos inline
// - carouselStatus actualizado para lectores de pantalla
// - Google Maps cargado con IntersectionObserver
// - MAP_CONFIG encapsulado en scope privado
// - Honeypot verificado antes de procesar submit
// - fetch con AbortController y timeout
// - saveAppointment con error visible al usuario
// - Fechas hardcodeadas eliminadas del fallback
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    // ========================================
    // CONFIGURACIÓN GENERAL
    // ========================================
    const CONFIG = {
        // Transición del hero
        HERO_AUTO_TRIGGER_MS:   5000,
        HERO_LOGO_MORPH_MS:      600,
        HERO_NAVBAR_SHOW_MS:    1000,
        HERO_CONTENT_SHOW_MS:   1300,
        HERO_HIDE_MS:           1500,

        // Calendario
        BOOKING_RANGE_MONTHS:      1,   // cuántos meses hacia adelante se puede reservar
        WORK_HOURS_START:          9,
        WORK_HOURS_END:           18,
        WORK_HOURS_INTERVAL:       1,   // cada N horas

        // Carrusel
        CAROUSEL_AUTOPLAY_MS:   5000,
        CAROUSEL_RESIZE_DEBOUNCE: 150,

        // Formulario
        FORM_SUBMIT_TIMEOUT_MS: 8000,   // timeout del fetch de submit
        APPOINTMENTS_FETCH_TIMEOUT_MS: 5000,

        // Mapa
        MAP_CENTER: { lat: -31.4490, lng: -60.9309 },
        MAP_ZOOM:   16,
        // ⚠️ IMPORTANTE: Reemplazar con tu API Key real.
        // Antes de publicar, restringir la key en Google Cloud Console
        // a los dominios: pieldemar.com y www.pieldemar.com
        MAP_API_KEY: 'TU_API_KEY_AQUI'
    };

    // ========================================
    // UTILIDADES
    // ========================================

    /**
     * Retorna la fecha actual como objeto Date.
     * Función en lugar de constante para evitar el bug de medianoche:
     * si la página queda abierta hasta el día siguiente, siempre
     * obtenemos la fecha real del momento de consulta.
     */
    function getToday() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Formatea una fecha como YYYY-MM-DD usando hora local.
     * Evita el bug de timezone que ocurre con toISOString()
     * en zonas horarias con offset negativo (ej: Argentina UTC-3).
     */
    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Formatea una fecha para mostrar al usuario.
     * Ej: "Lunes 15 de marzo"
     */
    function formatDateDisplay(date) {
        const days   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        const months = ['enero','febrero','marzo','abril','mayo','junio',
                        'julio','agosto','septiembre','octubre','noviembre','diciembre'];
        return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`;
    }

    /** Compara dos fechas ignorando la hora */
    function isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth()    === b.getMonth()
            && a.getDate()     === b.getDate();
    }

    /**
     * Verifica si una fecha está fuera del rango de reserva.
     * El rango es configurable mediante CONFIG.BOOKING_RANGE_MONTHS.
     */
    function isOutOfRange(date) {
        const today  = getToday();
        const maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + CONFIG.BOOKING_RANGE_MONTHS);
        return date > maxDate;
    }

    /**
     * fetch con timeout usando AbortController.
     * Si el servidor no responde en `ms` milisegundos, rechaza la promesa.
     */
    async function fetchWithTimeout(url, options = {}, ms = CONFIG.FORM_SUBMIT_TIMEOUT_MS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            return response;
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * Escapa texto para insertar en HTML de forma segura.
     * Evita XSS al interpolar datos en template literals de HTML.
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Muestra un mensaje de notificación accesible al usuario
     * en lugar de alert() bloqueante.
     * Crea/reutiliza un elemento #toast en el DOM.
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
        // Forzar reflow para que la transición funcione al reutilizar
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

        // ✅ Respetar prefers-reduced-motion:
        // Si el usuario prefiere menos movimiento, la transición
        // ocurre instantáneamente sin animaciones
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const delay = reducedMotion ? 0 : 1;

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

    // Cerrar con Escape
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
        navbar.style.boxShadow = window.scrollY > 100
            ? '0 4px 20px rgba(5, 73, 84, 0.1)'
            : 'none';
    }, { passive: true });

    // ========================================
    // ANIMACIÓN DE ENTRADA — INTERSECTION OBSERVER
    // ✅ CORREGIDO: usa clases CSS en lugar de estilos inline
    // para no interferir con la especificidad del CSS
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
            if (reducedMotion) return; // No autoplay si el usuario prefiere menos movimiento
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

    // ========================================
    // SISTEMA DE TURNOS — CALENDARIO Y RESERVAS
    // ========================================
    const calendarDays            = document.getElementById('calendarDays');
    const currentMonthEl          = document.getElementById('currentMonth');
    const prevMonthBtn            = document.getElementById('prevMonth');
    const nextMonthBtn            = document.getElementById('nextMonth');
    const timeSelector            = document.getElementById('timeSelector');
    const timeSlotsEl             = document.getElementById('timeSlots');
    const selectedDateDisplay     = document.getElementById('selectedDateDisplay');
    const appointmentForm         = document.getElementById('appointmentForm');
    const appointmentsPlaceholder = document.getElementById('appointmentsPlaceholder');
    const reservationForm         = document.getElementById('reservationForm');
    const cancelBtn               = document.getElementById('cancelBtn');
    const summaryText             = document.getElementById('summaryText');

    if (calendarDays && currentMonthEl && prevMonthBtn && nextMonthBtn
        && timeSelector && timeSlotsEl && appointmentForm
        && appointmentsPlaceholder && reservationForm && cancelBtn) {

        let currentMonth  = getToday().getMonth();
        let currentYear   = getToday().getFullYear();
        let selectedDate  = null;
        let selectedTime  = null;
        let bookedAppointments = {};
        let isSubmitting  = false; 
        // ========================================
        // CARGAR TURNOS OCUPADOS
        // ========================================
        async function loadBookedAppointments() {
            try {
                const response = await fetchWithTimeout(
                    'data/appointments.json',
                    {},
                    CONFIG.APPOINTMENTS_FETCH_TIMEOUT_MS
                );
                if (response.ok) {
                    bookedAppointments = await response.json();
                }
            } catch {
                bookedAppointments = {};
            }
        }

        // ========================================
        // RENDERIZAR CALENDARIO
        // ========================================
        function renderCalendar(month, year) {
            calendarDays.innerHTML = '';

            const today       = getToday(); // ✅ siempre la fecha actual real
            const firstDay    = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const lastMonthDays = new Date(year, month, 0).getDate();

            const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            currentMonthEl.textContent = `${monthNames[month]} ${year}`;

            // Día de inicio en grid (lunes = 0)
            const startDay = firstDay === 0 ? 6 : firstDay - 1;

            // Celdas vacías para alinear el primer día
            for (let i = 0; i < startDay; i++) {
                const empty = document.createElement('div');
                empty.classList.add('calendar-day', 'empty');
                empty.setAttribute('aria-hidden', 'true');
                calendarDays.appendChild(empty);
            }

            // Días del mes
            for (let day = 1; day <= daysInMonth; day++) {
                const date      = new Date(year, month, day);
                const dayOfWeek = date.getDay();
                const dayEl     = document.createElement('div');
                dayEl.classList.add('calendar-day');
                dayEl.textContent = day;
                dayEl.setAttribute('role', 'gridcell');

                const isToday    = isSameDay(date, today);
                const isPast     = date < today;
                const isWeekend  = dayOfWeek === 0 || dayOfWeek === 6;
                const outOfRange = isOutOfRange(date);

                if (isToday) dayEl.classList.add('today');

                if (isPast || isWeekend || outOfRange) {
                    dayEl.classList.add('disabled');
                    dayEl.setAttribute('aria-disabled', 'true');
                } else {
                    dayEl.setAttribute('tabindex', '0');
                    dayEl.setAttribute('aria-label', `${formatDateDisplay(date)}, disponible`);
                    dayEl.addEventListener('click',   () => selectDate(date, dayEl));
                    dayEl.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            selectDate(date, dayEl);
                        }
                    });
                }

                calendarDays.appendChild(dayEl);
            }

            // Deshabilitar botón de mes anterior si ya estamos en el mes actual
            const today2 = getToday();
            prevMonthBtn.disabled = (month === today2.getMonth() && year === today2.getFullYear());
            nextMonthBtn.disabled = (month === today2.getMonth() + CONFIG.BOOKING_RANGE_MONTHS
                                  && year === today2.getFullYear());
        }

        // ========================================
        // SELECCIONAR FECHA
        // ========================================
        function selectDate(date, dayEl) {
            document.querySelectorAll('.calendar-day.selected').forEach(el => {
                el.classList.remove('selected');
                el.setAttribute('aria-pressed', 'false');
            });

            dayEl.classList.add('selected');
            dayEl.setAttribute('aria-pressed', 'true');

            selectedDate = date;
            selectedTime = null;

            appointmentsPlaceholder.style.display = 'none';
            appointmentForm.style.display         = 'none';
            timeSelector.style.display            = 'block';

            if (selectedDateDisplay) {
                selectedDateDisplay.textContent = formatDateDisplay(date);
            }
            renderTimeSlots(date);
        }

        // ========================================
        // RENDERIZAR HORARIOS
        // ========================================
        function renderTimeSlots(date) {
            timeSlotsEl.innerHTML = '';
            const dateString = formatDate(date);
            const booked     = bookedAppointments[dateString] ?? [];

            for (let hour = CONFIG.WORK_HOURS_START; hour < CONFIG.WORK_HOURS_END; hour += CONFIG.WORK_HOURS_INTERVAL) {
                const timeString = `${String(hour).padStart(2, '0')}:00`;
                const slotEl     = document.createElement('button');
                slotEl.classList.add('time-slot');
                slotEl.textContent = timeString;
                slotEl.type = 'button';

                if (booked.includes(timeString)) {
                    slotEl.classList.add('taken');
                    slotEl.disabled = true;
                    slotEl.setAttribute('aria-label', `${timeString} - no disponible`);
                } else {
                    slotEl.setAttribute('aria-label', `${timeString} - disponible`);
                    slotEl.addEventListener('click', () => selectTime(timeString, slotEl));
                }
                timeSlotsEl.appendChild(slotEl);
            }
        }

        // ========================================
        // SELECCIONAR HORARIO
        // ========================================
        function selectTime(time, slotEl) {
            document.querySelectorAll('.time-slot.selected').forEach(el => {
                el.classList.remove('selected');
            });

            slotEl.classList.add('selected');
            selectedTime = time;

            timeSelector.style.display    = 'none';
            appointmentForm.style.display = 'block';

            if (summaryText) {
                summaryText.textContent =
                    `${formatDateDisplay(selectedDate)} a las ${selectedTime}`;
            }

            if (typeof lucide !== 'undefined') {
                lucide.createIcons({ nodes: [appointmentForm] });
            }
        }

        // ========================================
        // NAVEGACIÓN DEL CALENDARIO
        // ========================================
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderCalendar(currentMonth, currentYear);
        });

        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            renderCalendar(currentMonth, currentYear);
        });

        // ========================================
        // VALIDACIÓN DEL FORMULARIO
        // ========================================

        /**
         * Valida el formato de email.
         * Expresión regular básica pero suficiente para UX.
         */
        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        }

        /**
         * Valida el formato de teléfono.
         * Acepta +54 9 11 1234-5678, (011) 1234-5678, etc.
         */
        function isValidPhone(phone) {
            return /^[\d\s\+\-\(\)]{7,20}$/.test(phone.trim());
        }

        function setFieldError(fieldId, message) {
            const field    = document.getElementById(fieldId);
            const errorId  = `${fieldId}-error`;
            let   errorEl  = document.getElementById(errorId);

            if (!field) return;

            if (message) {
                // Crear elemento de error si no existe
                if (!errorEl) {
                    errorEl = document.createElement('span');
                    errorEl.id = errorId;
                    errorEl.style.cssText = `
                        display: block;
                        color: #c44;
                        font-size: 0.8rem;
                        margin-top: 0.25rem;
                    `;
                    field.parentNode.appendChild(errorEl);
                }
                errorEl.textContent = message;
                field.setAttribute('aria-describedby', errorId);
                field.setAttribute('aria-invalid', 'true');
                field.style.borderColor = '#c44';
            } else {
                if (errorEl) errorEl.textContent = '';
                field.removeAttribute('aria-describedby');
                field.setAttribute('aria-invalid', 'false');
                field.style.borderColor = '';
            }
        }

        function validateForm(data) {
            let valid = true;

            if (!data.patientName.trim()) {
                setFieldError('patientName', 'El nombre es requerido');
                valid = false;
            } else {
                setFieldError('patientName', '');
            }

            if (!data.patientEmail.trim()) {
                setFieldError('patientEmail', 'El email es requerido');
                valid = false;
            } else if (!isValidEmail(data.patientEmail)) {
                setFieldError('patientEmail', 'Ingresá un email válido');
                valid = false;
            } else {
                setFieldError('patientEmail', '');
            }

            if (!data.patientPhone.trim()) {
                setFieldError('patientPhone', 'El teléfono es requerido');
                valid = false;
            } else if (!isValidPhone(data.patientPhone)) {
                setFieldError('patientPhone', 'Ingresá un teléfono válido');
                valid = false;
            } else {
                setFieldError('patientPhone', '');
            }

            return valid;
        }

        // ========================================
        // BOTÓN CANCELAR
        // ========================================
        cancelBtn.addEventListener('click', () => {
            appointmentForm.style.display = 'none';
            timeSelector.style.display    = 'block';
            reservationForm.reset();
            ['patientName','patientEmail','patientPhone'].forEach(id => setFieldError(id, ''));
        });

        // ========================================
        // SUBMIT DEL FORMULARIO
        // ========================================
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (isSubmitting) return;

            const honeypot = document.getElementById('_gotcha');
            if (honeypot && honeypot.value !== '') {
                // Es un bot — rechazar silenciosamente
                return;
            }

            const data = {
                date:          formatDate(selectedDate),
                time:          selectedTime,
                patientName:   document.getElementById('patientName').value,
                patientEmail:  document.getElementById('patientEmail').value,
                patientPhone:  document.getElementById('patientPhone').value,
                childName:     document.getElementById('childName')?.value  ?? '',
                childAge:      document.getElementById('childAge')?.value   ?? '',
                consultReason: document.getElementById('consultReason')?.value ?? ''
            };

            if (!validateForm(data)) {
                const firstError = reservationForm.querySelector('[aria-invalid="true"]');
                firstError?.focus();
                return;
            }

            const submitBtn = reservationForm.querySelector('[type="submit"]');
            isSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled     = true;
                submitBtn.textContent  = 'Enviando…';
            }

            const success = await saveAppointment(data);

            isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled    = false;
                submitBtn.textContent = 'Confirmar turno';
            }

            if (success) {
                // Actualizar turnos ocupados localmente
                if (!bookedAppointments[data.date]) {
                    bookedAppointments[data.date] = [];
                }
                bookedAppointments[data.date].push(data.time);

                showToast(`✅ Turno confirmado: ${formatDateDisplay(selectedDate)} a las ${selectedTime}`);

                // Reset del estado
                reservationForm.reset();
                appointmentForm.style.display         = 'none';
                appointmentsPlaceholder.style.display = 'flex';
                selectedDate = null;
                selectedTime = null;
                document.querySelectorAll('.calendar-day.selected').forEach(el => {
                    el.classList.remove('selected');
                    el.removeAttribute('aria-pressed');
                });
            }
        });

        // ========================================
        // GUARDAR TURNO EN EL SERVIDOR
        // ========================================
        async function saveAppointment(data) {
            try {
                const response = await fetchWithTimeout(
                    'api/appointments',
                    {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        // ✅ No se loguean datos personales — solo se envían al servidor
                        body:    JSON.stringify(data)
                    },
                    CONFIG.FORM_SUBMIT_TIMEOUT_MS
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return true;

            } catch (error) {
                if (error.name === 'AbortError') {
                    showToast('El servidor tardó demasiado. Por favor intentá de nuevo o contactanos por WhatsApp.', 'error');
                } else {
                    showToast('No pudimos confirmar el turno. Por favor contactanos por WhatsApp.', 'error');
                }
                return false;
            }
        }

        // ========================================
        // INICIALIZAR CALENDARIO
        // ========================================
        loadBookedAppointments().then(() => {
            renderCalendar(currentMonth, currentYear);
        });

    } // fin if (calendarDays ...)

    // ========================================
    // GOOGLE MAPS — SECCIÓN CONTACTO
    // ========================================
    (function initGoogleMaps() {
        const MAP_CONFIG = {
            center:  { lat: -31.4490, lng: -60.9309 },
            zoom:    CONFIG.MAP_ZOOM,
            // ⚠️ Reemplazar con tu API Key real.
            // Restringir en Google Cloud Console a: pieldemar.com, www.pieldemar.com
            apiKey:  CONFIG.MAP_API_KEY
        };

        const mapContainer   = document.getElementById('map');
        const mapPlaceholder = document.getElementById('mapPlaceholder');

        if (!mapContainer) return;
        if (MAP_CONFIG.apiKey === 'TU_API_KEY_AQUI') {
            // Sin API key configurada: mostrar solo el placeholder
            return;
        }

        let mapLoaded = false;

        function _initMapInternal() {
            if (mapLoaded) return;
            mapLoaded = true;

            try {
                const map = new google.maps.Map(mapContainer, {
                    center:              MAP_CONFIG.center,
                    zoom:                MAP_CONFIG.zoom,
                    mapTypeControl:      false,
                    streetViewControl:   false,
                    fullscreenControl:   true,
                    styles: [
                        {
                            featureType: 'water',
                            elementType: 'geometry',
                            stylers: [{ color: '#94d1d8' }]
                        },
                        {
                            featureType: 'landscape',
                            elementType: 'geometry',
                            stylers: [{ color: '#efefed' }]
                        }
                    ]
                });

                const marker = new google.maps.Marker({
                    position:  MAP_CONFIG.center,
                    map:       map,
                    title:     'Piel de Mar',
                    animation: google.maps.Animation.DROP
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="font-family:Arial,sans-serif;padding:10px;">
                            <h3 style="margin:0 0 8px;color:#054954;">${escapeHtml('Piel de Mar')}</h3>
                            <p style="margin:0;color:#24436a;">
                                ${escapeHtml('Cullen 1619')}<br>
                                ${escapeHtml('Esperanza, Santa Fe')}
                            </p>
                            <p style="margin:8px 0 0;font-size:.9rem;">
                                <a href="https://www.google.com/maps/dir/?api=1&destination=Cullen+1619,+Esperanza,+Santa+Fe,+Argentina"
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   style="color:#054954;text-decoration:none;font-weight:bold;">
                                    Cómo llegar →
                                </a>
                            </p>
                        </div>
                    `
                });

                marker.addListener('click', () => infoWindow.open(map, marker));

                mapContainer.classList.add('loaded');
                if (mapPlaceholder) mapPlaceholder.style.display = 'none';

            } catch {
                // Error al cargar el mapa — el placeholder permanece visible
            }
        }

        const callbackName = '_pdmMapReady';
        window[callbackName] = _initMapInternal;
        const mapObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                mapObserver.disconnect();

                const script   = document.createElement('script');
                script.src     = `https://maps.googleapis.com/maps/api/js?key=${MAP_CONFIG.apiKey}&callback=${callbackName}`;
                script.async   = true;
                script.defer   = true;
                script.onerror = () => {
                    // Error de red al cargar Maps — el placeholder permanece
                };
                document.head.appendChild(script);
            }
        }, { threshold: 0.1 });

        mapObserver.observe(mapContainer);

    })(); 
});