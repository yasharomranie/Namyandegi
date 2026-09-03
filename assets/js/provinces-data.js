/**
 * provinces-data.js
 * -----------------------------------------------------------------------
 * Sample data for the 31 provinces of Iran, keyed by the `id` attribute
 * used in assets/svg/iran-map.svg (Latin slugs from the iran-svg-map
 * package). Wire `count` and `hasRep` to a real API/CMS before launch —
 * everything here is placeholder content so the template can be reviewed
 * end-to-end without a backend.
 *
 *   id      -> must match the <path id="..."> value in iran-map.svg
 *   fa      -> Persian province name shown in the tooltip / linked page / on-map label
 *   slug    -> used to build the representatives.html?province=<slug> link
 *   count   -> number of active representatives (sample data)
 *   hasRep  -> false = "no representative yet" state (invites applicants)
 *   capital -> the province's capital city, used by
 *              assets/js/representatives-data.js to place generated sample
 *              representatives somewhere real
 *   cx, cy, r -> on-map label anchor, in the SVG's own viewBox units (0-733.5 x
 *                0-676.5). Precomputed per province as the point inside its
 *                polygon farthest from any border ("pole of inaccessibility"),
 *                not a bounding-box or area centroid — several provinces
 *                (Tehran, Semnan, Gilan, Mazandaran…) are thin/concave enough
 *                that a naive centroid lands outside the shape or on top of a
 *                neighbor. `r` is that point's distance to the nearest edge,
 *                used in main.js to size each label to the province it sits
 *                in. Regenerate with `node scripts/generate-map-labels.mjs`
 *                if iran-map.svg's paths ever change.
 * -----------------------------------------------------------------------
 */
