<?php
/**
 * _provinces.php — the same 31 province slugs as assets/js/provinces-data.js,
 * kept server-side so api/applications.php can validate the submitted
 * province against a real list instead of trusting arbitrary client input.
 * Keep in sync with the `slug` values in provinces-data.js if that ever
 * changes (new province, renamed slug, etc).
 */
const PROVINCE_SLUGS = [
    'tehran', 'esfahan', 'razavi-khorasan', 'fars', 'gilan', 'mazandaran',
    'east-azarbaijan', 'khuzestan', 'alborz', 'kerman', 'kermanshah', 'yazd',
    'qom', 'west-azarbaijan', 'qazvin', 'hamadan', 'markazi', 'hormozgan',
    'golestan', 'bushehr', 'kordestan', 'north-khorasan', 'zanjan', 'ardebil',
    'lorestan', 'semnan', 'chahar-mahall-and-bakhtiari', 'sistan-and-baluchestan',
    'south-khorasan', 'ilam', 'kohgiluyeh-and-buyer-ahmad',
];

/** slug -> Persian name, for the admin panel's dropdowns (the public site
 *  gets this from assets/js/provinces-data.js instead; keep both in sync). */
const PROVINCE_NAMES = [
    'tehran' => 'تهران', 'esfahan' => 'اصفهان', 'razavi-khorasan' => 'خراسان رضوی',
    'fars' => 'فارس', 'gilan' => 'گیلان', 'mazandaran' => 'مازندران',
    'east-azarbaijan' => 'آذربایجان شرقی', 'khuzestan' => 'خوزستان', 'alborz' => 'البرز',
    'kerman' => 'کرمان', 'kermanshah' => 'کرمانشاه', 'yazd' => 'یزد', 'qom' => 'قم',
    'west-azarbaijan' => 'آذربایجان غربی', 'qazvin' => 'قزوین', 'hamadan' => 'همدان',
    'markazi' => 'مرکزی', 'hormozgan' => 'هرمزگان', 'golestan' => 'گلستان',
    'bushehr' => 'بوشهر', 'kordestan' => 'کردستان', 'north-khorasan' => 'خراسان شمالی',
    'zanjan' => 'زنجان', 'ardebil' => 'اردبیل', 'lorestan' => 'لرستان',
    'semnan' => 'سمنان', 'chahar-mahall-and-bakhtiari' => 'چهارمحال و بختیاری',
    'sistan-and-baluchestan' => 'سیستان و بلوچستان', 'south-khorasan' => 'خراسان جنوبی',
    'ilam' => 'ایلام', 'kohgiluyeh-and-buyer-ahmad' => 'کهگیلویه و بویراحمد',
];

/** Same list the public application form offers in index.html's
 *  #jobCategory select (see JOB_CATEGORIES in assets/js/main.js). */
const JOB_CATEGORIES = [
    'املاک و مستغلات', 'پوشاک و مد', 'خودرو و لوازم یدکی', 'الکترونیک و دیجیتال',
    'مواد غذایی', 'خدمات فنی و مهندسی', 'بهداشت و زیبایی', 'کشاورزی', 'سایر',
];
