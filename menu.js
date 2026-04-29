(function () {
    var trigger = document.getElementById('menuTrigger');
    var overlay = document.getElementById('menuOverlay');
    var counter = document.getElementById('menuCounter');
    var cursor  = document.getElementById('menuCursor');
    if (!trigger || !overlay) return;

    var items  = [...overlay.querySelectorAll('.menu-nav-item')];
    var isOpen = false;

    /* ── Active page marker ── */
    var page = window.location.pathname.split('/').pop() || 'index.html';
    items.forEach(function (item) {
        if (item.dataset.href === page) item.dataset.active = '1';
    });

    /* ── Open / close ── */
    function open() {
        isOpen = true;
        trigger.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        trigger.setAttribute('aria-label', 'Menu sluiten');
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        isOpen = false;
        trigger.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-label', 'Menu openen');
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        clearHover();
    }

    trigger.addEventListener('click', function () { isOpen ? close() : open(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });
    overlay.querySelectorAll('.menu-nav-link').forEach(function (l) {
        l.addEventListener('click', close);
    });

    /* ── Photo / hover state ── */
    function clearHover() {
        items.forEach(function (el) { el.classList.remove('is-hovered'); });
        overlay.classList.remove('has-hover');
        overlay.querySelectorAll('.menu-nav-photo').forEach(function (p) {
            p.classList.remove('is-visible');
        });
        if (counter) counter.textContent = '01';
    }

    items.forEach(function (item) {
        var photo = document.getElementById(item.dataset.photo);
        var idx   = item.dataset.idx || '01';

        item.addEventListener('mouseenter', function () {
            items.forEach(function (el) { el.classList.remove('is-hovered'); });
            overlay.querySelectorAll('.menu-nav-photo').forEach(function (p) {
                p.classList.remove('is-visible');
            });
            item.classList.add('is-hovered');
            overlay.classList.add('has-hover');
            if (photo) photo.classList.add('is-visible');
            if (counter) counter.textContent = idx;
        });

        item.addEventListener('mouseleave', function () {
            item.classList.remove('is-hovered');
            if (photo) photo.classList.remove('is-visible');
            if (!items.some(function (el) { return el.classList.contains('is-hovered'); })) {
                overlay.classList.remove('has-hover');
                if (counter) counter.textContent = '01';
            }
        });
    });

    /* ── Custom cursor (lerp) ── */
    if (!cursor) return;
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var cx = mx, cy = my;

    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    overlay.addEventListener('mouseenter', function () { cursor.classList.add('is-active'); });
    overlay.addEventListener('mouseleave', function () { cursor.classList.remove('is-active', 'is-hover'); });

    overlay.querySelectorAll('.menu-nav-link, .menu-footer-meta a').forEach(function (el) {
        el.addEventListener('mouseenter', function () { cursor.classList.add('is-hover'); });
        el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
    });

    (function loop() {
        cx += (mx - cx) * 0.12;
        cy += (my - cy) * 0.12;
        cursor.style.left = cx + 'px';
        cursor.style.top  = cy + 'px';
        requestAnimationFrame(loop);
    })();
})();
