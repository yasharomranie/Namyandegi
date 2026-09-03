<?php
/**
 * _auth.php — session-based admin auth + CSRF helpers, shared by every
 * page under admin/. Requires _db.php to already be loaded (for db()).
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
    ]);
}

function current_admin(): ?array {
    return $_SESSION['admin'] ?? null;
}

/** Call at the top of every admin/*.php page except login.php/setup.php. */
function require_login(): void {
    if (!current_admin()) {
        header('Location: login.php');
        exit;
    }
}

function login_admin(array $admin): void {
    session_regenerate_id(true);
    $_SESSION['admin'] = ['id' => $admin['id'], 'username' => $admin['username']];
}

function logout_admin(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function csrf_token(): string {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

/** Call at the top of every state-changing POST handler in admin/. */
function csrf_check(): void {
    $token = $_POST['csrf'] ?? '';
    if (!hash_equals($_SESSION['csrf'] ?? '', $token)) {
        http_response_code(419);
        die('نشست شما منقضی شده — صفحه را رفرش کنید و دوباره تلاش کنید.');
    }
}

function h(?string $s): string {
    return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8');
}
