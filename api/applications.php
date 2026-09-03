<?php
/**
 * POST /api/applications.php
 * Receives the multi-step "درخواست نمایندگی" form (assets/js/main.js's
 * initForm()) as multipart/form-data, validates it, stores it, optionally
 * stores the uploaded ID/license document, and emails the admin. Field
 * names match the <input name="..."> attributes in index.html exactly —
 * see the table in initForm() if you rename a field there.
 */
require __DIR__ . '/_db.php';
require __DIR__ . '/_provinces.php';
header('Content-Type: application/json; charset=utf-8');

// No `never` return type here on purpose — keeps this compatible with
// PHP 7.4+ shared hosting that hasn't been upgraded to 8.1 yet.
function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('روش درخواست پشتیبانی نمی‌شود', 405);
}

$required = ['firstName', 'lastName', 'jobCategory', 'phone', 'province', 'city', 'address'];
foreach ($required as $field) {
    if (trim((string) ($_POST[$field] ?? '')) === '') {
        fail('همه فیلدهای الزامی را پر کنید.');
    }
}
if (!preg_match('/^0\d{10}$/', $_POST['phone'])) {
    fail('شماره تماس معتبر نیست (باید با 0 شروع شود و ۱۱ رقم باشد).');
}
if (empty($_POST['agree'])) {
    fail('برای ارسال درخواست باید قوانین را تایید کنید.');
}
// province must be a real slug, not arbitrary input
if (!in_array($_POST['province'], PROVINCE_SLUGS, true)) {
    fail('استان انتخاب‌شده نامعتبر است.');
}

$documentPath = null;
if (!empty($_FILES['document']['name'])) {
    $file = $_FILES['document'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        fail('بارگذاری فایل با خطا مواجه شد.');
    }
    $cfg = app_config();
    if ($file['size'] > $cfg['upload_max_bytes']) {
        fail('حجم فایل بیش از حد مجاز است (حداکثر ' . round($cfg['upload_max_bytes'] / 1024 / 1024) . ' مگابایت).');
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'application/pdf' => 'pdf'];
    if (!isset($allowed[$mime])) {
        fail('فرمت فایل مجاز نیست — فقط JPG، PNG یا PDF.');
    }
    if (!is_dir($cfg['upload_dir']) && !mkdir($cfg['upload_dir'], 0755, true) && !is_dir($cfg['upload_dir'])) {
        fail('پوشه بارگذاری در دسترس نیست.', 500);
    }
    $filename = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
    if (!move_uploaded_file($file['tmp_name'], $cfg['upload_dir'] . '/' . $filename)) {
        fail('ذخیره فایل با خطا مواجه شد.', 500);
    }
    $documentPath = $filename;
}

try {
    $stmt = db()->prepare(
        "INSERT INTO applications
            (first_name, last_name, job_category, phone, province_slug, city, address,
             experience, capital_range, has_property, motivation, document_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        trim($_POST['firstName']),
        trim($_POST['lastName']),
        $_POST['jobCategory'],
        $_POST['phone'],
        $_POST['province'],
        trim($_POST['city']),
        trim($_POST['address']),
        $_POST['experience'] ?? null,
        $_POST['capital'] ?? null,
        $_POST['hasProperty'] ?? null,
        $_POST['motivation'] ?? null,
        $documentPath,
    ]);
} catch (PDOException $e) {
    fail('ذخیره درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید.', 500);
}

// Best-effort notification — a host without mail() configured shouldn't
// turn a successfully-saved application into a failed request.
$cfg = app_config();
$subject = '=?UTF-8?B?' . base64_encode('درخواست نمایندگی جدید') . '?=';
$body = sprintf(
    "نام: %s %s\nتلفن: %s\nاستان: %s\nشهر: %s\nرسته شغلی: %s\n\nبرای بررسی وارد پنل مدیریت شوید.",
    $_POST['firstName'], $_POST['lastName'], $_POST['phone'], $_POST['province'], $_POST['city'], $_POST['jobCategory']
);
@mail($cfg['admin_notify_email'], $subject, $body, "Content-Type: text/plain; charset=UTF-8\r\n");

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
