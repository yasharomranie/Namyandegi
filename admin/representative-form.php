<?php
require __DIR__ . '/../api/_db.php';
require __DIR__ . '/../api/_auth.php';
require __DIR__ . '/../api/_provinces.php';
require_login();

$id = (int) ($_GET['id'] ?? 0);
$isEdit = $id > 0;
$rep = [
    'province_slug' => '', 'full_name' => '', 'job_category' => '', 'phone' => '',
    'city' => '', 'address' => '', 'active_since_year' => '', 'status' => 'active',
];

if ($isEdit) {
    $stmt = db()->prepare('SELECT * FROM representatives WHERE id = ?');
    $stmt->execute([$id]);
    $found = $stmt->fetch();
    if (!$found) { http_response_code(404); die('نماینده‌ای با این شناسه پیدا نشد.'); }
    $rep = $found;
} elseif (!empty($_GET['from_application'])) {
    // Pre-fill from an approved application (see the button in application.php)
    $stmt = db()->prepare('SELECT * FROM applications WHERE id = ?');
    $stmt->execute([(int) $_GET['from_application']]);
    if ($a = $stmt->fetch()) {
        $rep['province_slug'] = $a['province_slug'];
        $rep['full_name'] = trim($a['first_name'] . ' ' . $a['last_name']);
        $rep['job_category'] = $a['job_category'];
        $rep['phone'] = $a['phone'];
        $rep['city'] = $a['city'];
        $rep['address'] = $a['address'];
    }
}

$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $rep = [
        'province_slug'     => $_POST['province_slug'] ?? '',
        'full_name'         => trim($_POST['full_name'] ?? ''),
        'job_category'      => $_POST['job_category'] ?? '',
        'phone'             => trim($_POST['phone'] ?? ''),
        'city'              => trim($_POST['city'] ?? ''),
        'address'           => trim($_POST['address'] ?? ''),
        'active_since_year' => trim($_POST['active_since_year'] ?? ''),
        'status'            => $_POST['status'] ?? 'active',
    ];

    if (!in_array($rep['province_slug'], PROVINCE_SLUGS, true)) $errors[] = 'استان معتبر نیست.';
    if ($rep['full_name'] === '') $errors[] = 'نام و نام‌خانوادگی الزامی است.';
    if (!in_array($rep['job_category'], JOB_CATEGORIES, true)) $errors[] = 'رسته شغلی معتبر نیست.';
    if (!preg_match('/^0\d{10}$/', $rep['phone'])) $errors[] = 'شماره تماس معتبر نیست.';
    if ($rep['city'] === '') $errors[] = 'شهر الزامی است.';
    if ($rep['address'] === '') $errors[] = 'آدرس الزامی است.';
    // 1300-1499: comfortably covers any real "since" year without hardcoding
    // today's actual Jalali year (which the Gregorian-only PHP date() can't
    // give us directly anyway).
    if (!preg_match('/^1[34]\d{2}$/', $rep['active_since_year'])) $errors[] = 'سال فعالیت باید یک سال شمسی معتبر باشد (مثل ۱۴۰۳).';
    if (!in_array($rep['status'], ['active', 'inactive'], true)) $errors[] = 'وضعیت معتبر نیست.';

    if (!$errors) {
        if ($isEdit) {
            $stmt = db()->prepare(
                'UPDATE representatives SET province_slug=?, full_name=?, job_category=?, phone=?, city=?, address=?, active_since_year=?, status=? WHERE id=?'
            );
            $stmt->execute([
                $rep['province_slug'], $rep['full_name'], $rep['job_category'], $rep['phone'],
                $rep['city'], $rep['address'], $rep['active_since_year'], $rep['status'], $id,
            ]);
        } else {
            $stmt = db()->prepare(
                'INSERT INTO representatives (province_slug, full_name, job_category, phone, city, address, active_since_year, status) VALUES (?,?,?,?,?,?,?,?)'
            );
            $stmt->execute([
                $rep['province_slug'], $rep['full_name'], $rep['job_category'], $rep['phone'],
                $rep['city'], $rep['address'], $rep['active_since_year'], $rep['status'],
            ]);
        }
        header('Location: representatives.php?saved=1');
        exit;
    }
}

