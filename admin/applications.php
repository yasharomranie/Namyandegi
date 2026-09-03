<?php
require __DIR__ . '/../api/_db.php';
require __DIR__ . '/../api/_auth.php';
require __DIR__ . '/../api/_provinces.php';
require_login();

$statusFilter = $_GET['status'] ?? '';
$provinceFilter = $_GET['province'] ?? '';
$validStatuses = ['pending', 'approved', 'rejected'];

$where = [];
$params = [];
if (in_array($statusFilter, $validStatuses, true)) {
    $where[] = 'status = ?';
    $params[] = $statusFilter;
}
if (in_array($provinceFilter, PROVINCE_SLUGS, true)) {
    $where[] = 'province_slug = ?';
    $params[] = $provinceFilter;
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$perPage = 20;
$page = max(1, (int) ($_GET['page'] ?? 1));
$countStmt = db()->prepare("SELECT COUNT(*) FROM applications $whereSql");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();
$totalPages = max(1, (int) ceil($total / $perPage));
$page = min($page, $totalPages);
$offset = ($page - 1) * $perPage;

$stmt = db()->prepare("SELECT * FROM applications $whereSql ORDER BY created_at DESC LIMIT $perPage OFFSET $offset");
$stmt->execute($params);
$applications = $stmt->fetchAll();

$pendingCount = (int) db()->query("SELECT COUNT(*) FROM applications WHERE status = 'pending'")->fetchColumn();
$statusLabels = ['pending' => 'در انتظار', 'approved' => 'تأییدشده', 'rejected' => 'ردشده'];

$pageTitle = 'درخواست‌های نمایندگی';
require __DIR__ . '/_layout_top.php';

function qs_with($extra) {
    $params = array_merge($_GET, $extra);
    $params = array_filter($params, fn($v) => $v !== '' && $v !== null);
    return '?' . http_build_query($params);
}
?>
<div class="admin-topbar">
  <div>
    <h1>درخواست‌های نمایندگی</h1>
    <p><?= $total ?> درخواست ثبت‌شده</p>
  </div>
</div>

<div class="admin-card">
  <div class="admin-card-head">
    <h2>فهرست درخواست‌ها</h2>
    <form class="admin-filters" method="get">
      <select name="status" onchange="this.form.submit()">
        <option value="">همه وضعیت‌ها</option>
        <?php foreach ($statusLabels as $val => $label): ?>
          <option value="<?= h($val) ?>" <?= $statusFilter === $val ? 'selected' : '' ?>><?= h($label) ?></option>
        <?php endforeach; ?>
      </select>
      <select name="province" onchange="this.form.submit()">
        <option value="">همه استان‌ها</option>
        <?php foreach (PROVINCE_SLUGS as $slug): ?>
          <option value="<?= h($slug) ?>" <?= $provinceFilter === $slug ? 'selected' : '' ?>><?= h($slug) ?></option>
        <?php endforeach; ?>
      </select>
    </form>
  </div>
  <div class="admin-table-wrap">
    <?php if (!$applications): ?>
      <div class="admin-table-empty">درخواستی با این فیلتر پیدا نشد.</div>
    <?php else: ?>
      <table class="admin-table">
        <thead><tr><th>نام</th><th>رسته شغلی</th><th>استان / شهر</th><th>تلفن</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($applications as $a): ?>
          <tr>
            <td><?= h($a['first_name'] . ' ' . $a['last_name']) ?></td>
            <td><?= h($a['job_category']) ?></td>
            <td><?= h($a['province_slug']) ?> / <?= h($a['city']) ?></td>
            <td dir="ltr" style="text-align:left"><?= h($a['phone']) ?></td>
            <td><span class="status-badge status-<?= h($a['status']) ?>"><?= h($statusLabels[$a['status']] ?? $a['status']) ?></span></td>
            <td><?= h(substr($a['created_at'], 0, 10)) ?></td>
            <td><a href="application.php?id=<?= (int)$a['id'] ?>" class="icon-btn" aria-label="مشاهده">
              <svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg>
            </a></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
      <?php if ($totalPages > 1): ?>
        <div class="admin-pagination">
          <?php for ($p = 1; $p <= $totalPages; $p++): ?>
            <?php if ($p === $page): ?>
              <span class="is-current"><?= $p ?></span>
            <?php else: ?>
              <a href="<?= h(qs_with(['page' => $p])) ?>"><?= $p ?></a>
            <?php endif; ?>
          <?php endfor; ?>
        </div>
      <?php endif; ?>
    <?php endif; ?>
  </div>
</div>
<?php require __DIR__ . '/_layout_bottom.php'; ?>
