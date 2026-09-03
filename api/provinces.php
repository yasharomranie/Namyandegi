<?php
/**
 * GET /api/provinces.php
 * Returns { "<province_slug>": <active representative count>, ... } for
 * every province that has at least one active representative. Consumed
 * by assets/js/main.js's initMap() to patch the live counts onto the
 * static geometry/name data in assets/js/provinces-data.js — the slug
 * list itself stays defined client-side (it's tied to the SVG map), this
 * endpoint only supplies the numbers.
 */
require __DIR__ . '/_db.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    $rows = db()->query(
        "SELECT province_slug, COUNT(*) AS cnt
           FROM representatives
          WHERE status = 'active'
          GROUP BY province_slug"
    )->fetchAll();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'db_error'], JSON_UNESCAPED_UNICODE);
    exit;
}

$out = [];
foreach ($rows as $r) {
    $out[$r['province_slug']] = (int) $r['cnt'];
}
echo json_encode($out, JSON_UNESCAPED_UNICODE);
