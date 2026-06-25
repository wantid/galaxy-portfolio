const SCROLL_COLLAPSE_THRESHOLD = 5;

function updateCardOverflow(card, labels) {
    const body = card.querySelector('.carousel-card-body');
    const button = card.querySelector('[data-show-more]');
    if (!body || !button) return;

    if (card.classList.contains('is-expanded')) {
        button.textContent = labels.showLess;
        button.classList.remove('hidden');
        card.classList.remove('has-overflow');
        return;
    }

    button.textContent = labels.showMore;
    const hasOverflow = body.scrollHeight > body.clientHeight + 1;
    button.classList.toggle('hidden', !hasOverflow);
    card.classList.toggle('has-overflow', hasOverflow);
}

function collapseCard(card, labels) {
    card.classList.remove('is-expanded');
    updateCardOverflow(card, labels);
}

export function initCarouselCards(trackElement, options = {}) {
    if (!trackElement) return null;

    const labels = {
        showMore: options.showMoreLabel || 'Show more',
        showLess: options.showLessLabel || 'Show less',
    };

    const cards = Array.from(trackElement.querySelectorAll('[data-card]'));
    let lastScrollLeft = trackElement.scrollLeft;
    let expandedCard = null;

    const collapseAll = () => {
        cards.forEach((card) => collapseCard(card, labels));
        expandedCard = null;
    };

    const expandCard = (card) => {
        if (expandedCard && expandedCard !== card) {
            collapseCard(expandedCard, labels);
        }
        card.classList.add('is-expanded');
        expandedCard = card;
        updateCardOverflow(card, labels);
    };

    const toggleCard = (card) => {
        if (card.classList.contains('is-expanded')) {
            collapseCard(card, labels);
            expandedCard = null;
        } else {
            expandCard(card);
        }
    };

    cards.forEach((card) => {
        const button = card.querySelector('[data-show-more]');
        if (button) {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleCard(card);
            });
        }
        updateCardOverflow(card, labels);
    });

    const onScroll = () => {
        const delta = Math.abs(trackElement.scrollLeft - lastScrollLeft);
        if (delta > SCROLL_COLLAPSE_THRESHOLD && expandedCard) {
            collapseAll();
        }
        lastScrollLeft = trackElement.scrollLeft;
    };

    trackElement.addEventListener('scroll', onScroll, { passive: true });

    const dragCleanup = setupDragScroll(trackElement);

    const resizeObserver = new ResizeObserver(() => {
        cards.forEach((card) => updateCardOverflow(card, labels));
    });

    cards.forEach((card) => resizeObserver.observe(card));

    return {
        collapseAll,
        destroy() {
            trackElement.removeEventListener('scroll', onScroll);
            dragCleanup();
            resizeObserver.disconnect();
        },
    };
}

function isInteractiveDragTarget(target) {
    return target instanceof Element && target.closest('a, button, input, textarea, select, [data-show-more]');
}

