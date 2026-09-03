<?php
/**
 * _layout_top.php — include at the top of every logged-in admin page after
 * require_login(). Expects $pageTitle (string) to already be set; reads
 * $pendingCount if the caller wants a badge on "درخواست‌ها" in the sidebar
 * (dashboard/applications set it, others just omit it).
 */
$admin = current_admin();
$currentPage = basename($_SERVER['SCRIPT_NAME']);
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= h($pageTitle) ?> | پنل مدیریت</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css">
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<div class="admin-shell">
  <aside class="admin-sidebar">
    <a href="index.php" class="admin-sidebar-brand">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span>پنل مدیریت</span>
    </a>
    <nav class="admin-nav" aria-label="ناوبری پنل مدیریت">
      <a href="index.php" class="<?= $currentPage === 'index.php' ? 'is-active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>داشبورد</span>
      </a>
      <a href="applications.php" class="<?= in_array($currentPage, ['applications.php', 'application.php']) ? 'is-active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12h6m-6 4h6M9 8h1M6 4h12a2 2 0 0 1 2 2v13a1 1 0 0 1-1.45.9L15 18l-3 1.5L9 18l-3.55 1.9A1 1 0 0 1 4 19V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>درخواست‌ها</span>
        <?php if (!empty($pendingCount)): ?><span class="badge-count"><?= (int)$pendingCount ?></span><?php endif; ?>
      </a>
      <a href="representatives.php" class="<?= in_array($currentPage, ['representatives.php', 'representative-form.php']) ? 'is-active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm11 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>نمایندگان</span>
      </a>
      <a href="../index.html" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 5l7 7-7 7M21 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>مشاهده سایت</span>
      </a>
    </nav>
    <div class="admin-sidebar-foot">
      <div class="who">وارد شده با: <?= h($admin['username']) ?></div>
      <a href="logout.php" class="btn btn-ghost btn-block" style="justify-content:center">خروج</a>
    </div>
  </aside>

  <main class="admin-main">
