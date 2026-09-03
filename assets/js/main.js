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

    fetch("assets/svg/iran-map.svg")
      .then(function (res) { if (!res.ok) throw new Error("svg fetch failed"); return res.text(); })
      .then(function (svgText) {
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
        showTooltip(tooltip, wrap, path, fa, count, hasRep);
      }
      function activate() {
        if (info && info.hasRep) {
          window.location.href = "representatives.html?province=" + info.slug;
        } else {
          var form = qs("#apply");
          if (form) form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        }
      }

      path.addEventListener("mouseenter", open);
      path.addEventListener("focus", open);
      path.addEventListener("mouseleave", function () {
        if (activeTooltipTarget === path) hideTooltip(tooltip, path);
      });
      path.addEventListener("blur", function () {
        if (activeTooltipTarget === path) hideTooltip(tooltip, path);
      });
      path.addEventListener("click", activate);
      path.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
        if (e.key === "Escape") hideTooltip(tooltip, path);
      });
    });

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
    }
  }

  function showTooltip(tooltip, wrap, path, fa, count, hasRep) {
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
      '<span class="tt-link">' +
      (hasRep
        ? 'مشاهده نمایندگان استان <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M14 5l7 7-7 7M21 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : 'اولین نماینده این استان شوید <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M14 5l7 7-7 7M21 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>') +
      "</span>";

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
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "در حال ارسال..."; }

      // TODO(backend): replace with a real endpoint, e.g.
      // fetch("/api/representative-applications", { method: "POST", body: new FormData(form) })
      var payload = Object.fromEntries(new FormData(form).entries());
      console.info("[apply-form] sample submission payload:", payload);

      setTimeout(function () {
        qs(".form-body").style.display = "none";
        qs(".form-progress").style.display = "none";
        var success = qs(".form-success");
        success.classList.add("is-active");
        // Hiding the form collapses .form-shell's height; without this the
        // viewport would land on whatever section scrolls up to fill the gap.
        success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }, 900);
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
