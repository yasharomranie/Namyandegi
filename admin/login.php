<?php
require __DIR__ . '/../api/_db.php';
require __DIR__ . '/../api/_auth.php';

if (current_admin()) {
    header('Location: index.php');
    exit;
}

$error = null;
$justCreated = isset($_GET['created']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = (string) ($_POST['password'] ?? '');

    $stmt = db()->prepare('SELECT * FROM admins WHERE username = ?');
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password_hash'])) {
        login_admin($admin);
        header('Location: index.php');
        exit;
    }
    // Deliberately vague — don't reveal whether the username exists.
    $error = 'نام کاربری یا رمز عبور اشتباه است.';
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ورود به پنل مدیریت</title>
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
    <h1>ورود</h1>
    <p class="lead">برای مدیریت درخواست‌های نمایندگی و فهرست نمایندگان وارد شوید.</p>

    <?php if ($justCreated): ?>
      <div class="admin-alert admin-alert-success">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>حساب مدیر با موفقیت ساخته شد. حالا وارد شوید.</span>
      </div>
    <?php endif; ?>
    <?php if ($error): ?>
      <div class="admin-alert admin-alert-error">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5m0 3h.01M12 2 2 20h20L12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span><?= h($error) ?></span>
      </div>
    <?php endif; ?>

    <form method="post" novalidate>
      <div class="field">
        <label for="username">نام کاربری</label>
        <input type="text" id="username" name="username" required autocomplete="username" autofocus value="<?= h($_POST['username'] ?? '') ?>">
      </div>
      <div class="field">
        <label for="password">رمز عبور</label>
        <input type="password" id="password" name="password" required autocomplete="current-password">
      </div>
      <button type="submit" class="btn btn-primary btn-block" style="justify-content:center">ورود</button>
    </form>
  </div>
</div>
</body>
</html>
