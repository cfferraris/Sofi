// ========================================
// PIEL DE MAR - Main JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================
    // ELEMENTOS DEL DOM
    // ========================================
    const hero = document.getElementById('hero');
    const logoContainer = document.querySelector('.logo-container');
    const mainLogo = document.getElementById('mainLogo');
    const navbar = document.getElementById('navbar');
    const mainContent = document.getElementById('mainContent');
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // ========================================
    // VARIABLES DE CONTROL
    // ========================================
    let transitionTriggered = false;
    
    // ========================================
    // FUNCIÓN PRINCIPAL DE TRANSICIÓN
    // ========================================
    function triggerTransition() {
        if (transitionTriggered) return;
        transitionTriggered = true;
        
        // 1. Animar el logo hacia la esquina
        logoContainer.classList.add('transitioning');
        
        // 2. Después de 0.6s, hacer fade out del logo principal
        setTimeout(() => {
            mainLogo.classList.add('morphing');
        }, 600);
        
        // 3. Después de 1s, mostrar el isotipo en navbar
        setTimeout(() => {
            navbar.classList.add('visible');
        }, 1000);
        
        // 4. Después de 1.3s, mostrar el contenido principal
        setTimeout(() => {
            mainContent.classList.add('visible');
        }, 1300);
        
        // 5. Después de 1.5s, ocultar el hero completamente
        setTimeout(() => {
            hero.style.display = 'none';
        }, 1500);
    }
    
    // ========================================
    // LISTENERS PARA ACTIVAR LA TRANSICIÓN
    // ========================================
    
    // Por clic en el hero
    hero.addEventListener('click', triggerTransition);
    
    // Automático después de 5 segundos
    setTimeout(triggerTransition, 5000);
    
    // ========================================
    // MENÚ HAMBURGUESA (MOBILE)
    // ========================================
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Cerrar menú al hacer clic en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // ========================================
    // SMOOTH SCROLL PARA NAVEGACIÓN
    // ========================================
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const navbarHeight = navbar.offsetHeight;
                const targetPosition = targetSection.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ========================================
    // CAMBIO DE ESTILO DEL NAVBAR AL SCROLL
    // ========================================
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Agregar sombra al navbar cuando se hace scroll
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(5, 73, 84, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
    
    // ========================================
    // ANIMACIÓN DE ENTRADA PARA ELEMENTOS
    // ========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar las tarjetas de servicios y mapadres
    const serviceCards = document.querySelectorAll('.service-card, .mapadres-card');
    serviceCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
    // ========================================
    // PREVENIR SCROLL DURANTE EL HERO
    // ========================================
    if (!transitionTriggered) {
        document.body.style.overflow = 'hidden';
    }
    
    // Habilitar scroll después de la transición
    setTimeout(() => {
    document.body.style.overflow = 'auto';
    }, 1500);

    // ========================================
    // INICIALIZAR LUCIDE ICONS
    // ========================================
    lucide.createIcons();
});