<?php
/**
 * GET /api/all-representatives.php?q=<optional search text>
 * Returns every active representative across every province (not scoped to
 * one, unlike api/representatives.php) as a flat JSON array — each entry
 * shaped like that endpoint's plus a `provinceSlug`, so the front-end
 * (all-representatives.html / assets/js/all-representatives.js) can group
 * the flat list by province itself using the Persian names it already has
 * in assets/js/provinces-data.js, rather than this endpoint duplicating
 * them.
 *
 * `q` (optional) is the single AJAX search box's only input: it matches a
 * representative's name, their city, OR their province's Persian name —
 * one query covers all three the way the request asked for, instead of
 * three separate filter controls.
 */
require __DIR__ . '/_db.php';
require __DIR__ . '/_provinces.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$q = trim($_GET['q'] ?? '');
// Cap absurdly long input rather than reject it outright — a search box
// should never 400 on the user, just not match anything past this length.
if (mb_strlen($q) > 100) $q = mb_substr($q, 0, 100);

try {
    if ($q === '') {
        $stmt = db()->prepare(
            "SELECT full_name, job_category, phone, city, address, active_since_year, province_slug
               FROM representatives
              WHERE status = 'active'
              ORDER BY full_name"
        );
        $stmt->execute();
    } else {
        // Province names live in PROVINCE_NAMES (fa), not in the table
        // itself (which only stores the slug) — so "matches the province
        // name" is resolved here into a plain slug list first.
        $matchingSlugs = [];
        foreach (PROVINCE_NAMES as $slug => $fa) {
            if (mb_stripos($fa, $q) !== false) $matchingSlugs[] = $slug;
        }

        $conditions = ['full_name LIKE :q', 'city LIKE :q'];
        $params = [':q' => '%' . $q . '%'];
        if ($matchingSlugs) {
            $placeholders = [];
            foreach (array_values($matchingSlugs) as $i => $slug) {
                $key = ':slug' . $i;
                $placeholders[] = $key;
                $params[$key] = $slug;
            }
            $conditions[] = 'province_slug IN (' . implode(',', $placeholders) . ')';
        }

        $stmt = db()->prepare(
            "SELECT full_name, job_category, phone, city, address, active_since_year, province_slug
               FROM representatives
              WHERE status = 'active' AND (" . implode(' OR ', $conditions) . ")
              ORDER BY full_name"
        );
        $stmt->execute($params);
    }
    $rows = $stmt->fetchAll();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'db_error'], JSON_UNESCAPED_UNICODE);
    exit;
}

function format_phone_display_all(string $digits): string {
    // 09121234567 -> ۰۹۱۲-۱۲۳-۴۵۶۷ (same masked-looking pattern the rest
    // of the site already uses, just with the representative's real number)
    $parts = [substr($digits, 0, 4), substr($digits, 4, 3), substr($digits, 7)];
    return to_persian_digits(implode('-', array_filter($parts, fn($p) => $p !== '')));
}

$out = array_map(function ($r) {
    $digits = preg_replace('/\D/', '', $r['phone']);
    $nameParts = preg_split('/\s+/', trim($r['full_name']));
    return [
        'name'         => $r['full_name'],
        'initial'      => mb_substr($nameParts[0] ?? $r['full_name'], 0, 1, 'UTF-8'),
        'specialty'    => $r['job_category'],
        'city'         => $r['city'],
        'address'      => $r['address'],
        'phone'        => format_phone_display_all($digits),
        // 09121234567 -> +989121234567 (drop the leading trunk 0, add +98)
        'phoneHref'    => 'tel:+98' . substr($digits, 1),
        'activeSince'  => to_persian_digits((string) $r['active_since_year']),
        'provinceSlug' => $r['province_slug'],
    ];
}, $rows);

echo json_encode($out, JSON_UNESCAPED_UNICODE);