window.PROVINCES_DATA = [
  { id: "Tehran", fa: "تهران", slug: "tehran", count: 12, hasRep: true, capital: "تهران", cx: 249.8, cy: 181.7, r: 15.7 },
  { id: "Esfahan", fa: "اصفهان", slug: "esfahan", count: 7, hasRep: true, capital: "اصفهان", cx: 273.4, cy: 270.9, r: 43.9 },
  { id: "Razavi-Khorasan", fa: "خراسان رضوی", slug: "razavi-khorasan", count: 6, hasRep: true, capital: "مشهد", cx: 515.4, cy: 177.9, r: 56.4 },
  { id: "Fars", fa: "فارس", slug: "fars", count: 6, hasRep: true, capital: "شیراز", cx: 324.8, cy: 458.7, r: 47 },
  { id: "Gilan", fa: "گیلان", slug: "gilan", count: 5, hasRep: true, capital: "رشت", cx: 195.5, cy: 118.9, r: 18.2 },
  { id: "Mazandaran", fa: "مازندران", slug: "mazandaran", count: 5, hasRep: true, capital: "ساری", cx: 311.6, cy: 147.1, r: 19.6 },
  { id: "East-Azarbaijan", fa: "آذربایجان شرقی", slug: "east-azarbaijan", count: 5, hasRep: true, capital: "تبریز", cx: 77.3, cy: 82.2, r: 35.4 },
  { id: "Khuzestan", fa: "خوزستان", slug: "khuzestan", count: 4, hasRep: true, capital: "اهواز", cx: 167.5, cy: 337.7, r: 37.9 },
  { id: "Alborz", fa: "البرز", slug: "alborz", count: 4, hasRep: true, capital: "کرج", cx: 232.7, cy: 159.1, r: 9.3 },
  { id: "Kerman", fa: "کرمان", slug: "kerman", count: 3, hasRep: true, capital: "کرمان", cx: 455.1, cy: 404.3, r: 63.8 },
  { id: "Kermanshah", fa: "کرمانشاه", slug: "kermanshah", count: 3, hasRep: true, capital: "کرمانشاه", cx: 92.5, cy: 232.9, r: 18.6 },
  { id: "Yazd", fa: "یزد", slug: "yazd", count: 3, hasRep: true, capital: "یزد", cx: 415, cy: 286.8, r: 39 },
  { id: "Qom", fa: "قم", slug: "qom", count: 3, hasRep: true, capital: "قم", cx: 241, cy: 211.2, r: 15.1 },
  { id: "West-Azarbaijan", fa: "آذربایجان غربی", slug: "west-azarbaijan", count: 2, hasRep: true, capital: "ارومیه", cx: 27.3, cy: 39.1, r: 18.3 },
  { id: "Qazvin", fa: "قزوین", slug: "qazvin", count: 2, hasRep: true, capital: "قزوین", cx: 200.5, cy: 155.8, r: 17.7 },
  { id: "Hamadan", fa: "همدان", slug: "hamadan", count: 2, hasRep: true, capital: "همدان", cx: 158.3, cy: 198.6, r: 17.9 },
  { id: "Markazi", fa: "مرکزی", slug: "markazi", count: 2, hasRep: true, capital: "اراک", cx: 191.1, cy: 232.7, r: 18 },
  { id: "Hormozgan", fa: "هرمزگان", slug: "hormozgan", count: 2, hasRep: true, capital: "بندرعباس", cx: 409.1, cy: 494.6, r: 19.2 },
  { id: "Golestan", fa: "گلستان", slug: "golestan", count: 2, hasRep: true, capital: "گرگان", cx: 383.7, cy: 98.4, r: 18.1 },
  { id: "Bushehr", fa: "بوشهر", slug: "bushehr", count: 2, hasRep: true, capital: "بوشهر", cx: 254.9, cy: 458.7, r: 15.2 },
  { id: "Kordestan", fa: "کردستان", slug: "kordestan", count: 2, hasRep: true, capital: "سنندج", cx: 103.8, cy: 173.2, r: 25.4 },
  { id: "North-Khorasan", fa: "خراسان شمالی", slug: "north-khorasan", count: 1, hasRep: true, capital: "بجنورد", cx: 437.9, cy: 99, r: 22.3 },
  { id: "Zanjan", fa: "زنجان", slug: "zanjan", count: 1, hasRep: true, capital: "زنجان", cx: 148.5, cy: 133.7, r: 21.1 },
  { id: "Ardebil", fa: "اردبیل", slug: "ardebil", count: 1, hasRep: true, capital: "اردبیل", cx: 140.7, cy: 65.6, r: 15 },
  { id: "Lorestan", fa: "لرستان", slug: "lorestan", count: 1, hasRep: true, capital: "خرم‌آباد", cx: 133.6, cy: 263.4, r: 22.7 },
  { id: "Semnan", fa: "سمنان", slug: "semnan", count: 1, hasRep: true, capital: "سمنان", cx: 374.2, cy: 183.1, r: 46.1 },
  { id: "Chahar-Mahall-and-Bakhtiari", fa: "چهارمحال و بختیاری", slug: "chahar-mahall-and-bakhtiari", count: 1, hasRep: true, capital: "شهرکرد", cx: 228.4, cy: 328.7, r: 16.9 },
  { id: "Sistan-and-Baluchestan", fa: "سیستان و بلوچستان", slug: "sistan-and-baluchestan", count: 0, hasRep: false, capital: "زاهدان", cx: 563.7, cy: 504.4, r: 60.2 },
  { id: "South-Khorasan", fa: "خراسان جنوبی", slug: "south-khorasan", count: 0, hasRep: false, capital: "بیرجند", cx: 524.8, cy: 317.5, r: 43.6 },
  { id: "Ilam", fa: "ایلام", slug: "ilam", count: 0, hasRep: false, capital: "ایلام", cx: 107.6, cy: 290.5, r: 14.4 },
  { id: "Kohgiluyeh-and-Buyer-Ahmad", fa: "کهگیلویه و بویراحمد", slug: "kohgiluyeh-and-buyer-ahmad", count: 0, hasRep: false, capital: "یاسوج", cx: 229.2, cy: 373.1, r: 13.5 },
];
