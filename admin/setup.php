<?php
/**
 * setup.php — one-time "create the first admin account" page. Refuses to
 * run once an admin already exists, so it's safe to leave on the server
 * (though deleting it afterward, or at least noting it in your own
 * to-do list, is still good hygiene — see the README).
 */
require __DIR__ . '/../api/_db.php';
require __DIR__ . '/../api/_auth.php';

$existingCount = (int) db()->query('SELECT COUNT(*) FROM admins')->fetchColumn();
$error = null;

if ($existingCount > 0) {
    // Already set up — don't let this page create a second/rogue account silently.
    $alreadyDone = true;
} else {
    $alreadyDone = false;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $username = trim($_POST['username'] ?? '');
        $password = (string) ($_POST['password'] ?? '');
        $password2 = (string) ($_POST['password2'] ?? '');

        if ($username === '' || mb_strlen($username) < 3) {
            $error = 'نام کاربری باید حداقل ۳ کاراکتر باشد.';
        } elseif (strlen($password) < 8) {
            $error = 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
        } elseif ($password !== $password2) {
            $error = 'تکرار رمز عبور با رمز عبور یکسان نیست.';
        } else {
            $stmt = db()->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)');
            $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT)]);
            header('Location: login.php?created=1');
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>راه‌اندازی اولیه پنل مدیریت</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css">
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<div class="admin-auth-page">
  <div class="admin-auth-card">
    <div class="admin-auth-brand">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span>پنل مدیریت</span>
    </div>

    <?php if ($alreadyDone): ?>
      <h1>راه‌اندازی قبلاً انجام شده</h1>
      <p class="lead">یک حساب مدیر از قبل وجود دارد. این صفحه دیگر کاری انجام نمی‌دهد — از صفحه ورود استفاده کنید.
        برای امنیت بیشتر، بهتر است بعداً همین فایل (<code>admin/setup.php</code>) را از روی هاست حذف کنید.</p>
      <a href="login.php" class="btn btn-primary btn-block" style="justify-content:center">رفتن به صفحه ورود</a>
    <?php else: ?>
      <h1>ساخت اولین حساب مدیر</h1>
      <p class="lead">چون هنوز هیچ حساب مدیری در دیتابیس نیست، این فرم فقط همین یک بار قابل استفاده است.</p>

      <?php if ($error): ?>
        <div class="admin-alert admin-alert-error">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5m0 3h.01M12 2 2 20h20L12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span><?= h($error) ?></span>
        </div>
      <?php endif; ?>

      <form method="post" novalidate>
        <div class="field">
          <label for="username">نام کاربری</label>
          <input type="text" id="username" name="username" required minlength="3" autocomplete="username" value="<?= h($_POST['username'] ?? '') ?>">
        </div>
        <div class="field">
          <label for="password">رمز عبور</label>
          <input type="password" id="password" name="password" required minlength="8" autocomplete="new-password">
        </div>
        <div class="field">
          <label for="password2">تکرار رمز عبور</label>
          <input type="password" id="password2" name="password2" required minlength="8" autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="justify-content:center">ساخت حساب مدیر</button>
      </form>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
