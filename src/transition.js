import html2canvas from 'html2canvas';

function fixCaptureClone(doc) {
    doc.querySelectorAll('.welcome-hero, .hero-image, .welcome-about, .welcome-work, .welcome-projects, .welcome-skills, .welcome-education, .welcome-contacts').forEach((el) => {
        el.style.animation = 'none';
        el.style.opacity = '1';
    });

    const heroImage = doc.querySelector('.hero-image');
    if (heroImage) {
        heroImage.style.opacity = '1';
    }
}

function createViewportCanvas(backgroundColor) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
    }
    return { canvas, ctx, width, height };
}

function isCaptureVisible(el) {
    if (!el || el.classList.contains('hidden')) {
        return false;
    }
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function waitForLayoutPaint() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

function paintSnapshotOnOverlay(overlay, sourceCanvas) {
    if (!overlay || !sourceCanvas) {
        return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(sourceCanvas, 0, 0, width, height);
    overlay.replaceChildren(canvas);
}

function applyWelcomeScrollCaptureState(welcomePage, scrollTop) {
    const content = welcomePage.querySelector('.welcome-content');
    const saved = {
        scrollTop,
        overflow: welcomePage.style.overflow,
        height: welcomePage.style.height,
        contentMarginTop: content?.style.marginTop ?? '',
        contentTransform: content?.style.transform ?? '',
    };

    welcomePage.scrollTop = 0;
    welcomePage.style.overflow = 'hidden';
    welcomePage.style.height = `${window.innerHeight}px`;

    if (content) {
        content.style.transform = 'none';
        content.style.marginTop = scrollTop > 0 ? `-${scrollTop}px` : '';
    }

    return saved;
}

function restoreWelcomeScrollCaptureState(welcomePage, saved) {
    const content = welcomePage.querySelector('.welcome-content');
    welcomePage.scrollTop = saved.scrollTop;
    welcomePage.style.overflow = saved.overflow;
    welcomePage.style.height = saved.height;

    if (content) {
        content.style.marginTop = saved.contentMarginTop;
        content.style.transform = saved.contentTransform;
    }
}

function drawCapturedLayer(ctx, snapshot, rect) {
    const viewportWidth = ctx.canvas.width;
    const viewportHeight = ctx.canvas.height;

    const visLeft = Math.max(0, rect.left);
    const visTop = Math.max(0, rect.top);
    const visRight = Math.min(viewportWidth, rect.right);
    const visBottom = Math.min(viewportHeight, rect.bottom);
    const visWidth = visRight - visLeft;
    const visHeight = visBottom - visTop;

    if (visWidth <= 0 || visHeight <= 0 || rect.width <= 0 || rect.height <= 0) {
        return;
    }

    const scaleX = snapshot.width / rect.width;
    const scaleY = snapshot.height / rect.height;
    const srcX = (visLeft - rect.left) * scaleX;
    const srcY = (visTop - rect.top) * scaleY;
    const srcW = visWidth * scaleX;
    const srcH = visHeight * scaleY;

    ctx.drawImage(snapshot, srcX, srcY, srcW, srcH, visLeft, visTop, visWidth, visHeight);
}

async function captureDomElement(el, { onclone, backgroundColor = null } = {}) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
        return null;
    }

    try {
        const snapshot = await html2canvas(el, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
            backgroundColor,
            ignoreElements: (node) => node.id === 'transition-overlay',
            onclone,
        });
        return { snapshot, rect };
    } catch (error) {
        console.warn('Could not capture DOM element:', el.id || el.className, error);
        return null;
    }
}

