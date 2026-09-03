<?php
require __DIR__ . '/../api/_db.php';
require __DIR__ . '/../api/_auth.php';
require_login();

$pendingCount = (int) db()->query("SELECT COUNT(*) FROM applications WHERE status = 'pending'")->fetchColumn();
$totalApplications = (int) db()->query('SELECT COUNT(*) FROM applications')->fetchColumn();
$totalReps = (int) db()->query("SELECT COUNT(*) FROM representatives WHERE status = 'active'")->fetchColumn();
$coveredProvinces = (int) db()->query("SELECT COUNT(DISTINCT province_slug) FROM representatives WHERE status = 'active'")->fetchColumn();

$recentApplications = db()->query(
    "SELECT id, first_name, last_name, province_slug, status, created_at
       FROM applications ORDER BY created_at DESC LIMIT 5"
)->fetchAll();

$pageTitle = 'داشبورد';
require __DIR__ . '/_layout_top.php';
?>
<div class="admin-topbar">
  <div>
    <h1>داشبورد</h1>
    <p>نمای کلی درخواست‌ها و نمایندگان فعال</p>
  </div>
</div>

<div class="admin-stats">
  <div class="admin-stat-card"><b><?= $pendingCount ?></b><span>درخواست در انتظار بررسی</span></div>
  <div class="admin-stat-card"><b><?= $totalApplications ?></b><span>مجموع درخواست‌ها</span></div>
  <div class="admin-stat-card"><b><?= $totalReps ?></b><span>نماینده فعال</span></div>
  <div class="admin-stat-card"><b><?= $coveredProvinces ?></b><span>استان تحت پوشش</span></div>
</div>

<div class="admin-card">
  <div class="admin-card-head">
    <h2>آخرین درخواست‌ها</h2>
    <a href="applications.php" class="btn btn-ghost" style="min-height:36px;padding-block:0">مشاهده همه</a>
  </div>
  <div class="admin-table-wrap">
    <?php if (!$recentApplications): ?>
      <div class="admin-table-empty">هنوز هیچ درخواستی ثبت نشده است.</div>
    <?php else: ?>
      <table class="admin-table">
        <thead><tr><th>نام</th><th>استان</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($recentApplications as $a): ?>
          <tr>
            <td><?= h($a['first_name'] . ' ' . $a['last_name']) ?></td>
            <td><?= h($a['province_slug']) ?></td>
            <td><span class="status-badge status-<?= h($a['status']) ?>">
              <?= ['pending' => 'در انتظار', 'approved' => 'تأییدشده', 'rejected' => 'ردشده'][$a['status']] ?? h($a['status']) ?>
            </span></td>
            <td><?= h($a['created_at']) ?></td>
            <td><a href="application.php?id=<?= (int)$a['id'] ?>" class="icon-btn" aria-label="مشاهده">
              <svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg>
            </a></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>
</div>
<?php require __DIR__ . '/_layout_bottom.php'; ?>
