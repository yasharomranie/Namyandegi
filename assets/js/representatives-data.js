/**
 * representatives-data.js
 * -----------------------------------------------------------------------
 * Generates sample representative listings for a province, purely on the
 * client, from its `count` in provinces-data.js — there is no backend yet.
 * Swap `window.generateRepresentatives` for a real fetch() to your API
 * before launch (see the TODO in representatives.js); nothing else on the
 * page needs to change, since it already renders whatever array comes
 * back.
 *
 * The generator is deterministic (seeded by province + index, not
 * Math.random()) so the same province always renders the same sample
 * list instead of reshuffling on every reload. Names are drawn from
 * common, generic Persian given/family name pools — not real people —
 * and contact details use the same placeholder pattern as the rest of
 * the site (see footer phone number in index.html).
 * -----------------------------------------------------------------------
 */
(function () {
  "use strict";

  var GIVEN_NAMES = [
    "علی", "محمد", "حسین", "رضا", "امیر", "مهدی", "حسن", "جواد", "سعید", "بهروز",
    "کامران", "فرهاد", "یوسف", "آرش", "بابک", "پیمان", "کوروش", "دانیال", "سینا", "نیما",
    "زهرا", "فاطمه", "مریم", "سارا", "نگار", "الهام", "پریسا", "لیلا", "شیرین", "نیلوفر",
    "آزاده", "بهار", "مینا", "رویا", "هستی", "ترانه", "یاسمن", "غزل", "نازنین", "درسا",
  ];
  var FAMILY_NAMES = [
    "رضایی", "محمدی", "حسینی", "کریمی", "احمدی", "موسوی", "صادقی", "نوری", "یزدانی", "قاسمی",
    "رحیمی", "صالحی", "جعفری", "عزیزی", "کاظمی", "شریفی", "فروزان", "امیری", "باقری", "طاهری",
  ];
  var JOB_CATEGORIES = [
    "املاک و مستغلات", "پوشاک و مد", "خودرو و لوازم یدکی", "الکترونیک و دیجیتال",
    "مواد غذایی", "خدمات فنی و مهندسی", "بهداشت و زیبایی", "کشاورزی",
  ];
  var STREET_WORDS = ["آزادی", "ولیعصر", "امام خمینی", "طالقانی", "شریعتی", "انقلاب", "معلم", "فردوسی"];
  var SURROUNDING = "شهرستان‌های اطراف";

  // Small deterministic PRNG (mulberry32) so a given seed always produces
  // the same sequence — no two page loads reshuffle the same province.
  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
    return h;
  }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function toPersianDigits(n) {
    var map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return String(n).replace(/\d/g, function (d) { return map[d]; });
  }

  /**
   * @param {object} province - one entry from window.PROVINCES_DATA
   * @returns {Array<object>} sample representative records
   */
  window.generateRepresentatives = function (province) {
    if (!province || !province.count) return [];
    var rng = makeRng(hashString(province.id));
    var list = [];
    for (var i = 0; i < province.count; i++) {
      var given = pick(rng, GIVEN_NAMES);
      var family = pick(rng, FAMILY_NAMES);
      var city = rng() < 0.7 ? province.capital : SURROUNDING;
      var year = 1396 + Math.floor(rng() * 8); // 1396–1403
      var last4 = String(1000 + i).slice(-4);
      list.push({
        id: province.slug + "-" + (i + 1),
        name: given + " " + family,
        initial: given.charAt(0),
        specialty: pick(rng, JOB_CATEGORIES),
        city: city,
        address: "خیابان " + pick(rng, STREET_WORDS) + "، پلاک " + (Math.floor(rng() * 90) + 1),
        // Placeholder contact info — same masked pattern used site-wide
        // (see the footer in index.html); wire to real data before launch.
        phone: "۰۹۱۲-۰۰۰-" + toPersianDigits(last4),
        phoneHref: "tel:+98912000" + last4,
        activeSince: toPersianDigits(year),
      });
    }
    return list;
  };
})();