export async function captureWelcomeSnapshot(welcomePage, bottomActions, overlay = null) {
    if (!welcomePage) return null;

    const { canvas, ctx, width, height } = createViewportCanvas('#fafafa');
    const scrollTop = welcomePage.scrollTop;
    const savedState = applyWelcomeScrollCaptureState(welcomePage, scrollTop);
    let captureSucceeded = false;

    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    await waitForLayoutPaint();

    try {
        const welcomeSnapshot = await html2canvas(welcomePage, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#fafafa',
            width,
            height,
            windowWidth: width,
            windowHeight: height,
            ignoreElements: (node) => node.id === 'transition-overlay',
            onclone: fixCaptureClone,
        });

        ctx.drawImage(welcomeSnapshot, 0, 0, width, height);

        if (bottomActions && isCaptureVisible(bottomActions)) {
            const captured = await captureDomElement(bottomActions, { backgroundColor: null });
            if (captured) {
                drawCapturedLayer(ctx, captured.snapshot, captured.rect);
            }
        }

        captureSucceeded = true;
    } catch (error) {
        console.error('Welcome capture failed:', error);
        return null;
    } finally {
        if (captureSucceeded) {
            paintSnapshotOnOverlay(overlay, canvas);
        }
        restoreWelcomeScrollCaptureState(welcomePage, savedState);
    }

    return canvas;
}

export function captureUniverseSnapshot(scene3D) {
    const { canvas, ctx, width, height } = createViewportCanvas('#000000');
    const canvas3D = document.getElementById('canvas');

    if (canvas3D && scene3D?.renderer) {
        scene3D.renderFrame();
        try {
            ctx.drawImage(canvas3D, 0, 0, width, height);
        } catch (error) {
            console.warn('Could not copy WebGL canvas:', error);
        }
    }

    return canvas;
}

export async function runDoomMelt({ sourceCanvas, overlay, onSwitch, onComplete, waitForPaint }) {
    if (!sourceCanvas) {
        await onSwitch?.();
        onComplete?.(overlay);
        return;
    }

    if (!overlay) {
        await onSwitch?.();
        onComplete?.(null);
        return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    const meltCanvas = document.createElement('canvas');
    meltCanvas.width = width;
    meltCanvas.height = height;
    meltCanvas.getContext('2d').drawImage(sourceCanvas, 0, 0, width, height);

    let canvas = overlay.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        overlay.replaceChildren(canvas);
    }

    const ctx = canvas.getContext('2d');
    ctx.drawImage(meltCanvas, 0, 0, width, height);

    await onSwitch?.();
    await waitForPaint(2);

    ctx.drawImage(meltCanvas, 0, 0, width, height);
    await waitForPaint(1);

    const colSize = 4;
    const columns = Math.ceil(width / colSize);
    const maxDev = Math.max(24, Math.floor(height * 0.08));
    const maxDiff = 24;
    const fallSpeed = Math.max(6, height * 0.018);
    const initialOffsets = [];

    const maxNegativeDrift = maxDev * 2;

    for (let col = 0; col < columns; col += 1) {
        if (col === 0) {
            initialOffsets[col] = -Math.floor(Math.random() * maxDev);
        } else {
            const drift = initialOffsets[col - 1]
                + (Math.floor(Math.random() * maxDiff) - maxDiff / 2);
            initialOffsets[col] = Math.max(-maxNegativeDrift, Math.min(0, drift));
        }
    }

    let meltFrame = 0;

    const animate = () => {
        try {
            ctx.clearRect(0, 0, width, height);

            let done = true;
            meltFrame += 1;

            for (let col = 0; col < columns; col += 1) {
                const columnOffset = initialOffsets[col] + (meltFrame * fallSpeed);

                let yPos = 0;
                if (columnOffset < 0) {
                    done = false;
                    yPos = 0;
                } else if (columnOffset < height) {
                    done = false;
                    yPos = columnOffset;
                } else {
                    continue;
                }

                const stripX = col * colSize;
                const stripWidth = Math.min(colSize, width - stripX);
                ctx.drawImage(
                    meltCanvas,
                    stripX,
                    0,
                    stripWidth,
                    height,
                    stripX,
                    yPos,
                    stripWidth,
                    height
                );
            }

            if (!done) {
                requestAnimationFrame(animate);
            } else {
                onComplete?.(overlay);
            }
        } catch (error) {
            console.error('Transition animation failed:', error);
            onComplete?.(overlay);
        }
    };

    requestAnimationFrame(animate);
}
