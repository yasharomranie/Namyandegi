/**
 * all-representatives.js
 * -----------------------------------------------------------------------
 * Renders all-representatives.html: every active representative across
 * every province, grouped by province, with a single AJAX search box
 * (name, province, or city — one query covers all three) that re-queries
 * api/all-representatives.php as the user types (debounced) instead of
 * filtering an already-loaded array client-side, since this list can grow
 * far larger than any one province's.
 *
 * Grouping/sorting by province name uses window.PROVINCES_DATA (already
 * loaded for the map) rather than duplicating the Persian names here — the
 * API only needs to tell us *which* province each representative belongs
 * to (provinceSlug), not spell out its name again.
 *
 * If the API is entirely unreachable (backend not deployed yet, offline),
 * this falls back to the same sample-data generator representatives.js
 * uses for a single province (assets/js/representatives-data.js), just
 * looped across every province that has a nonzero demo count — same
 * "still show something instead of an empty page" reasoning, now for the
 * whole-country view.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initBackToTop();
    initYear();
    initAllRepresentatives();
  });

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Shared chrome (same behavior as representatives.js) ------ */
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
  function initAllRepresentatives() {
    var searchInput = qs("#allRepsSearch");
    var spinner = qs("#allRepsSpinner");
    var clearBtn = qs("#allClearSearchBtn");

    var requestToken = 0;
    var grandTotalsSet = false;
    var fallbackData = null; // built lazily, only if the API turns out to be unreachable

    function provinceFaBySlug(slug) {
      var p = (window.PROVINCES_DATA || []).find(function (x) { return x.slug === slug; });
      return p ? p.fa : slug;
    }

    function buildFallbackData() {
      if (fallbackData) return fallbackData;
      var list = [];
      if (window.generateSampleRepresentatives) {
        (window.PROVINCES_DATA || []).forEach(function (p) {
          window.generateSampleRepresentatives(p).forEach(function (r) {
            r.provinceSlug = p.slug;
            list.push(r);
          });
        });
      }
      fallbackData = list;
      return list;
    }

    function filterFallback(list, q) {
      if (!q) return list;
      var needle = q.toLowerCase();
      return list.filter(function (r) {
        return (
          r.name.toLowerCase().indexOf(needle) !== -1 ||
          r.city.toLowerCase().indexOf(needle) !== -1 ||
          provinceFaBySlug(r.provinceSlug).toLowerCase().indexOf(needle) !== -1
        );
      });
    }

    function load(q) {
      var token = ++requestToken;
      spinner.hidden = false;

      fetch("api/all-representatives.php?q=" + encodeURIComponent(q || ""))
        .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error("bad status")); })
        .then(function (data) {
          if (token !== requestToken) return; // a newer keystroke already superseded this response
          spinner.hidden = true;
          onLoaded(Array.isArray(data) ? data : [], q, false);
        })
        .catch(function () {
          if (token !== requestToken) return;
          spinner.hidden = true;
          console.warn("[all-representatives] api/all-representatives.php not reachable — showing sample data instead");
          if (!window.PROVINCES_DATA) { showOnly("allRepsErrorState"); return; }
          onLoaded(filterFallback(buildFallbackData(), q), q, true);
        });
    }

    function onLoaded(list, q, isFallback) {
      // The stat chips at the top always reflect the *unfiltered* grand
      // total (first successful load only) — same "big picture vs. current
      // search" split representatives.html uses for its own stats vs.
      // results bar.
      if (!grandTotalsSet && !q) {
        grandTotalsSet = true;
        var provinceCount = uniqueSlugs(list).length;
        qs("#allRepsStats").hidden = false;
        qs("#allStatCount").textContent = list.length;
        qs("#allStatProvinces").textContent = provinceCount;
        qs("#allRepsSubtitle").textContent = list.length
          ? list.length + " نماینده فعال در " + provinceCount + " استان، آماده ارائه خدمات در سراسر کشور."
          : "هنوز نماینده‌ای ثبت نشده است.";
      }

      renderResults(list, q, isFallback);
    }

    function uniqueSlugs(list) {
      var seen = {};
      var out = [];
      list.forEach(function (r) {
        if (!seen[r.provinceSlug]) { seen[r.provinceSlug] = true; out.push(r.provinceSlug); }
      });
      return out;
    }

    function renderResults(list, q, isFallback) {
      var resultsBar = qs("#allRepsResultsBar");
      var groupsEl = qs("#allRepsGroups");

      qs("#allRepsLoading").hidden = true;

      if (!list.length) {
        groupsEl.innerHTML = "";
        resultsBar.hidden = true;
        showOnly(q ? "allRepsNoMatchState" : "allRepsEmptyState");
        return;
      }
      showOnly(null);

      resultsBar.hidden = false;
      qs("#allResultsCount").textContent = list.length;

      var groups = {};
      var order = [];
      list.forEach(function (r) {
        if (!groups[r.provinceSlug]) { groups[r.provinceSlug] = []; order.push(r.provinceSlug); }
        groups[r.provinceSlug].push(r);
      });
      order.sort(function (a, b) { return provinceFaBySlug(a).localeCompare(provinceFaBySlug(b), "fa"); });

      groupsEl.innerHTML = order.map(function (slug) {
        var reps = groups[slug].slice().sort(function (a, b) { return a.name.localeCompare(b.name, "fa"); });
        return groupHtml(slug, reps);
      }).join("");

      if (hasGsap && !reduceMotion) {
        window.gsap.fromTo(qsa(".rep-card", groupsEl), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: "power2.out" });
      }

      if (isFallback) groupsEl.setAttribute("data-fallback", "true");
      else groupsEl.removeAttribute("data-fallback");
    }

    function groupHtml(slug, reps) {
      return (
        '<div class="reps-group">' +
        '<h2 class="reps-group-title">' +
        '<span class="reps-group-name">استان ' + escapeHtml(provinceFaBySlug(slug)) + "</span>" +
        '<span class="reps-group-count">' + reps.length + " نماینده</span>" +
        "</h2>" +
        '<div class="reps-grid">' + reps.map(cardHtml).join("") + "</div>" +
        "</div>"
      );
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

    function showOnly(idToShow) {
      ["allRepsEmptyState", "allRepsNoMatchState", "allRepsErrorState"].forEach(function (id) {
        qs("#" + id).hidden = id !== idToShow;
      });
      if (idToShow) qs("#allRepsGroups").innerHTML = "";
    }

    searchInput.addEventListener("input", debounce(function () {
      load(searchInput.value.trim());
    }, 300));
    clearBtn.addEventListener("click", function () {
      searchInput.value = "";
      load("");
      searchInput.focus();
    });

    load(""); // initial, unfiltered load — also sets the grand-total stats
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
