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
 *   fa      -> Persian province name shown in the tooltip / linked page
 *   slug    -> used to build the representatives.html?province=<slug> link
 *   count   -> number of active representatives (sample data)
 *   hasRep  -> false = "no representative yet" state (invites applicants)
 * -----------------------------------------------------------------------
 */
window.PROVINCES_DATA = [
  { id: "Tehran", fa: "تهران", slug: "tehran", count: 12, hasRep: true },
  { id: "Esfahan", fa: "اصفهان", slug: "esfahan", count: 7, hasRep: true },
  { id: "Razavi-Khorasan", fa: "خراسان رضوی", slug: "razavi-khorasan", count: 6, hasRep: true },
  { id: "Fars", fa: "فارس", slug: "fars", count: 6, hasRep: true },
  { id: "Gilan", fa: "گیلان", slug: "gilan", count: 5, hasRep: true },
  { id: "Mazandaran", fa: "مازندران", slug: "mazandaran", count: 5, hasRep: true },
  { id: "East-Azarbaijan", fa: "آذربایجان شرقی", slug: "east-azarbaijan", count: 5, hasRep: true },
  { id: "Khuzestan", fa: "خوزستان", slug: "khuzestan", count: 4, hasRep: true },
  { id: "Alborz", fa: "البرز", slug: "alborz", count: 4, hasRep: true },
  { id: "Kerman", fa: "کرمان", slug: "kerman", count: 3, hasRep: true },
  { id: "Kermanshah", fa: "کرمانشاه", slug: "kermanshah", count: 3, hasRep: true },
  { id: "Yazd", fa: "یزد", slug: "yazd", count: 3, hasRep: true },
  { id: "Qom", fa: "قم", slug: "qom", count: 3, hasRep: true },
  { id: "West-Azarbaijan", fa: "آذربایجان غربی", slug: "west-azarbaijan", count: 2, hasRep: true },
  { id: "Qazvin", fa: "قزوین", slug: "qazvin", count: 2, hasRep: true },
  { id: "Hamadan", fa: "همدان", slug: "hamadan", count: 2, hasRep: true },
  { id: "Markazi", fa: "مرکزی", slug: "markazi", count: 2, hasRep: true },
  { id: "Hormozgan", fa: "هرمزگان", slug: "hormozgan", count: 2, hasRep: true },
  { id: "Golestan", fa: "گلستان", slug: "golestan", count: 2, hasRep: true },
  { id: "Bushehr", fa: "بوشهر", slug: "bushehr", count: 2, hasRep: true },
  { id: "Kordestan", fa: "کردستان", slug: "kordestan", count: 2, hasRep: true },
  { id: "North-Khorasan", fa: "خراسان شمالی", slug: "north-khorasan", count: 1, hasRep: true },
  { id: "Zanjan", fa: "زنجان", slug: "zanjan", count: 1, hasRep: true },
  { id: "Ardebil", fa: "اردبیل", slug: "ardebil", count: 1, hasRep: true },
  { id: "Lorestan", fa: "لرستان", slug: "lorestan", count: 1, hasRep: true },
  { id: "Semnan", fa: "سمنان", slug: "semnan", count: 1, hasRep: true },
  { id: "Chahar-Mahall-and-Bakhtiari", fa: "چهارمحال و بختیاری", slug: "chahar-mahall-and-bakhtiari", count: 1, hasRep: true },
  { id: "Sistan-and-Baluchestan", fa: "سیستان و بلوچستان", slug: "sistan-and-baluchestan", count: 0, hasRep: false },
  { id: "South-Khorasan", fa: "خراسان جنوبی", slug: "south-khorasan", count: 0, hasRep: false },
  { id: "Ilam", fa: "ایلام", slug: "ilam", count: 0, hasRep: false },
  { id: "Kohgiluyeh-and-Buyer-Ahmad", fa: "کهگیلویه و بویراحمد", slug: "kohgiluyeh-and-buyer-ahmad", count: 0, hasRep: false },
];