$pendingCount = (int) db()->query("SELECT COUNT(*) FROM applications WHERE status = 'pending'")->fetchColumn();
$pageTitle = $isEdit ? 'ویرایش نماینده' : 'افزودن نماینده';
require __DIR__ . '/_layout_top.php';
?>
<div class="admin-topbar">
  <div>
    <h1><?= h($pageTitle) ?></h1>
  </div>
  <a href="representatives.php" class="btn btn-ghost">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 5l7 7-7 7M21 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>بازگشت به فهرست</span>
  </a>
</div>

<?php if ($errors): ?>
  <div class="admin-alert admin-alert-error">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5m0 3h.01M12 2 2 20h20L12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span><?= h(implode(' / ', $errors)) ?></span>
  </div>
<?php endif; ?>

<div class="admin-card" style="max-width:640px">
  <form method="post">
    <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
    <div class="admin-form-body">
      <div class="field-grid">
        <div class="field">
          <label for="full_name">نام و نام‌خانوادگی <span class="req">*</span></label>
          <input type="text" id="full_name" name="full_name" required value="<?= h($rep['full_name']) ?>">
        </div>
        <div class="field">
          <label for="phone">شماره تماس <span class="req">*</span></label>
          <input type="tel" id="phone" name="phone" required pattern="0\d{10}" placeholder="09xxxxxxxxx" value="<?= h($rep['phone']) ?>">
        </div>
        <div class="field">
          <label for="province_slug">استان <span class="req">*</span></label>
          <select id="province_slug" name="province_slug" required>
            <option value="" disabled <?= $rep['province_slug'] === '' ? 'selected' : '' ?>>انتخاب کنید</option>
            <?php foreach (PROVINCE_NAMES as $slug => $name): ?>
              <option value="<?= h($slug) ?>" <?= $rep['province_slug'] === $slug ? 'selected' : '' ?>><?= h($name) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="field">
          <label for="city">شهر <span class="req">*</span></label>
          <input type="text" id="city" name="city" required value="<?= h($rep['city']) ?>">
        </div>
        <div class="field">
          <label for="job_category">رسته شغلی <span class="req">*</span></label>
          <select id="job_category" name="job_category" required>
            <option value="" disabled <?= $rep['job_category'] === '' ? 'selected' : '' ?>>انتخاب کنید</option>
            <?php foreach (JOB_CATEGORIES as $cat): ?>
              <option value="<?= h($cat) ?>" <?= $rep['job_category'] === $cat ? 'selected' : '' ?>><?= h($cat) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="field">
          <label for="active_since_year">فعال از سال (شمسی) <span class="req">*</span></label>
          <input type="text" id="active_since_year" name="active_since_year" required pattern="1[34]\d{2}" placeholder="مثلاً ۱۴۰۳" value="<?= h((string)$rep['active_since_year']) ?>">
        </div>
        <div class="field span-2">
          <label for="address">آدرس <span class="req">*</span></label>
          <textarea id="address" name="address" required><?= h($rep['address']) ?></textarea>
        </div>
        <div class="field">
          <label for="status">وضعیت</label>
          <select id="status" name="status">
            <option value="active" <?= $rep['status'] === 'active' ? 'selected' : '' ?>>فعال (روی سایت نمایش داده می‌شود)</option>
            <option value="inactive" <?= $rep['status'] === 'inactive' ? 'selected' : '' ?>>غیرفعال (مخفی از سایت)</option>
          </select>
        </div>
      </div>
    </div>
    <div class="admin-form-actions">
      <button type="submit" class="btn btn-primary"><?= $isEdit ? 'ذخیره تغییرات' : 'افزودن نماینده' ?></button>
      <a href="representatives.php" class="btn btn-ghost">انصراف</a>
    </div>
  </form>
</div>
<?php require __DIR__ . '/_layout_bottom.php'; ?>
