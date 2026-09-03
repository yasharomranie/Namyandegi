<?php
require __DIR__ . '/../api/_db.php';
require __DIR__ . '/../api/_auth.php';
require __DIR__ . '/../api/_provinces.php';
require_login();

$provinceFilter = $_GET['province'] ?? '';
$statusFilter = $_GET['status'] ?? '';
$where = [];
$params = [];
if (in_array($provinceFilter, PROVINCE_SLUGS, true)) { $where[] = 'province_slug = ?'; $params[] = $provinceFilter; }
if (in_array($statusFilter, ['active', 'inactive'], true)) { $where[] = 'status = ?'; $params[] = $statusFilter; }
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$stmt = db()->prepare("SELECT * FROM representatives $whereSql ORDER BY province_slug, full_name");
$stmt->execute($params);
$reps = $stmt->fetchAll();

$pendingCount = (int) db()->query("SELECT COUNT(*) FROM applications WHERE status = 'pending'")->fetchColumn();
$statusLabels = ['active' => 'فعال', 'inactive' => 'غیرفعال'];

$pageTitle = 'نمایندگان';
require __DIR__ . '/_layout_top.php';
?>
<div class="admin-topbar">
  <div>
    <h1>نمایندگان</h1>
    <p><?= count($reps) ?> نماینده</p>
  </div>
  <a href="representative-form.php" class="btn btn-primary">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>افزودن نماینده</span>
  </a>
</div>

<div class="admin-card">
  <div class="admin-card-head">
    <h2>فهرست نمایندگان</h2>
    <form class="admin-filters" method="get">
      <select name="province" onchange="this.form.submit()">
        <option value="">همه استان‌ها</option>
        <?php foreach (PROVINCE_SLUGS as $slug): ?>
          <option value="<?= h($slug) ?>" <?= $provinceFilter === $slug ? 'selected' : '' ?>><?= h($slug) ?></option>
        <?php endforeach; ?>
      </select>
      <select name="status" onchange="this.form.submit()">
        <option value="">همه وضعیت‌ها</option>
        <?php foreach ($statusLabels as $val => $label): ?>
          <option value="<?= h($val) ?>" <?= $statusFilter === $val ? 'selected' : '' ?>><?= h($label) ?></option>
        <?php endforeach; ?>
      </select>
    </form>
  </div>
  <div class="admin-table-wrap">
    <?php if (!$reps): ?>
      <div class="admin-table-empty">هنوز نماینده‌ای ثبت نشده.</div>
    <?php else: ?>
      <table class="admin-table">
        <thead><tr><th>نام</th><th>رسته شغلی</th><th>استان / شهر</th><th>تلفن</th><th>وضعیت</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($reps as $r): ?>
          <tr>
            <td><?= h($r['full_name']) ?></td>
            <td><?= h($r['job_category']) ?></td>
            <td><?= h($r['province_slug']) ?> / <?= h($r['city']) ?></td>
            <td dir="ltr" style="text-align:left"><?= h($r['phone']) ?></td>
            <td><span class="status-badge status-<?= h($r['status']) ?>"><?= h($statusLabels[$r['status']] ?? $r['status']) ?></span></td>
            <td class="admin-actions-cell">
              <a href="representative-form.php?id=<?= (int)$r['id'] ?>" class="icon-btn" aria-label="ویرایش">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
              <form method="post" action="representative-delete.php" onsubmit="return confirm('این نماینده حذف شود؟');">
                <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
                <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
                <button type="submit" class="icon-btn danger" aria-label="حذف">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>
</div>
<?php require __DIR__ . '/_layout_bottom.php'; ?>
