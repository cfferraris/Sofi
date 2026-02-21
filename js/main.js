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

// ========================================
// SISTEMA DE TURNOS - CALENDARIO Y RESERVAS
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    // ========================================
    // ELEMENTOS DEL DOM
    // ========================================
    const calendarDays       = document.getElementById('calendarDays');
    const currentMonthEl     = document.getElementById('currentMonth');
    const prevMonthBtn       = document.getElementById('prevMonth');
    const nextMonthBtn       = document.getElementById('nextMonth');
    const timeSelector       = document.getElementById('timeSelector');
    const timeSlots          = document.getElementById('timeSlots');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const appointmentForm    = document.getElementById('appointmentForm');
    const appointmentsPlaceholder = document.getElementById('appointmentsPlaceholder');
    const reservationForm    = document.getElementById('reservationForm');
    const cancelBtn          = document.getElementById('cancelBtn');
    const summaryText        = document.getElementById('summaryText');

    if (!calendarDays) return; // No ejecutar si no está la sección de turnos

    // ========================================
    // ESTADO DEL CALENDARIO
    // ========================================
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear  = today.getFullYear();
    let selectedDate = null;
    let selectedTime = null;

    // ========================================
    // HORARIOS Y TURNOS OCUPADOS
    // ========================================
    const WORK_HOURS = {
        start: 9,
        end: 18,
        interval: 1 // cada 1 hora
    };

    // Simulación de turnos ocupados (se cargará desde appointments.json)
    let bookedAppointments = {};

    // Cargar turnos desde JSON
    async function loadBookedAppointments() {
        try {
            const response = await fetch('data/appointments.json');
            if (response.ok) {
                bookedAppointments = await response.json();
            }
        } catch (error) {
            console.log('No se pudo cargar appointments.json, usando datos vacíos');
            bookedAppointments = {
                "2025-03-15": ["10:00", "14:00"],
                "2025-03-16": ["11:00", "15:00", "16:00"]
            };
        }
    }

    // ========================================
    // RENDERIZAR CALENDARIO
    // ========================================
    function renderCalendar(month, year) {
        calendarDays.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const lastMonthDays = new Date(year, month, 0).getDate();

        // Nombre del mes
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;

        // Calcular día de inicio (lunes = 0)
        const startDay = firstDay === 0 ? 6 : firstDay - 1;

        // Días del mes anterior (grises)
        for (let i = startDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.classList.add('calendar-day', 'empty');
            day.textContent = lastMonthDays - i;
            calendarDays.appendChild(day);
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.textContent = day;
            dayEl.setAttribute('role', 'gridcell');

            const date = new Date(year, month, day);
            const dateString = formatDate(date);
            const dayOfWeek = date.getDay();

            // Marcar hoy
            if (isSameDay(date, today)) {
                dayEl.classList.add('today');
            }

            // Deshabilitar:
            // - Días pasados
            // - Fines de semana (sábado=6, domingo=0)
            // - Días fuera del rango (próximo mes solamente)
            if (date < today || dayOfWeek === 0 || dayOfWeek === 6 || isOutOfRange(date)) {
                dayEl.classList.add('disabled');
            } else {
                dayEl.addEventListener('click', () => selectDate(date, dayEl));
            }

            calendarDays.appendChild(dayEl);
        }

        // Deshabilitar botones según mes
        prevMonthBtn.disabled = (month === today.getMonth() && year === today.getFullYear());
        nextMonthBtn.disabled = (month === today.getMonth() + 1 && year === today.getFullYear());
    }

    // ========================================
    // HELPERS DE FECHA
    // ========================================
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateDisplay(date) {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`;
    }

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    function isOutOfRange(date) {
        const maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + 1);
        return date > maxDate;
    }

    // ========================================
    // SELECCIONAR FECHA
    // ========================================
    function selectDate(date, dayEl) {
        // Remover selección anterior
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Marcar nueva selección
        dayEl.classList.add('selected');
        selectedDate = date;
        selectedTime = null;

        // Mostrar selector de horarios
        appointmentsPlaceholder.style.display = 'none';
        appointmentForm.style.display = 'none';
        timeSelector.style.display = 'block';

        selectedDateDisplay.textContent = formatDateDisplay(date);
        renderTimeSlots(date);
    }

    // ========================================
    // RENDERIZAR HORARIOS
    // ========================================
    function renderTimeSlots(date) {
        timeSlots.innerHTML = '';
        const dateString = formatDate(date);
        const booked = bookedAppointments[dateString] || [];

        for (let hour = WORK_HOURS.start; hour < WORK_HOURS.end; hour += WORK_HOURS.interval) {
            const timeString = `${String(hour).padStart(2, '0')}:00`;
            const slotEl = document.createElement('button');
            slotEl.classList.add('time-slot');
            slotEl.textContent = timeString;
            slotEl.type = 'button';

            if (booked.includes(timeString)) {
                slotEl.classList.add('taken');
                slotEl.disabled = true;
            } else {
                slotEl.addEventListener('click', () => selectTime(timeString, slotEl));
            }

            timeSlots.appendChild(slotEl);
        }
    }

    // ========================================
    // SELECCIONAR HORARIO
    // ========================================
    function selectTime(time, slotEl) {
        // Remover selección anterior
        document.querySelectorAll('.time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });

        slotEl.classList.add('selected');
        selectedTime = time;

        // Mostrar formulario
        timeSelector.style.display = 'none';
        appointmentForm.style.display = 'block';

        // Actualizar resumen
        summaryText.textContent = `${formatDateDisplay(selectedDate)} a las ${selectedTime}`;

        // Reinicializar íconos de Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // ========================================
    // NAVEGACIÓN DEL CALENDARIO
    // ========================================
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    // ========================================
    // FORMULARIO DE RESERVA
    // ========================================
    cancelBtn.addEventListener('click', () => {
        appointmentForm.style.display = 'none';
        timeSelector.style.display = 'block';
        reservationForm.reset();
    });

    reservationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            date: formatDate(selectedDate),
            time: selectedTime,
            patientName: document.getElementById('patientName').value,
            patientEmail: document.getElementById('patientEmail').value,
            patientPhone: document.getElementById('patientPhone').value,
            childName: document.getElementById('childName').value,
            childAge: document.getElementById('childAge').value,
            consultReason: document.getElementById('consultReason').value
        };

        // Aquí irá la lógica para guardar en appointments.json
        // Por ahora solo simularemos la reserva
        console.log('Reserva confirmada:', formData);

        // Agregar a turnos ocupados localmente
        const dateString = formatDate(selectedDate);
        if (!bookedAppointments[dateString]) {
            bookedAppointments[dateString] = [];
        }
        bookedAppointments[dateString].push(selectedTime);

        // Guardar en JSON (necesitará backend)
        await saveAppointment(formData);

        // Mostrar confirmación
        alert(`✅ ¡Turno confirmado!\n\n${formatDateDisplay(selectedDate)} a las ${selectedTime}\n\nTe enviamos un email de confirmación a ${formData.patientEmail}`);

        // Reset
        reservationForm.reset();
        appointmentForm.style.display = 'none';
        appointmentsPlaceholder.style.display = 'flex';
        selectedDate = null;
        selectedTime = null;
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });
    });

    // ========================================
    // GUARDAR TURNO (requiere backend)
    // ========================================
    async function saveAppointment(data) {
        try {
            // Intentar guardar en el servidor
            const response = await fetch('api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Error al guardar el turno');
            }
        } catch (error) {
            console.log('Modo demo: turno guardado solo en memoria local');
            // En producción, aquí deberías mostrar un mensaje al usuario
            // sobre guardar en localStorage o similar
        }
    }

    // ========================================
    // INICIALIZACIÓN
    // ========================================
    loadBookedAppointments().then(() => {
        renderCalendar(currentMonth, currentYear);
    });

});
// ========================================
// GOOGLE MAPS - SECCIÓN CONTACTO
// ========================================

// Configuración del mapa
const MAP_CONFIG = {
    // Coordenadas de Cullen 1619, Esperanza, Santa Fe
    center: { lat: -31.4490, lng: -60.9309 },
    zoom: 16,
    // API Key - REEMPLAZAR con tu clave real
    apiKey: 'TU_API_KEY_AQUI'
};

// Inicializar mapa cuando está disponible
function initMap() {
    const mapContainer = document.getElementById('map');
    const mapPlaceholder = document.getElementById('mapPlaceholder');
    
    if (!mapContainer) return;

    // Verificar si hay API key configurada
    if (MAP_CONFIG.apiKey === 'TU_API_KEY_AQUI') {
        console.log('⚠️ Configurá tu Google Maps API Key en MAP_CONFIG.apiKey');
        return;
    }

    try {
        // Crear el mapa
        const map = new google.maps.Map(mapContainer, {
            center: MAP_CONFIG.center,
            zoom: MAP_CONFIG.zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
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

        // Agregar marcador
        const marker = new google.maps.Marker({
            position: MAP_CONFIG.center,
            map: map,
            title: 'Piel de Mar',
            animation: google.maps.Animation.DROP
        });

        // Info window al hacer clic en el marcador
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="font-family: Arial, sans-serif; padding: 10px;">
                    <h3 style="margin: 0 0 8px 0; color: #054954;">Piel de Mar</h3>
                    <p style="margin: 0; color: #24436a;">Cullen 1619<br>Esperanza, Santa Fe</p>
                    <p style="margin: 8px 0 0 0; font-size: 0.9rem;">
                        <a href="https://www.google.com/maps/dir/?api=1&destination=Cullen+1619,+Esperanza,+Santa+Fe,+Argentina" 
                           target="_blank" 
                           style="color: #054954; text-decoration: none; font-weight: bold;">
                            Cómo llegar →
                        </a>
                    </p>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        // Marcar como cargado y ocultar placeholder
        mapContainer.classList.add('loaded');
        if (mapPlaceholder) {
            mapPlaceholder.style.display = 'none';
        }

        console.log('✅ Google Maps cargado correctamente');

    } catch (error) {
        console.error('Error al cargar Google Maps:', error);
    }
}

// Cargar el script de Google Maps dinámicamente
function loadGoogleMaps() {
    // Solo cargar si hay API key configurada
    if (MAP_CONFIG.apiKey === 'TU_API_KEY_AQUI') {
        return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAP_CONFIG.apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// Inicializar cuando el DOM esté listo
if (document.getElementById('map')) {
    // Esperar un poco para que termine la transición del hero
    setTimeout(loadGoogleMaps, 2000);
}

// Hacer initMap disponible globalmente para el callback de Google Maps
window.initMap = initMap;