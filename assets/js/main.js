/**
 * main.js — نمایندگی‌های ما
 * Header/nav, hero + map interaction & animation, scroll reveals,
 * counters, multi-step form, FAQ accordion.
 * No build step required — vanilla JS, progressively enhanced.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  document.documentElement.classList.add("js-ready");

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initMap();
    initHeroAnimation();
    initScrollReveal();
    initCounters();
    initForm();
    initFaq();
    initBackToTop();
    initYear();
  });

  /* ---------------------------------------------------------------- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Header / nav ------------------------------------------ */
  function initHeader() {
    var header = qs(".site-header");
    var toggle = qs(".nav-toggle");
    var nav = qs(".main-nav");
    var links = qsa(".main-nav a");

    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        nav.classList.toggle("is-open", !open);
        document.body.style.overflow = !open ? "hidden" : "";
      });
      links.forEach(function (a) {
        a.addEventListener("click", function () {
          toggle.setAttribute("aria-expanded", "false");
          nav.classList.remove("is-open");
          document.body.style.overflow = "";
        });
      });
    }

    // Active link on scroll
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);
    if (sections.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            links.forEach(function (a) { a.classList.remove("is-active"); });
            var match = qs('.main-nav a[href="#' + entry.target.id + '"]');
            if (match) match.classList.add("is-active");
          });
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      sections.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- Iran map ------------------------------------------------ */
  function initMap() {
    var mount = qs("#iranMap");
    var tooltip = qs("#mapTooltip");
    var wrap = qs(".iran-map-figure"); // must match .map-tooltip's positioned ancestor
    if (!mount || !window.PROVINCES_DATA) return;

    var dataById = {};
    window.PROVINCES_DATA.forEach(function (p) { dataById[p.id] = p; });

    // Live counts from the backend (api/provinces.php) patch straight onto
    // the shared PROVINCES_DATA objects, so decorateMap/labels/tooltips —
    // all of which read p.count/p.hasRep off those same references — pick
    // them up automatically. If the API isn't reachable yet (backend not
    // deployed, offline, CORS misconfigured…) this quietly keeps whatever
    // was already in provinces-data.js instead of breaking the map.
    var liveCounts = fetch("api/provinces.php")
      .then(function (res) { return res.ok ? res.json() : {}; })
      .catch(function () { return {}; });

    var svgMarkup = fetch("assets/svg/iran-map.svg")
      .then(function (res) { if (!res.ok) throw new Error("svg fetch failed"); return res.text(); });

    Promise.all([svgMarkup, liveCounts])
      .then(function (results) {
        var svgText = results[0];
        var counts = results[1] || {};
        window.PROVINCES_DATA.forEach(function (p) {
          if (Object.prototype.hasOwnProperty.call(counts, p.slug)) {
            p.count = counts[p.slug];
            p.hasRep = counts[p.slug] > 0;
          }
        });
        mount.innerHTML = svgText;
        decorateMap(mount, dataById, tooltip, wrap);
      })
      .catch(function () {
        mount.innerHTML =
          '<p style="padding:2rem;text-align:center;color:var(--ink-500);font-size:.875rem">' +
          "نقشه بارگذاری نشد — لطفاً صفحه را از طریق یک وب‌سرور محلی اجرا کنید (نه file://)." +
          "</p>";
      });
  }

  function decorateMap(mount, dataById, tooltip, wrap) {
    var svg = mount.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "نقشه تعاملی نمایندگی‌ها در استان‌های ایران");

    var paths = qsa("path", svg);
    var activeTooltipTarget = null;

    // Once a tooltip opens (over/near the just-tapped province), it visually
    // covers roughly the same spot — so a second tap aimed at "that same
    // spot" lands on the tooltip card itself, not the path underneath it.
    // Make the whole open tooltip activate on tap/click, not just its CTA
    // button, so that second tap actually does something. Bound once here;
    // showTooltip() below just updates which callback it currently points
    // at. pointerup (not click) for the touch case, same reasoning as the
    // per-path listeners; click covers mouse and keyboard-Enter-on-button.
    tooltip.addEventListener("pointerup", function (e) {
      if (e.pointerType && e.pointerType !== "mouse" && tooltip._activate) tooltip._activate();
    });
    // A tap's real "click" isn't dropped, only *delayed*: browsers replay it
    // as a compatibility mouse event at the original touch coordinates some
    // tens of ms later, and by then the tooltip this same tap just opened is
    // sitting at that exact spot — so it lands here and fires "click"
    // immediately after "pointerup" already opened it, undoing the tap
    // gating in the per-path listener below. The path's pointerup handler
    // stamps `tooltip._suppressClickUntil` right before a touch-triggered
    // open() (never for a mouse-triggered one) so this listener can ignore
    // exactly that echo without adding any delay to a real mouse click.
    tooltip.addEventListener("click", function () {
      if (Date.now() < (tooltip._suppressClickUntil || 0)) return;
      if (tooltip._activate) tooltip._activate();
    });

    paths.forEach(function (path) {
      var id = path.getAttribute("id");
      var info = dataById[id];
      var fa = info ? info.fa : path.getAttribute("name") || id;
      var count = info ? info.count : 0;
      var hasRep = info ? info.hasRep : false;

      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("data-has-rep", String(hasRep));
      path.setAttribute(
        "aria-label",
        fa + (hasRep ? "، " + count + " نماینده فعال" : "، هنوز نماینده‌ای ثبت نشده")
      );

      function open() {
        paths.forEach(function (p) { p.classList.remove("is-active"); });
        path.classList.add("is-active");
        activeTooltipTarget = path;
        showTooltip(tooltip, wrap, path, fa, count, hasRep, activate);
      }
      function activate() {
        if (info && info.hasRep) {
          window.location.href = "representatives.html?province=" + info.slug;
        } else {
          var form = qs("#apply");
          if (form) form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        }
      }

      // Pointer Events, not "click": on touch, the browser fires a real
      // 'click' too, but only ~afterward, as a compatibility event replayed
      // at the *original* touch coordinates — and by then open() below has
      // already shown a tooltip that now covers that same spot, so the
      // delayed click lands on the tooltip instead of the path and fires
      // its "activate" handler immediately, undoing the very gating this
      // is meant to add. preventDefault() on pointerdown suppresses that
      // compatibility click at the source (spec-guaranteed: canceling
      // pointerdown cancels the mousedown/mouseup/click chain it would
      // otherwise replay), so "pointerup" is the only thing driving this,
      // for mouse, touch, and pen alike.
      //
      // pointerType tells the two input styles apart, because they need
      // different gating:
      //  - mouse: "pointerenter" (real hover) always fires before
      //    "pointerup", so by the time pointerup runs the tooltip is
      //    already open — a single click still resolves in one step.
      //  - touch/pen: enter and press happen together as one gesture, so
      //    if pointerenter were also allowed to open() here, is-active
      //    would already be true the instant pointerup runs and every tap
      //    would activate immediately — the exact bug being fixed. So
      //    pointerenter is a no-op for touch, and the *first* pointerup on
      //    a province opens its tooltip; only a second pointerup on that
      //    same, already-open province activates it. The tooltip's own
      //    "مشاهده نمایندگان استان" button (wired in showTooltip) is always
      //    a one-tap shortcut once it's visible, on any input type.
      path.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "mouse") open();
      });
      path.addEventListener("pointerleave", function (e) {
        if (e.pointerType === "mouse" && activeTooltipTarget === path) hideTooltip(tooltip, path);
      });
      // Tapping/clicking a focusable element also focuses it, not just
      // keyboard Tab — so an unconditional "focus" listener would open()
      // a second time (for touch, effectively immediately, since focus
      // lands before pointerup), setting is-active early and making the
      // pointerup gate above see an "already open" province on the very
      // first tap. :focus-visible is true for real keyboard focus and
      // false for pointer-caused focus in evergreen browsers, so this
      // keeps the keyboard path working without racing the pointer path.
      path.addEventListener("focus", function () {
        if (path.matches(":focus-visible")) open();
      });
      path.addEventListener("blur", function () {
        if (activeTooltipTarget === path) hideTooltip(tooltip, path);
      });
      path.addEventListener("pointerup", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") {
          if (path.classList.contains("is-active") && tooltip.classList.contains("is-visible")) {
            activate();
          } else {
            tooltip._suppressClickUntil = Date.now() + 500; // see the tooltip "click" listener above
            open();
          }
        } else {
          activate();
        }
      });
      path.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
        if (e.key === "Escape") hideTooltip(tooltip, path);
      });
    });

    // Touch has no "mouseleave" to close an open tooltip with — tapping
    // anywhere outside the map dismisses it instead. pointerdown (not
    // click) for the same "don't depend on synthesized events" reason as
    // above.
    document.addEventListener("pointerdown", function (e) {
      if (!tooltip.classList.contains("is-visible")) return;
      if (wrap.contains(e.target)) return;
      paths.forEach(function (p) { p.classList.remove("is-active"); });
      hideTooltip(tooltip);
    });

    var labels = addProvinceLabels(svg, window.PROVINCES_DATA || []);

    // Cinematic "draw the borders" entrance
    if (hasGsap && !reduceMotion) {
      paths.forEach(function (path) {
        var len = 0;
        try { len = path.getTotalLength(); } catch (e) { len = 0; }
        if (!len) return;
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
      });
      window.gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: "power2.inOut",
        stagger: { each: 0.012, from: "random" },
        delay: 0.3,
      });
      window.gsap.from(paths, { opacity: 0, duration: 1.1, stagger: 0.01, ease: "power1.out", delay: 0.3 });
      if (labels.length) {
        window.gsap.from(labels, { opacity: 0, duration: 0.8, stagger: 0.01, ease: "power1.out", delay: 1.0 });
      }
    }
  }

  /**
   * Draws the Persian province name on top of each shape, anchored at the
   * precomputed `cx/cy` ("pole of inaccessibility" — the point inside the
   * polygon farthest from any border, see provinces-data.js) rather than a
   * bounding-box center, which for thin/concave provinces (Tehran, Semnan,
   * Gilan…) can land outside the shape entirely. Font size scales with `r`
   * (that point's distance to the nearest edge) so small provinces get
   * small labels instead of overflowing their neighbors. Long two-word-plus
   * names ("چهارمحال و بختیاری") wrap onto a second line.
   */
  function addProvinceLabels(svg, provincesData) {
    var NS = "http://www.w3.org/2000/svg";
    var group = document.createElementNS(NS, "g");
    group.setAttribute("class", "map-labels");
    group.setAttribute("aria-hidden", "true"); // paths already carry the accessible name

    var nodes = [];
    provincesData.forEach(function (info) {
      if (typeof info.cx !== "number" || typeof info.cy !== "number") return;
      var lines = splitProvinceLabel(info.fa);
      var size = Math.max(7, Math.min(13, info.r * 0.6));
      var lineH = size * 1.15;
      var startY = info.cy - ((lines.length - 1) * lineH) / 2;

      var text = document.createElementNS(NS, "text");
      text.setAttribute("class", "map-label");
      text.setAttribute("font-size", size.toFixed(2));

      lines.forEach(function (line, i) {
        var tspan = document.createElementNS(NS, "tspan");
        tspan.setAttribute("x", info.cx);
        tspan.setAttribute("y", (startY + i * lineH).toFixed(2));
        tspan.textContent = line;
        text.appendChild(tspan);
      });

      group.appendChild(text);
      nodes.push(text);
    });

    svg.appendChild(group); // painted last => sits above the province fills
    return nodes;
  }

  function splitProvinceLabel(name) {
    var words = name.split(" ");
    if (words.length <= 2) return words;
    // "X و Y" (e.g. چهارمحال و بختیاری) reads better as "X" / "و Y"
    if (words.length === 3 && words[1] === "و") return [words[0], words[1] + " " + words[2]];
    var mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  }

  function showTooltip(tooltip, wrap, path, fa, count, hasRep, onActivate) {
    if (!tooltip || !wrap) return;
    var wrapBox = wrap.getBoundingClientRect();
    var pathBox = path.getBoundingClientRect();
    var x = pathBox.left + pathBox.width / 2 - wrapBox.left;
    var y = pathBox.top - wrapBox.top;

    tooltip.classList.toggle("state-empty", !hasRep);
    tooltip.innerHTML =
      '<div class="tt-name">' + fa + "</div>" +
      '<div class="tt-count">' +
      (hasRep
        ? '<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm11 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><b>' + count + "</b> نماینده فعال"
        : "هنوز نماینده‌ای در این استان نداریم") +
      "</div>" +
      // A real <button>, not a decorative <span>: on touch, this is the
      // one-tap shortcut once the tooltip is open (see the path "click"
      // handler in decorateMap for why a bare tap on the shape isn't enough
      // on its own), and it's independently keyboard/screen-reader operable.
      '<button type="button" class="tt-link">' +
      (hasRep
        ? 'مشاهده نمایندگان استان <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M14 5l7 7-7 7M21 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : 'اولین نماینده این استان شوید <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M14 5l7 7-7 7M21 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>') +
      "</button>";

    // Read by the tooltip-level pointerup/click listeners registered once in
    // decorateMap — covers a tap anywhere on the open card, not just the
    // button (see the comment there for why that matters on touch).
    tooltip._activate = onActivate;

    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
    tooltip.classList.add("is-visible");
  }

  function hideTooltip(tooltip) {
    if (tooltip) tooltip.classList.remove("is-visible");
  }

  /* ---------- Hero entrance ------------------------------------------ */
  function initHeroAnimation() {
    var titleWords = qsa(".hero-title .word");
    var fadeUps = qsa("[data-hero-fade]");

    if (!hasGsap || reduceMotion) {
      titleWords.forEach(function (w) { w.style.opacity = 1; });
      fadeUps.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }

    var tl = window.gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.set(titleWords, { opacity: 0, y: 26, rotate: 1 })
      .set(fadeUps, { opacity: 0, y: 22 })
      .to(titleWords, { opacity: 1, y: 0, rotate: 0, duration: 0.7, stagger: 0.045 }, 0.1)
      .to(fadeUps, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 }, "-=0.35");

    window.gsap.to(".hero-bg .blob-1", { y: 30, x: -14, duration: 9, yoyo: true, repeat: -1, ease: "sine.inOut" });
    window.gsap.to(".hero-bg .blob-2", { y: -26, x: 18, duration: 11, yoyo: true, repeat: -1, ease: "sine.inOut" });
    window.gsap.to(".hero-bg .blob-3", { y: 20, x: 20, duration: 8, yoyo: true, repeat: -1, ease: "sine.inOut" });
  }

  /* ---------- Scroll reveal ------------------------------------------- */
  function initScrollReveal() {
    var items = qsa(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var group = entry.target.closest("[data-reveal-group]");
          if (group) {
            qsa(".reveal", group).forEach(function (el, i) {
              setTimeout(function () { el.classList.add("in-view"); }, i * 90);
            });
          } else {
            entry.target.classList.add("in-view");
          }
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up stats ------------------------------------------ */
  function initCounters() {
    var counters = qsa("[data-count]");
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var start = 0;
      var duration = 1200;
      var startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(start + (target - start) * eased);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) { counters.forEach(run); return; }
    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { run(entry.target); obs.unobserve(entry.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Multi-step application form ----------------------------- */
  var JOB_CATEGORIES = [
    "املاک و مستغلات", "پوشاک و مد", "خودرو و لوازم یدکی", "الکترونیک و دیجیتال",
    "مواد غذایی", "خدمات فنی و مهندسی", "بهداشت و زیبایی", "کشاورزی", "سایر",
  ];

  function initForm() {
    var form = qs("#applyForm");
    if (!form) return;

    var steps = qsa(".form-step", form);
    var progressSteps = qsa(".progress-step");
    var progressLines = qsa(".progress-line");
    var current = 0;

    var jobSelect = qs("#jobCategory");
    if (jobSelect) {
      JOB_CATEGORIES.forEach(function (cat) {
        var opt = document.createElement("option");
        opt.value = cat; opt.textContent = cat;
        jobSelect.appendChild(opt);
      });
    }

    var uploadInput = qs("#docUpload");
    if (uploadInput) {
      var box = uploadInput.closest(".upload-box");
      uploadInput.addEventListener("change", function () {
        var name = uploadInput.files && uploadInput.files[0] ? uploadInput.files[0].name : "";
        var out = qs(".file-name", box);
        if (out) out.textContent = name ? "فایل انتخاب‌شده: " + name : "";
        box.classList.toggle("is-dragover", false);
      });
    }

    function updateProgress() {
      progressSteps.forEach(function (el, i) {
        el.classList.toggle("is-done", i < current);
        el.classList.toggle("is-current", i === current);
      });
      progressLines.forEach(function (el, i) {
        el.classList.toggle("is-done", i < current);
      });
    }

    function showStep(index) {
      steps.forEach(function (el, i) { el.classList.toggle("is-active", i === index); });
      current = index;
      updateProgress();
      if (index === steps.length - 1) fillReview(form);
      var shell = qs(".form-shell");
      if (shell) shell.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    function validateStep(index) {
      var fields = qsa("input[required], select[required], textarea[required]", steps[index]);
      var valid = true;
      var firstInvalid = null;
      fields.forEach(function (input) {
        var fieldEl = input.closest(".field") || input.closest(".field-group");
        var ok = input.checkValidity();
        if (input.type === "radio") {
          var group = qsa('input[name="' + input.name + '"]', steps[index]);
          ok = group.some(function (r) { return r.checked; });
        }
        if (fieldEl) fieldEl.classList.toggle("has-error", !ok);
        if (!ok) { valid = false; if (!firstInvalid) firstInvalid = input; }
      });
      if (firstInvalid) firstInvalid.focus();
      return valid;
    }

    qsa("[data-next]", form).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!validateStep(current)) return;
        if (current < steps.length - 1) showStep(current + 1);
      });
    });
    qsa("[data-prev]", form).forEach(function (btn) {
      btn.addEventListener("click", function () { if (current > 0) showStep(current - 1); });
    });

    // live-clear error state
    form.addEventListener("input", function (e) {
      var fieldEl = e.target.closest(".field");
      if (fieldEl) fieldEl.classList.remove("has-error");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateStep(current)) return;

      var submitBtn = qs("[data-submit]", form);
      var submitBtnLabel = submitBtn ? qs("span", submitBtn) : null;
      var errorBox = qs("#formSubmitError");
      if (errorBox) { errorBox.hidden = true; errorBox.textContent = ""; }
      if (submitBtn) submitBtn.disabled = true;
      if (submitBtnLabel) submitBtnLabel.textContent = "در حال ارسال...";

      fetch("api/applications.php", { method: "POST", body: new FormData(form) })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok || !data.ok) {
              throw new Error(data.error || "ارسال درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
            }
          });
        })
        .then(function () {
          qs(".form-body").style.display = "none";
          qs(".form-progress").style.display = "none";
          var success = qs(".form-success");
          success.classList.add("is-active");
          // Hiding the form collapses .form-shell's height; without this the
          // viewport would land on whatever section scrolls up to fill the gap.
          success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        })
        .catch(function (err) {
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.innerHTML =
              '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5m0 3h.01M12 2 2 20h20L12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>';
            errorBox.querySelector("span").textContent = err.message;
            errorBox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
          }
          if (submitBtn) submitBtn.disabled = false;
          if (submitBtnLabel) submitBtnLabel.textContent = "ارسال نهایی درخواست";
        });
    });

    updateProgress();
  }

  function fillReview(form) {
    var map = {
      reviewName: ["firstName", "lastName"],
      reviewJob: ["jobCategory"],
      reviewPhone: ["phone"],
      reviewAddress: ["address"],
    };
    Object.keys(map).forEach(function (outId) {
      var out = qs("#" + outId);
      if (!out) return;
      var values = map[outId]
        .map(function (name) {
          var el = form.elements[name];
          return el ? el.value : "";
        })
        .filter(Boolean);
      out.textContent = values.join(" ") || "—";
    });
  }

  /* ---------- FAQ accordion -------------------------------------------- */
  function initFaq() {
    qsa(".faq-item").forEach(function (item) {
      var btn = qs(".faq-q", item);
      var panel = qs(".faq-a", item);
      btn.addEventListener("click", function () {
        var open = item.classList.contains("is-open");
        qsa(".faq-item").forEach(function (other) {
          other.classList.remove("is-open");
          qs(".faq-q", other).setAttribute("aria-expanded", "false");
          qs(".faq-a", other).style.maxHeight = "";
        });
        if (!open) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------- Back to top ------------------------------------------------ */
  function initBackToTop() {
    var btn = qs(".to-top");
    if (!btn) return;
    window.addEventListener(
      "scroll",
      function () { btn.classList.toggle("is-visible", window.scrollY > 480); },
      { passive: true }
    );
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  function initYear() {
    var el = qs("#year");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
