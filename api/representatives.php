<?php
/**
 * GET /api/representatives.php?province=<slug>
 * Returns the active representatives for one province as a JSON array,
 * shaped exactly like the sample generator in
 * assets/js/representatives-data.js (name, initial, specialty, city,
 * address, phone, phoneHref, activeSince) — representatives.js and the
 * embedded artifact overlay render whichever of the two it gets back
 * without caring which one it was.
 */
require __DIR__ . '/_db.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$slug = $_GET['province'] ?? '';
if (!preg_match('/^[a-z-]{1,60}$/', $slug)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_province'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmt = db()->prepare(
        "SELECT full_name, job_category, phone, city, address, active_since_year
           FROM representatives
          WHERE province_slug = ? AND status = 'active'
          ORDER BY created_at DESC"
    );
    $stmt->execute([$slug]);
    $rows = $stmt->fetchAll();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'db_error'], JSON_UNESCAPED_UNICODE);
    exit;
}

function format_phone_display(string $digits): string {
    // 09121234567 -> ۰۹۱۲-۱۲۳-۴۵۶۷ (same masked-looking pattern the rest
    // of the site already uses, just with the representative's real number)
    $parts = [substr($digits, 0, 4), substr($digits, 4, 3), substr($digits, 7)];
    return to_persian_digits(implode('-', array_filter($parts, fn($p) => $p !== '')));
}

$out = array_map(function ($r) {
    $digits = preg_replace('/\D/', '', $r['phone']);
    $nameParts = preg_split('/\s+/', trim($r['full_name']));
    return [
        'name'        => $r['full_name'],
        'initial'     => mb_substr($nameParts[0] ?? $r['full_name'], 0, 1, 'UTF-8'),
        'specialty'   => $r['job_category'],
        'city'        => $r['city'],
        'address'     => $r['address'],
        'phone'       => format_phone_display($digits),
        // 09121234567 -> +989121234567 (drop the leading trunk 0, add +98)
        'phoneHref'   => 'tel:+98' . substr($digits, 1),
        'activeSince' => to_persian_digits((string) $r['active_since_year']),
    ];
}, $rows);

echo json_encode($out, JSON_UNESCAPED_UNICODE);
