/**
 * representatives.js
 * -----------------------------------------------------------------------
 * Renders the representatives.html listing page for the province named in
 * ?province=<slug>: header/footer chrome shared with index.html, plus the
 * search/filter toolbar and card grid built from
 * window.fetchRepresentatives() (see representatives-data.js — it calls
 * api/representatives.php and falls back to sample data if that's not
 * reachable); this file only cares that it gets a Promise resolving to an
 * array of { name, specialty, city, address, phone, phoneHref,
 * activeSince } objects back.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initBackToTop();
    initYear();
    initRepresentatives();
  });

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Shared chrome (same behavior as main.js, kept small since
     this page doesn't need the hero/form/FAQ logic) --------------------- */
  function initHeader() {
    var header = qs(".site-header");
    var toggle = qs(".nav-toggle");
    var nav = qs(".main-nav");
    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        nav.classList.toggle("is-open", !open);
        document.body.style.overflow = !open ? "hidden" : "";
      });
      qsa("a", nav).forEach(function (a) {
        a.addEventListener("click", function () {
          toggle.setAttribute("aria-expanded", "false");
          nav.classList.remove("is-open");
          document.body.style.overflow = "";
        });
      });
    }
  }
  function initBackToTop() {
    var btn = qs(".to-top");
    if (!btn) return;
    window.addEventListener("scroll", function () { btn.classList.toggle("is-visible", window.scrollY > 480); }, { passive: true });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
  }
  function initYear() {
    var el = qs("#year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- Page logic ------------------------------------------------ */
  function initRepresentatives() {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get("province");
    var province = (window.PROVINCES_DATA || []).find(function (p) { return p.slug === slug; });

    if (!province) {
      showOnly("repsInvalidState");
      qs("#breadcrumbProvince").textContent = "نامشخص";
      document.title = "استان نامشخص | برند شما";
      return;
    }

    document.title = "نمایندگان استان " + province.fa + " | برند شما";
    qs("#breadcrumbProvince").textContent = province.fa;
    qs("#provinceTitle").textContent = "نمایندگان استان " + province.fa;
    qs("#provinceSubtitle").textContent = "در حال بارگذاری فهرست نمایندگان…";

    // Whether this province actually has representatives is decided by
    // what the API (or its sample-data fallback) returns, not by the
    // static hasRep/count in provinces-data.js — those only drive the map
    // on index.html, which patches its own live counts separately; this
    // page always asks directly so it can't show a stale empty/non-empty
    // state after an admin adds or removes someone.
    if (!window.fetchRepresentatives) { showOnly("repsInvalidState"); return; }

    window.fetchRepresentatives(province).then(function (allReps) {
      if (!allReps.length) {
        qs("#provinceSubtitle").textContent = "هنوز نماینده‌ای در استان " + province.fa + " ثبت نشده است.";
        showOnly("repsEmptyState");
        return;
      }

      qs("#provinceSubtitle").textContent =
        allReps.length + " نماینده فعال، آماده ارائه خدمات در سراسر استان " + province.fa + ".";

      qs("#repsStats").hidden = false;
      qs("#statCount").textContent = allReps.length;
      qs("#statCity").textContent = province.capital || "—";

      var toolbar = qs("#repsToolbar");
      toolbar.hidden = false;
      var searchInput = qs("#repsSearch");
      var cityFilter = qs("#repsCityFilter");
      var jobFilter = qs("#repsJobFilter");

      fillSelect(cityFilter, uniqueSorted(allReps.map(function (r) { return r.city; })));
      fillSelect(jobFilter, uniqueSorted(allReps.map(function (r) { return r.specialty; })));

      function applyFilters() {
        var q = searchInput.value.trim().toLowerCase();
        var city = cityFilter.value;
        var job = jobFilter.value;
        var filtered = allReps.filter(function (r) {
          var matchesQuery = !q || r.name.toLowerCase().indexOf(q) !== -1 || r.city.toLowerCase().indexOf(q) !== -1;
          var matchesCity = !city || r.city === city;
          var matchesJob = !job || r.specialty === job;
          return matchesQuery && matchesCity && matchesJob;
        });
        renderGrid(filtered, allReps.length);
      }

      searchInput.addEventListener("input", debounce(applyFilters, 150));
      cityFilter.addEventListener("change", applyFilters);
      jobFilter.addEventListener("change", applyFilters);
      qs("#clearFiltersBtn").addEventListener("click", function () {
        searchInput.value = "";
        cityFilter.value = "";
        jobFilter.value = "";
        applyFilters();
      });

      renderGrid(allReps, allReps.length);
    });
  }

  function showOnly(idToShow) {
    ["repsStats", "repsToolbar", "repsResultsBar"].forEach(function (id) {
      var el = qs("#" + id);
      if (el) el.hidden = true;
    });
    ["repsEmptyState", "repsNoMatchState", "repsInvalidState"].forEach(function (id) {
      qs("#" + id).hidden = id !== idToShow;
    });
    qs("#repsGrid").innerHTML = "";
  }

  function renderGrid(reps, totalCount) {
    var grid = qs("#repsGrid");
    var resultsBar = qs("#repsResultsBar");
    var noMatch = qs("#repsNoMatchState");

    resultsBar.hidden = false;
    qs("#resultsCount").textContent = reps.length;

    if (!reps.length) {
      grid.innerHTML = "";
      noMatch.hidden = false;
      return;
    }
    noMatch.hidden = true;

    grid.innerHTML = reps.map(cardHtml).join("");
    var cards = qsa(".rep-card", grid);
    if (hasGsap && !reduceMotion) {
      window.gsap.fromTo(cards, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: "power2.out" });
    }
  }

  function cardHtml(rep) {
    return (
      '<article class="rep-card">' +
      '<div class="rep-card-head">' +
      '<span class="rep-avatar" aria-hidden="true">' + escapeHtml(rep.initial) + "</span>" +
      "<div>" +
      "<h3>" + escapeHtml(rep.name) + "</h3>" +
      '<span class="rep-badge">' + escapeHtml(rep.specialty) + "</span>" +
      "</div>" +
      "</div>" +
      '<ul class="rep-meta">' +
      "<li>" +
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6"/></svg>' +
      "<span>" + escapeHtml(rep.city) + "، " + escapeHtml(rep.address) + "</span>" +
      "</li>" +
      "<li>" +
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v4l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/></svg>' +
      "<span>فعال از سال " + escapeHtml(rep.activeSince) + "</span>" +
      "</li>" +
      "</ul>" +
      '<div class="rep-actions">' +
      '<a class="btn btn-primary" href="' + escapeAttr(rep.phoneHref) + '">' +
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "<span>" + escapeHtml(rep.phone) + "</span>" +
      "</a>" +
      "</div>" +
      "</article>"
    );
  }

  function fillSelect(select, values) {
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v; opt.textContent = v;
      select.appendChild(opt);
    });
  }
  function uniqueSorted(arr) {
    return Array.prototype.slice.call(new Set(arr)).sort(function (a, b) { return a.localeCompare(b, "fa"); });
  }
  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); var args = arguments; t = setTimeout(function () { fn.apply(null, args); }, ms); };
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escapeAttr(str) { return escapeHtml(str); }
})();
