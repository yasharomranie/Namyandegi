<?php
require __DIR__ . '/../api/_db.php';
require __DIR__ . '/../api/_auth.php';
require_login();

$id = (int) ($_GET['id'] ?? 0);
$stmt = db()->prepare('SELECT * FROM applications WHERE id = ?');
$stmt->execute([$id]);
$app = $stmt->fetch();
if (!$app) {
    http_response_code(404);
    die('درخواستی با این شناسه پیدا نشد.');
}

$notice = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? '';
    if (in_array($action, ['approved', 'rejected'], true)) {
        $upd = db()->prepare('UPDATE applications SET status = ?, admin_note = ? WHERE id = ?');
        $upd->execute([$action, trim($_POST['admin_note'] ?? '') ?: null, $id]);
        $app['status'] = $action;
        $app['admin_note'] = trim($_POST['admin_note'] ?? '') ?: null;
        $notice = $action === 'approved' ? 'درخواست تأیید شد.' : 'درخواست رد شد.';
    }
}

$statusLabels = ['pending' => 'در انتظار بررسی', 'approved' => 'تأییدشده', 'rejected' => 'ردشده'];
$pendingCount = (int) db()->query("SELECT COUNT(*) FROM applications WHERE status = 'pending'")->fetchColumn();

$pageTitle = 'درخواست ' . $app['first_name'] . ' ' . $app['last_name'];
require __DIR__ . '/_layout_top.php';
?>
<div class="admin-topbar">
  <div>
    <h1><?= h($app['first_name'] . ' ' . $app['last_name']) ?></h1>
    <p>درخواست شماره <?= (int)$app['id'] ?> — ثبت‌شده در <?= h($app['created_at']) ?></p>
  </div>
  <a href="applications.php" class="btn btn-ghost">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 5l7 7-7 7M21 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>بازگشت به فهرست</span>
  </a>
</div>

<?php if ($notice): ?>
  <div class="admin-alert admin-alert-success">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span><?= h($notice) ?></span>
  </div>
<?php endif; ?>

<div class="admin-detail-grid">
  <div class="admin-card">
    <div class="admin-card-head">
      <h2>اطلاعات درخواست</h2>
      <span class="status-badge status-<?= h($app['status']) ?>"><?= h($statusLabels[$app['status']] ?? $app['status']) ?></span>
    </div>
    <dl class="admin-kv">
      <dt>نام و نام‌خانوادگی</dt><dd><?= h($app['first_name'] . ' ' . $app['last_name']) ?></dd>
      <dt>رسته شغلی</dt><dd><?= h($app['job_category']) ?></dd>
      <dt>شماره تماس</dt><dd dir="ltr" style="unicode-bidi:embed"><?= h($app['phone']) ?></dd>
      <dt>استان</dt><dd><?= h($app['province_slug']) ?></dd>
      <dt>شهر</dt><dd><?= h($app['city']) ?></dd>
      <dt>آدرس</dt><dd><?= h($app['address']) ?></dd>
      <dt>سابقه فعالیت</dt><dd><?= h($app['experience'] ?: '—') ?></dd>
      <dt>سرمایه در دسترس</dt><dd><?= h($app['capital_range'] ?: '—') ?></dd>
      <dt>ملک/فروشگاه</dt><dd><?= h($app['has_property'] ?: '—') ?></dd>
      <dt>توضیحات</dt><dd><?= nl2br(h($app['motivation'] ?: '—')) ?></dd>
      <dt>مدرک پیوست</dt>
      <dd>
        <?php if ($app['document_path']): ?>
          <a href="../uploads/applications/<?= h($app['document_path']) ?>" target="_blank" rel="noopener" class="btn btn-ghost" style="min-height:36px;padding-block:0;display:inline-flex">مشاهده فایل</a>
        <?php else: ?>—<?php endif; ?>
      </dd>
    </dl>
  </div>

  <div class="admin-card">
    <div class="admin-card-head"><h2>تصمیم‌گیری</h2></div>
    <div class="admin-form-body">
      <form method="post">
        <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
        <div class="field">
          <label for="admin_note">یادداشت داخلی (اختیاری)</label>
          <textarea id="admin_note" name="admin_note"><?= h($app['admin_note'] ?? '') ?></textarea>
        </div>
        <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">
          <button type="submit" name="action" value="approved" class="btn btn-primary" style="flex:1">تأیید درخواست</button>
          <button type="submit" name="action" value="rejected" class="btn btn-ghost" style="flex:1">رد درخواست</button>
        </div>
      </form>

      <?php if ($app['status'] === 'approved'): ?>
        <a href="representative-form.php?from_application=<?= (int)$app['id'] ?>" class="btn btn-accent btn-block" style="justify-content:center;margin-top:var(--sp-4)">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>ساخت نماینده از این درخواست</span>
        </a>
      <?php endif; ?>
    </div>
  </div>
</div>
<?php require __DIR__ . '/_layout_bottom.php'; ?>