function setupDragScroll(trackElement) {
    let isDragging = false;
    let hasDragged = false;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let rafId = null;

    const DRAG_SENSITIVITY = 0.92;
    const MOMENTUM_MULTIPLIER = 14;
    const MOMENTUM_FRICTION = 0.94;
    const MOMENTUM_MIN_VELOCITY = 0.35;
    // Plynnoe dovedenie do snap-tochki
    const SNAP_MIN_DURATION = 280;
    const SNAP_MAX_DURATION = 620;
    const SNAP_DURATION_PER_PX = 0.7;

    const cancelAnimation = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    };

    const clampScroll = (value) => {
        const maxScroll = trackElement.scrollWidth - trackElement.clientWidth;
        return Math.max(0, Math.min(value, maxScroll));
    };

    const setSnapEnabled = (enabled) => {
        trackElement.style.scrollSnapType = enabled ? '' : 'none';
    };

    // Blizhaishaya snap-pozitsiya (uchityvaet scroll-padding i vyravnivanie po levomu krayu kartochki)
    const getNearestSnapPosition = (reference) => {
        const cards = trackElement.querySelectorAll('[data-card]');
        if (!cards.length) return null;

        const styles = getComputedStyle(trackElement);
        const padding = parseFloat(styles.scrollPaddingLeft) || 0;
        const trackLeft = trackElement.getBoundingClientRect().left;
        const current = trackElement.scrollLeft;

        let best = null;
        let bestDist = Infinity;

        cards.forEach((card) => {
            const cardLeft = card.getBoundingClientRect().left;
            const snap = clampScroll(current + (cardLeft - trackLeft) - padding);
            const dist = Math.abs(snap - reference);
            if (dist < bestDist) {
                bestDist = dist;
                best = snap;
            }
        });

        return best;
    };

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    // Plavnyi tween do tselevoi pozitsii, posle - vozvrat CSS scroll-snap
    const animateToTarget = (target) => {
        cancelAnimation();

        const start = trackElement.scrollLeft;
        const distance = target - start;

        if (Math.abs(distance) < 1) {
            trackElement.scrollLeft = target;
            setSnapEnabled(true);
            return;
        }

        const duration = Math.min(
            SNAP_MAX_DURATION,
            Math.max(SNAP_MIN_DURATION, Math.abs(distance) * SNAP_DURATION_PER_PX)
        );
        const startTime = performance.now();

        const step = (now) => {
            const t = Math.min((now - startTime) / duration, 1);
            trackElement.scrollLeft = start + distance * easeOutCubic(t);

            if (t < 1) {
                rafId = requestAnimationFrame(step);
            } else {
                rafId = null;
                trackElement.scrollLeft = target;
                setSnapEnabled(true);
            }
        };

        rafId = requestAnimationFrame(step);
    };

    // Predskazyvaem tochku ostanovki inertsii i plavno snapim k blizhaishei kartochke
    const settleToSnap = () => {
        const projected = clampScroll(
            trackElement.scrollLeft + velocity / (1 - MOMENTUM_FRICTION)
        );
        const target = getNearestSnapPosition(projected);

        if (target === null) {
            setSnapEnabled(true);
            return;
        }

        animateToTarget(target);
    };

    const onMouseDown = (event) => {
        if (event.button !== 0) return;
        if (isInteractiveDragTarget(event.target)) return;

        cancelAnimation();
        isDragging = true;
        hasDragged = false;
        lastX = event.pageX;
        lastTime = performance.now();
        velocity = 0;
        setSnapEnabled(false);
        trackElement.classList.add('is-dragging');
    };

    const onMouseMove = (event) => {
        if (!isDragging) return;

        const now = performance.now();
        const deltaX = (event.pageX - lastX) * DRAG_SENSITIVITY;

        if (Math.abs(deltaX) > 1) {
            hasDragged = true;
        }

        trackElement.scrollLeft = clampScroll(trackElement.scrollLeft - deltaX);

        const elapsed = now - lastTime;
        if (elapsed > 0) {
            const instantVelocity = (-deltaX / elapsed) * MOMENTUM_MULTIPLIER;
            velocity = velocity * 0.25 + instantVelocity * 0.75;
        }

        lastX = event.pageX;
        lastTime = now;
    };

    const endDrag = () => {
        if (!isDragging) return;

        isDragging = false;
        trackElement.classList.remove('is-dragging');

        // Posle lyubogo peremescheniya - plavno dovodim do blizhaishei kartochki
        if (hasDragged) {
            settleToSnap();
            return;
        }

        setSnapEnabled(true);
    };

    const onClickCapture = (event) => {
        if (!hasDragged) return;
        event.preventDefault();
        event.stopPropagation();
        hasDragged = false;
    };

    trackElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endDrag);
    trackElement.addEventListener('click', onClickCapture, true);

    return () => {
        cancelAnimation();
        trackElement.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', endDrag);
        trackElement.removeEventListener('click', onClickCapture, true);
        trackElement.classList.remove('is-dragging');
        setSnapEnabled(true);
    };
}
