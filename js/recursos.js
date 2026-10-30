// Biblioteca de recursos — mejora progresiva sobre <details>.
// Sin JavaScript las secciones y recursos siguen abriéndose y cerrándose con el navegador.
(() => {
    const sections = Array.from(document.querySelectorAll('details.library-section'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Solo una sección abierta (respaldo para navegadores sin <details name>).
    sections.forEach((section) => {
        section.addEventListener('toggle', () => {
            if (!section.open) return;
            sections.forEach((other) => {
                if (other !== section) other.open = false;
            });
        });
    });

    // Abrir lo que indica la URL (#seccion o #recurso), p. ej. desde las tarjetas de la página principal.
    function openFromHash() {
        const id = decodeURIComponent(location.hash.slice(1));
        const target = id ? document.getElementById(id) : null;
        if (!target) return;
        const section = target.closest('details.library-section');
        if (!section) return;
        section.open = true;
        if (target.matches('details.library-item')) target.open = true;
        window.requestAnimationFrame(() => {
            target.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
        });
    }
    window.addEventListener('hashchange', openFromHash);
    openFromHash();
})();
