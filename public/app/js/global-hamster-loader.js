(function () {
    if (window.__globalHamsterLoaderReady) {
        return;
    }
    window.__globalHamsterLoaderReady = true;

    var OVERLAY_ID = 'globalLoadingOverlay';
    var TEMPLATE_ID = 'globalLoadingTemplate';
    var STYLE_ID = 'global-hamster-loader-style';
    var DEFAULT_TEXT = 'Vui lòng chờ trong giây lát...';
    var SHOW_DELAY_MS = 120;
    var INTENT_TTL_MS = 3500;
    var REQUEST_TIMEOUT_MS = 45000;
    var WATCHDOG_INTERVAL_MS = 1000;
    var MAX_VISIBLE_MS = 15000;

    var overlayEl = null;
    var textEl = null;
    var spinnerSlotEl = null;

    var activeRequestCount = 0;
    var manualShowDepth = 0;
    var showTimer = null;
    var pendingLoaderText = '';
    var intentExpireAt = 0;
    var requestSeq = 0;
    var requestTracker = Object.create(null);
    var overlayShownAt = 0;

    var hamsterMarkup = '' +
        '<div aria-label="Hamster running in a metal wheel" role="img" class="wheel-and-hamster">' +
        '<div class="wheel"></div>' +
        '<div class="hamster">' +
        '<div class="hamster__body">' +
        '<div class="hamster__head">' +
        '<div class="hamster__ear"></div>' +
        '<div class="hamster__eye"></div>' +
        '<div class="hamster__nose"></div>' +
        '</div>' +
        '<div class="hamster__limb hamster__limb--fr"></div>' +
        '<div class="hamster__limb hamster__limb--fl"></div>' +
        '<div class="hamster__limb hamster__limb--br"></div>' +
        '<div class="hamster__limb hamster__limb--bl"></div>' +
        '<div class="hamster__tail"></div>' +
        '</div>' +
        '</div>' +
        '<div class="spoke"></div>' +
        '</div>';

    function ensureStyle() {
        var style = document.getElementById(STYLE_ID);
        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            document.head.appendChild(style);
        }
        style.textContent = '' +
            '#' + OVERLAY_ID + '.global-loading-overlay{position:fixed;inset:0;background:rgba(15,23,42,.24)!important;backdrop-filter:blur(3px)!important;display:none;align-items:center;justify-content:center;flex-direction:column;z-index:2147483000}' +
            '#' + OVERLAY_ID + '.global-loading-overlay.is-visible{display:flex !important}' +
            '#' + OVERLAY_ID + ' .ghl-card{position:relative;overflow:hidden;width:min(92vw,340px)!important;background:linear-gradient(180deg,#ffffff,#f8fafc)!important;border:1px solid rgba(148,163,184,.35)!important;border-radius:16px!important;padding:16px 16px 14px!important;box-shadow:0 14px 32px rgba(15,23,42,.22)!important;text-align:center!important;color:#0f172a!important;backdrop-filter:blur(6px)!important}' +
            '#' + OVERLAY_ID + ' .ghl-card::before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(120px 70px at 50% -10%,rgba(56,189,248,.14),transparent 70%)}' +
            '#' + OVERLAY_ID + ' .ghl-card > *{position:relative;z-index:1}' +
            '#' + OVERLAY_ID + ' .ghl-title{margin:0 0 10px!important;font-size:21px!important;font-weight:700!important;line-height:1.15!important;color:#0f172a!important;letter-spacing:.005em!important;display:flex;align-items:center;justify-content:center}' +
            '#' + OVERLAY_ID + ' .ghl-title-dot{display:inline-block;width:7px;height:7px;border-radius:999px;background:#0ea5e9;box-shadow:0 0 0 5px rgba(14,165,233,.18);margin-right:8px;vertical-align:middle}' +
            '#' + OVERLAY_ID + ' .ghl-caption{font-size:11px;color:#64748b;letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:8px;opacity:.9}' +
            '#' + OVERLAY_ID + ' .loading-spinner-slot{display:flex;justify-content:center;align-items:center;min-height:130px;margin-top:2px}' +
            '#' + OVERLAY_ID + ' .ghl-divider{height:1px;background:linear-gradient(90deg,rgba(148,163,184,0),rgba(148,163,184,.45),rgba(148,163,184,0));margin:8px 0 2px;opacity:.9}' +
            '#' + OVERLAY_ID + ' .ghl-text{margin-top:10px!important;margin-bottom:2px!important;font-size:13px!important;font-weight:500!important;color:#334155!important;letter-spacing:.015em!important;line-height:1.35;opacity:.95!important}' +
            '#' + OVERLAY_ID + ' .ghl-text-sub{display:block;font-size:12px;color:#64748b;margin-top:4px;line-height:1.3;opacity:.92}' +
            '#' + OVERLAY_ID + ' .wheel-and-hamster{font-size:12px;filter:drop-shadow(0 6px 12px rgba(15,23,42,.2))}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(2,6,23,.62)!important}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + ' .ghl-card{background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(15,23,42,.9))!important;border:1px solid rgba(148,163,184,.22)!important;box-shadow:0 16px 38px rgba(2,6,23,.48)!important;color:#f8fafc!important}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + ' .ghl-title{color:#f8fafc!important}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + ' .ghl-caption{color:#94a3b8!important}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + ' .ghl-text{color:#cbd5e1!important}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + ' .ghl-text-sub{color:#94a3b8!important}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + ' .wheel-and-hamster{filter:drop-shadow(0 7px 16px rgba(0,0,0,.35))}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + ' .ghl-title-dot{background:#38bdf8;box-shadow:0 0 0 5px rgba(56,189,248,.18)}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + ' .ghl-divider{background:linear-gradient(90deg,rgba(148,163,184,0),rgba(148,163,184,.35),rgba(148,163,184,0))}' +
            'body[data-pc-theme="dark"] #' + OVERLAY_ID + ' .ghl-card::before{background:radial-gradient(120px 70px at 50% -10%,rgba(56,189,248,.12),transparent 70%)}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(15,23,42,.24)!important}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + ' .ghl-card{background:linear-gradient(180deg,#ffffff,#f8fafc)!important}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + ' .ghl-title{color:#0f172a!important}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + ' .ghl-caption{color:#64748b!important}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + ' .ghl-text{color:#334155!important}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + ' .ghl-text-sub{color:#64748b!important}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + ' .ghl-title-dot{background:#0ea5e9;box-shadow:0 0 0 5px rgba(14,165,233,.18)}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + ' .ghl-divider{background:linear-gradient(90deg,rgba(148,163,184,0),rgba(148,163,184,.45),rgba(148,163,184,0))}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + ' .ghl-card::before{background:radial-gradient(120px 70px at 50% -10%,rgba(56,189,248,.14),transparent 70%)}' +
            'body[data-pc-theme="light"] #' + OVERLAY_ID + ' .wheel-and-hamster{filter:drop-shadow(0 6px 12px rgba(15,23,42,.2))}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(15,23,42,.24)!important}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + ' .ghl-card{background:linear-gradient(180deg,#ffffff,#f8fafc)!important}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + ' .ghl-title{color:#0f172a!important}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + ' .ghl-caption{color:#64748b!important}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + ' .ghl-text{color:#334155!important}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + ' .ghl-text-sub{color:#64748b!important}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + ' .ghl-title-dot{background:#0ea5e9;box-shadow:0 0 0 5px rgba(14,165,233,.18)}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + ' .ghl-divider{background:linear-gradient(90deg,rgba(148,163,184,0),rgba(148,163,184,.45),rgba(148,163,184,0))}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + ' .ghl-card::before{background:radial-gradient(120px 70px at 50% -10%,rgba(56,189,248,.14),transparent 70%)}' +
            'body:not([data-pc-theme]) #' + OVERLAY_ID + ' .wheel-and-hamster{filter:drop-shadow(0 6px 12px rgba(15,23,42,.2))}' +
            'html[data-pc-theme="dark"] #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(2,6,23,.62)!important}' +
            'html[data-pc-theme="light"] #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(15,23,42,.24)!important}' +
            'html[data-theme="dark"] #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(2,6,23,.62)!important}' +
            'html[data-theme="light"] #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(15,23,42,.24)!important}' +
            'body.dark #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(2,6,23,.62)!important}' +
            'body.light #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(15,23,42,.24)!important}' +
            'html.dark #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(2,6,23,.62)!important}' +
            'html.light #' + OVERLAY_ID + '.global-loading-overlay{background:rgba(15,23,42,.24)!important}' +
            'body.dark #' + OVERLAY_ID + ' .ghl-card,html.dark #' + OVERLAY_ID + ' .ghl-card{background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(15,23,42,.9))!important;color:#f8fafc!important}' +
            'body.light #' + OVERLAY_ID + ' .ghl-card,html.light #' + OVERLAY_ID + ' .ghl-card{background:linear-gradient(180deg,#ffffff,#f8fafc)!important;color:#0f172a!important}' +
            'body.dark #' + OVERLAY_ID + ' .ghl-title,html.dark #' + OVERLAY_ID + ' .ghl-title{color:#f8fafc!important}' +
            'body.light #' + OVERLAY_ID + ' .ghl-title,html.light #' + OVERLAY_ID + ' .ghl-title{color:#0f172a!important}' +
            'body.dark #' + OVERLAY_ID + ' .ghl-text,html.dark #' + OVERLAY_ID + ' .ghl-text{color:#cbd5e1!important}' +
            'body.light #' + OVERLAY_ID + ' .ghl-text,html.light #' + OVERLAY_ID + ' .ghl-text{color:#334155!important}' +
            'body.dark #' + OVERLAY_ID + ' .ghl-caption,html.dark #' + OVERLAY_ID + ' .ghl-caption{color:#94a3b8!important}' +
            'body.light #' + OVERLAY_ID + ' .ghl-caption,html.light #' + OVERLAY_ID + ' .ghl-caption{color:#64748b!important}' +
            'body.dark #' + OVERLAY_ID + ' .ghl-text-sub,html.dark #' + OVERLAY_ID + ' .ghl-text-sub{color:#94a3b8!important}' +
            'body.light #' + OVERLAY_ID + ' .ghl-text-sub,html.light #' + OVERLAY_ID + ' .ghl-text-sub{color:#64748b!important}' +
            'body.dark #' + OVERLAY_ID + ' .ghl-title-dot,html.dark #' + OVERLAY_ID + ' .ghl-title-dot{background:#38bdf8;box-shadow:0 0 0 5px rgba(56,189,248,.18)}' +
            'body.light #' + OVERLAY_ID + ' .ghl-title-dot,html.light #' + OVERLAY_ID + ' .ghl-title-dot{background:#0ea5e9;box-shadow:0 0 0 5px rgba(14,165,233,.18)}' +
            'body.dark #' + OVERLAY_ID + ' .ghl-divider,html.dark #' + OVERLAY_ID + ' .ghl-divider{background:linear-gradient(90deg,rgba(148,163,184,0),rgba(148,163,184,.35),rgba(148,163,184,0))}' +
            'body.light #' + OVERLAY_ID + ' .ghl-divider,html.light #' + OVERLAY_ID + ' .ghl-divider{background:linear-gradient(90deg,rgba(148,163,184,0),rgba(148,163,184,.45),rgba(148,163,184,0))}' +
            'body.dark #' + OVERLAY_ID + ' .wheel-and-hamster,html.dark #' + OVERLAY_ID + ' .wheel-and-hamster{filter:drop-shadow(0 7px 16px rgba(0,0,0,.35))}' +
            'body.light #' + OVERLAY_ID + ' .wheel-and-hamster,html.light #' + OVERLAY_ID + ' .wheel-and-hamster{filter:drop-shadow(0 6px 12px rgba(15,23,42,.2))}' +
            '.loading-placeholder{display:flex;justify-content:center;align-items:center;min-height:200px}' +
            '.hamster-inline-replacement{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle}' +
            '.hamster-inline-replacement .wheel-and-hamster{font-size:5px;width:3.6em;height:3.6em}' +
            '.hamster-block-replacement{display:flex;align-items:center;justify-content:center;padding:.5rem 0}' +
            '.hamster-block-replacement .wheel-and-hamster{font-size:9px;width:8em;height:8em}' +
            '@media (max-width:576px){#' + OVERLAY_ID + ' .ghl-card{width:min(94vw,320px)!important;padding:14px 14px 12px!important}#' + OVERLAY_ID + ' .ghl-title{font-size:19px!important}}' +
            '.swal2-loader{display:none !important}' +
            '.wheel-and-hamster{--dur:1s;position:relative;width:12em;height:12em;font-size:14px}' +
            '.wheel,.hamster,.hamster div,.spoke{position:absolute}' +
            '.wheel,.spoke{border-radius:50%;top:0;left:0;width:100%;height:100%}' +
            '.wheel{background:radial-gradient(100% 100% at center,hsla(0,0%,60%,0) 47.8%,hsl(0,0%,60%) 48%);z-index:2}' +
            '.hamster{animation:hamster var(--dur) ease-in-out infinite;top:50%;left:calc(50% - 3.5em);width:7em;height:3.75em;transform:rotate(4deg) translate(-.8em,1.85em);transform-origin:50% 0;z-index:1}' +
            '.hamster__head{animation:hamsterHead var(--dur) ease-in-out infinite;background:hsl(30,90%,55%);border-radius:70% 30% 0 100%/40% 25% 25% 60%;box-shadow:0 -.25em 0 hsl(30,90%,80%) inset,.75em -1.55em 0 hsl(30,90%,90%) inset;top:0;left:-2em;width:2.75em;height:2.5em;transform-origin:100% 50%}' +
            '.hamster__ear{animation:hamsterEar var(--dur) ease-in-out infinite;background:hsl(0,90%,85%);border-radius:50%;box-shadow:-.25em 0 hsl(30,90%,55%) inset;top:-.25em;right:-.25em;width:.75em;height:.75em;transform-origin:50% 75%}' +
            '.hamster__eye{animation:hamsterEye var(--dur) linear infinite;background-color:#000;border-radius:50%;top:.375em;left:1.25em;width:.5em;height:.5em}' +
            '.hamster__nose{background:hsl(0,90%,75%);border-radius:35% 65% 85% 15%/70% 50% 50% 30%;top:.75em;left:0;width:.2em;height:.25em}' +
            '.hamster__body{animation:hamsterBody var(--dur) ease-in-out infinite;background:hsl(30,90%,90%);border-radius:50% 30% 50% 30%/15% 60% 40% 40%;box-shadow:.1em .75em 0 hsl(30,90%,55%) inset,.15em -.5em 0 hsl(30,90%,80%) inset;top:.25em;left:2em;width:4.5em;height:3em;transform-origin:17% 50%;transform-style:preserve-3d}' +
            '.hamster__limb--fr,.hamster__limb--fl{clip-path:polygon(0 0,100% 0,70% 80%,60% 100%,0 100%,40% 80%);top:2em;left:.5em;width:1em;height:1.5em;transform-origin:50% 0}' +
            '.hamster__limb--fr{animation:hamsterFRLimb var(--dur) linear infinite;background:linear-gradient(hsl(30,90%,80%) 80%,hsl(0,90%,75%) 80%);transform:rotate(15deg) translateZ(-1px)}' +
            '.hamster__limb--fl{animation:hamsterFLLimb var(--dur) linear infinite;background:linear-gradient(hsl(30,90%,90%) 80%,hsl(0,90%,85%) 80%);transform:rotate(15deg)}' +
            '.hamster__limb--br,.hamster__limb--bl{border-radius:.75em .75em 0 0;clip-path:polygon(0 0,100% 0,100% 30%,70% 90%,70% 100%,30% 100%,40% 90%,0 30%);top:1em;left:2.8em;width:1.5em;height:2.5em;transform-origin:50% 30%}' +
            '.hamster__limb--br{animation:hamsterBRLimb var(--dur) linear infinite;background:linear-gradient(hsl(30,90%,80%) 90%,hsl(0,90%,75%) 90%);transform:rotate(-25deg) translateZ(-1px)}' +
            '.hamster__limb--bl{animation:hamsterBLLimb var(--dur) linear infinite;background:linear-gradient(hsl(30,90%,90%) 90%,hsl(0,90%,85%) 90%);transform:rotate(-25deg)}' +
            '.hamster__tail{animation:hamsterTail var(--dur) linear infinite;background:hsl(0,90%,85%);border-radius:.25em 50% 50% .25em;box-shadow:0 -.2em 0 hsl(0,90%,75%) inset;top:1.5em;right:-.5em;width:1em;height:.5em;transform:rotate(30deg) translateZ(-1px);transform-origin:.25em .25em}' +
            '.spoke{animation:spoke var(--dur) linear infinite;background:radial-gradient(100% 100% at center,hsl(0,0%,60%) 4.8%,hsla(0,0%,60%,0) 5%),linear-gradient(hsla(0,0%,55%,0) 46.9%,hsl(0,0%,65%) 47% 52.9%,hsla(0,0%,65%,0) 53%) 50% 50%/99% 99% no-repeat}' +
            '@keyframes hamster{from,to{transform:rotate(4deg) translate(-.8em,1.85em)}50%{transform:rotate(0) translate(-.8em,1.85em)}}' +
            '@keyframes hamsterHead{from,25%,50%,75%,to{transform:rotate(0)}12.5%,37.5%,62.5%,87.5%{transform:rotate(8deg)}}' +
            '@keyframes hamsterEye{from,90%,to{transform:scaleY(1)}95%{transform:scaleY(0)}}' +
            '@keyframes hamsterEar{from,25%,50%,75%,to{transform:rotate(0)}12.5%,37.5%,62.5%,87.5%{transform:rotate(12deg)}}' +
            '@keyframes hamsterBody{from,25%,50%,75%,to{transform:rotate(0)}12.5%,37.5%,62.5%,87.5%{transform:rotate(-2deg)}}' +
            '@keyframes hamsterFRLimb{from,25%,50%,75%,to{transform:rotate(50deg) translateZ(-1px)}12.5%,37.5%,62.5%,87.5%{transform:rotate(-30deg) translateZ(-1px)}}' +
            '@keyframes hamsterFLLimb{from,25%,50%,75%,to{transform:rotate(-30deg)}12.5%,37.5%,62.5%,87.5%{transform:rotate(50deg)}}' +
            '@keyframes hamsterBRLimb{from,25%,50%,75%,to{transform:rotate(-60deg) translateZ(-1px)}12.5%,37.5%,62.5%,87.5%{transform:rotate(20deg) translateZ(-1px)}}' +
            '@keyframes hamsterBLLimb{from,25%,50%,75%,to{transform:rotate(20deg)}12.5%,37.5%,62.5%,87.5%{transform:rotate(-60deg)}}' +
            '@keyframes hamsterTail{from,25%,50%,75%,to{transform:rotate(30deg) translateZ(-1px)}12.5%,37.5%,62.5%,87.5%{transform:rotate(10deg) translateZ(-1px)}}' +
            '@keyframes spoke{from{transform:rotate(0)}to{transform:rotate(-1turn)}}';
    }

    function getOverlayMarkup() {
        return '' +
            '<div class="ghl-card">' +
            '<p class="ghl-title"><span class="ghl-title-dot"></span><span class="ghl-title-text">Đang xử lý</span></p>' +
            '<div class="ghl-caption">LOADING</div>' +
            '<div class="loading-spinner-slot"></div>' +
            '<div class="ghl-divider"></div>' +
            '<p class="ghl-text"><strong>' + DEFAULT_TEXT + '</strong><span class="ghl-text-sub">Hệ thống đang lấy dữ liệu mới nhất</span></p>' +
            '</div>';
    }

    function ensureTemplate() {
        var template = document.getElementById(TEMPLATE_ID);
        if (!template) {
            template = document.createElement('template');
            template.id = TEMPLATE_ID;
            template.innerHTML = hamsterMarkup;
            document.body.appendChild(template);
        } else if (!template.innerHTML || !template.innerHTML.trim()) {
            template.innerHTML = hamsterMarkup;
        }
        return template;
    }

    function ensureOverlay() {
        overlayEl = document.getElementById(OVERLAY_ID);
        if (!overlayEl) {
            overlayEl = document.createElement('div');
            overlayEl.id = OVERLAY_ID;
            overlayEl.className = 'global-loading-overlay';
            overlayEl.setAttribute('aria-hidden', 'true');
            overlayEl.innerHTML = getOverlayMarkup();
            document.body.appendChild(overlayEl);
        }

        if (!overlayEl.querySelector('.ghl-title') || !overlayEl.querySelector('.loading-spinner-slot') || !overlayEl.querySelector('.ghl-text')) {
            overlayEl.innerHTML = getOverlayMarkup();
        }
        overlayEl.className = 'global-loading-overlay';
        overlayEl.setAttribute('aria-hidden', overlayEl.classList.contains('is-visible') ? 'false' : 'true');

        textEl = overlayEl.querySelector('.ghl-text');
        spinnerSlotEl = overlayEl.querySelector('.loading-spinner-slot');

        var template = ensureTemplate();
        if (spinnerSlotEl && !spinnerSlotEl.dataset.loaderReady) {
            spinnerSlotEl.innerHTML = template.innerHTML;
            spinnerSlotEl.dataset.loaderReady = '1';
        }
    }

    function getHamsterLoaderHtml() {
        var template = document.getElementById(TEMPLATE_ID);
        if (template && template.innerHTML) {
            return template.innerHTML;
        }
        return hamsterMarkup;
    }

    function normalizeText(text) {
        var value = (text || '').toString().trim();
        return value || DEFAULT_TEXT;
    }

    function renderShow(text) {
        ensureOverlay();
        if (textEl) {
            textEl.textContent = normalizeText(text);
        }
        overlayEl.classList.add('is-visible');
        overlayEl.setAttribute('aria-hidden', 'false');
        overlayShownAt = Date.now();
    }

    function renderHide() {
        if (!overlayEl) {
            return;
        }
        overlayEl.classList.remove('is-visible');
        overlayEl.setAttribute('aria-hidden', 'true');
        overlayShownAt = 0;
    }

    function showGlobalLoader(text) {
        manualShowDepth += 1;
        renderShow(text);
    }

    function hideGlobalLoader() {
        manualShowDepth = Math.max(0, manualShowDepth - 1);
        if (manualShowDepth === 0 && activeRequestCount === 0) {
            renderHide();
        }
    }

    function setIntent(text) {
        intentExpireAt = Date.now() + INTENT_TTL_MS;
        if (text && String(text).trim()) {
            pendingLoaderText = String(text).trim();
        }
    }

    function hasIntent() {
        return Date.now() <= intentExpireAt;
    }

    function beginTrackedRequest(text) {
        requestSeq += 1;
        var requestId = requestSeq;
        var timeoutId = window.setTimeout(function () {
            endTrackedRequest(requestId);
        }, REQUEST_TIMEOUT_MS);

        requestTracker[requestId] = timeoutId;
        activeRequestCount += 1;
        var message = text || pendingLoaderText || DEFAULT_TEXT;
        pendingLoaderText = '';

        if (manualShowDepth > 0) {
            return;
        }
        if (showTimer) {
            return;
        }

        showTimer = window.setTimeout(function () {
            showTimer = null;
            if (activeRequestCount > 0 && manualShowDepth === 0) {
                renderShow(message);
            }
        }, SHOW_DELAY_MS);

        return requestId;
    }

    function endTrackedRequest(requestId) {
        if (requestId) {
            if (!requestTracker[requestId]) {
                return;
            }
            clearTimeout(requestTracker[requestId]);
            delete requestTracker[requestId];
        }

        activeRequestCount = Math.max(0, activeRequestCount - 1);
        if (activeRequestCount > 0) {
            return;
        }
        if (showTimer) {
            clearTimeout(showTimer);
            showTimer = null;
        }
        if (manualShowDepth === 0) {
            renderHide();
        }
    }

    function resetTrackedRequests() {
        var keys = Object.keys(requestTracker);
        for (var i = 0; i < keys.length; i++) {
            clearTimeout(requestTracker[keys[i]]);
            delete requestTracker[keys[i]];
        }
        activeRequestCount = 0;
    }

    function forceHideGlobalLoader() {
        resetTrackedRequests();
        manualShowDepth = 0;
        pendingLoaderText = '';
        intentExpireAt = 0;
        if (showTimer) {
            clearTimeout(showTimer);
            showTimer = null;
        }
        renderHide();
    }

    function hasVisibleSwal() {
        return !!document.querySelector('.swal2-container.swal2-shown');
    }

    function installGlobalWatchdog() {
        if (window.__globalHamsterWatchdogInstalled) {
            return;
        }
        window.__globalHamsterWatchdogInstalled = true;

        window.setInterval(function () {
            if (!overlayEl) {
                return;
            }

            if (manualShowDepth > 0 && !hasVisibleSwal()) {
                manualShowDepth = 0;
            }

            if (activeRequestCount === 0 && manualShowDepth === 0 && overlayEl.classList.contains('is-visible')) {
                renderHide();
            }

            if (overlayEl.classList.contains('is-visible') && overlayShownAt > 0) {
                var visibleMs = Date.now() - overlayShownAt;
                if (visibleMs > MAX_VISIBLE_MS) {
                    forceHideGlobalLoader();
                }
            }
        }, WATCHDOG_INTERVAL_MS);
    }

    function shouldSkipByHeaders(headersLike) {
        try {
            var headers = new Headers(headersLike || {});
            var skip = (headers.get('X-Skip-Global-Loader') || '').toLowerCase();
            return skip === '1' || skip === 'true';
        } catch (e) {
            return false;
        }
    }

    function hydrateHamsterSlots(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var nodes = scope.querySelectorAll('[data-hamster-loader]');
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.dataset.hamsterReady === '1') {
                continue;
            }
            node.classList.add('loading-placeholder');
            node.innerHTML = getHamsterLoaderHtml();
            node.dataset.hamsterReady = '1';
        }
    }

    function replaceLegacySpinners(root) {
        var selectors = '.fa-spinner.fa-spin,.spinner-border,.spinner-grow';
        var scope = root && root.querySelectorAll ? root : document;
        var nodes = [];

        if (root && root.nodeType === 1 && root.matches && root.matches(selectors)) {
            nodes.push(root);
        }
        var found = scope.querySelectorAll(selectors);
        for (var i = 0; i < found.length; i++) {
            nodes.push(found[i]);
        }

        for (var j = 0; j < nodes.length; j++) {
            var spinner = nodes[j];
            if (!spinner || !spinner.parentNode) {
                continue;
            }
            if (spinner.closest && spinner.closest('#' + OVERLAY_ID)) {
                continue;
            }
            if (spinner.dataset && spinner.dataset.hamsterReplaced === '1') {
                continue;
            }

            var wrapper = document.createElement('span');
            var inlineHost = spinner.closest && spinner.closest('button,.btn,a,.swal2-popup,.swal2-actions,.swal2-html-container');
            wrapper.className = inlineHost ? 'hamster-inline-replacement' : 'hamster-block-replacement';
            wrapper.innerHTML = getHamsterLoaderHtml();
            if (spinner.dataset) {
                spinner.dataset.hamsterReplaced = '1';
            }
            spinner.parentNode.replaceChild(wrapper, spinner);
        }
    }

    function installLegacySpinnerObserver() {
        replaceLegacySpinners(document);
        hydrateHamsterSlots(document);

        if (window.__hamsterLegacyObserverInstalled) {
            return;
        }
        window.__hamsterLegacyObserverInstalled = true;

        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (!mutation.addedNodes || mutation.addedNodes.length === 0) {
                    continue;
                }
                for (var j = 0; j < mutation.addedNodes.length; j++) {
                    var node = mutation.addedNodes[j];
                    if (!node || node.nodeType !== 1) {
                        continue;
                    }
                    replaceLegacySpinners(node);
                    hydrateHamsterSlots(node);
                }
            }
        });

        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function installIntentListeners() {
        document.addEventListener('click', function (event) {
            var trigger = event.target && event.target.closest
                ? event.target.closest('[data-loading-text], [data-show-loader], .btn-loading, button, input[type="button"], input[type="submit"], a[data-show-loader], a.btn-loading, [role="button"]')
                : null;
            if (!trigger) {
                return;
            }
            if (trigger.dataset && trigger.dataset.noLoader === 'true') {
                return;
            }
            var text = trigger.getAttribute('data-loading-text') || '';
            setIntent(text);
        }, true);

        document.addEventListener('submit', function (event) {
            var form = event.target;
            if (!form || form.tagName !== 'FORM') {
                return;
            }
            if (form.dataset && form.dataset.noLoader === 'true') {
                return;
            }
            var method = (form.getAttribute('method') || 'GET').toUpperCase();
            var hasExplicitLoaderAttr = form.hasAttribute('data-show-loader') || form.hasAttribute('data-loading-text');
            if (method === 'GET' && !hasExplicitLoaderAttr) {
                return;
            }
            var text = form.getAttribute('data-loading-text') || '';
            setIntent(text);
        }, true);
    }

    function installSwalHook() {
        if (!window.Swal || window.Swal.__globalHamsterWrapped) {
            return;
        }

        var swalLoaderDepth = 0;
        var originalFire = typeof window.Swal.fire === 'function'
            ? window.Swal.fire.bind(window.Swal)
            : null;
        var originalClose = typeof window.Swal.close === 'function'
            ? window.Swal.close.bind(window.Swal)
            : null;
        var originalHideLoading = typeof window.Swal.hideLoading === 'function'
            ? window.Swal.hideLoading.bind(window.Swal)
            : null;

        function clearSwalLoader() {
            while (swalLoaderDepth > 0) {
                swalLoaderDepth -= 1;
                hideGlobalLoader();
            }
        }

        window.Swal.fire = function () {
            clearSwalLoader();
            if (originalFire) {
                return originalFire.apply(this, arguments);
            }
        };

        window.Swal.showLoading = function () {
            swalLoaderDepth += 1;
            showGlobalLoader(DEFAULT_TEXT);
        };

        window.Swal.hideLoading = function () {
            clearSwalLoader();
            if (originalHideLoading) {
                return originalHideLoading.apply(this, arguments);
            }
        };

        window.Swal.close = function () {
            clearSwalLoader();
            if (originalClose) {
                return originalClose.apply(this, arguments);
            }
        };

        window.Swal.__globalHamsterWrapped = true;
    }

    function installFetchHook() {
        if (!window.fetch || window.fetch.__globalHamsterWrapped) {
            return;
        }

        var originalFetch = window.fetch.bind(window);
        var wrappedFetch = function (input, init) {
            var reqInit = init || {};
            var reqHeaders = reqInit.headers || (input && input.headers);
            var skipLoader = reqInit.skipGlobalLoader === true || shouldSkipByHeaders(reqHeaders);
            var shouldTrack = !skipLoader && hasIntent();
            var requestId = null;
            if (shouldTrack) {
                requestId = beginTrackedRequest(reqInit.loaderText);
            }

            try {
                var fetchPromise = originalFetch(input, init);
                return Promise.resolve(fetchPromise).finally(function () {
                    if (shouldTrack) {
                        endTrackedRequest(requestId);
                    }
                });
            } catch (error) {
                if (shouldTrack) {
                    endTrackedRequest(requestId);
                }
                throw error;
            }
        };

        wrappedFetch.__globalHamsterWrapped = true;
        window.fetch = wrappedFetch;
    }

    function installXhrHook() {
        if (!window.XMLHttpRequest || window.XMLHttpRequest.__globalHamsterWrapped) {
            return;
        }

        var proto = XMLHttpRequest.prototype;
        var originalOpen = proto.open;
        var originalSend = proto.send;
        var originalSetRequestHeader = proto.setRequestHeader;

        proto.open = function () {
            this.__skipGlobalLoader = false;
            return originalOpen.apply(this, arguments);
        };

        proto.setRequestHeader = function (name, value) {
            var headerName = (name || '').toString().toLowerCase();
            var headerValue = (value || '').toString().toLowerCase();
            if (headerName === 'x-skip-global-loader' && (headerValue === '1' || headerValue === 'true')) {
                this.__skipGlobalLoader = true;
            }
            return originalSetRequestHeader.apply(this, arguments);
        };

        proto.send = function () {
            var shouldTrack = !this.__skipGlobalLoader && hasIntent();
            var requestId = null;
            if (shouldTrack) {
                requestId = beginTrackedRequest();
                this.addEventListener('loadend', function onLoadEnd() {
                    endTrackedRequest(requestId);
                }, { once: true });
            }
            try {
                return originalSend.apply(this, arguments);
            } catch (error) {
                if (shouldTrack) {
                    endTrackedRequest(requestId);
                }
                throw error;
            }
        };

        window.XMLHttpRequest.__globalHamsterWrapped = true;
    }

    function installPublicApi() {
        window.getHamsterLoaderHtml = getHamsterLoaderHtml;
        window.showGlobalLoader = showGlobalLoader;
        window.hideGlobalLoader = hideGlobalLoader;
        window.forceHideGlobalLoader = forceHideGlobalLoader;
        window.runWithGlobalLoader = function (task, text) {
            showGlobalLoader(text);
            var promise = typeof task === 'function' ? Promise.resolve().then(task) : Promise.resolve(task);
            return promise.finally(function () {
                hideGlobalLoader();
            });
        };
    }

    function initialize() {
        ensureStyle();
        ensureOverlay();
        installPublicApi();
        installIntentListeners();
        installFetchHook();
        installXhrHook();
        installSwalHook();
        installLegacySpinnerObserver();
        installGlobalWatchdog();
        setTimeout(installSwalHook, 0);
        var swalRetryCount = 0;
        var swalRetryTimer = window.setInterval(function () {
            installSwalHook();
            swalRetryCount += 1;
            if ((window.Swal && window.Swal.__globalHamsterWrapped) || swalRetryCount > 20) {
                window.clearInterval(swalRetryTimer);
            }
        }, 300);

        window.addEventListener('pageshow', function () {
            forceHideGlobalLoader();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
