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
    // Contenido de terceros (juegos, videos): el <iframe> se crea recién cuando el recurso se abre.
    // Solo se aceptan estos orígenes; deben coincidir con frame-src de la CSP.
    const ALLOWED_EMBEDS = {
        'wordwall.net': { allow: 'fullscreen' },
        'www.youtube-nocookie.com': { allow: 'fullscreen; encrypted-media; picture-in-picture' }
    };
    function loadEmbed(box) {
        if (box.dataset.embedLoaded) return;
        let url;
        try { url = new URL(box.dataset.embedSrc, location.href); } catch (e) { return; }
        const rule = url.protocol === 'https:' ? ALLOWED_EMBEDS[url.hostname] : null;
        if (!rule) return;
        const frame = document.createElement('iframe');
        frame.src = url.href;
        frame.title = box.dataset.embedTitle || 'Contenido incrustado';
        frame.allow = rule.allow;
        frame.setAttribute('allowfullscreen', '');
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-presentation');
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.loading = 'lazy';
        box.dataset.embedLoaded = 'true';
        box.prepend(frame);
        const note = box.querySelector('.library-embed-note');
        if (note) note.remove();
    }
    document.querySelectorAll('details.library-item').forEach((item) => {
        const box = item.querySelector('.library-embed[data-embed-src]');
        if (!box) return;
        item.addEventListener('toggle', () => { if (item.open) loadEmbed(box); });
        if (item.open) loadEmbed(box);
    });

    window.addEventListener('hashchange', openFromHash);
    openFromHash();
})();
