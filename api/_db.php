<?php
/**
 * _db.php — shared PDO connection helper, used by both api/*.php and
 * admin/*.php. Leading underscore marks it (and _config.php/_auth.php) as
 * an include, not a directly-requestable page.
 */

function app_config(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $path = __DIR__ . '/_config.php';
    if (!is_file($path)) {
        http_response_code(500);
        die(
            'پیکربندی یافت نشد: api/_config.php را از روی ' .
            'api/_config.example.php بسازید و اطلاعات دیتابیس واقعی را در آن ' .
            'وارد کنید.'
        );
    }
    $cfg = require $path;
    return $cfg;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;

    $d = app_config()['db'];
    if ($d['driver'] === 'sqlite') {
        // Only used for local development/testing (see scripts/dev-server.sh);
        // production config.php should always set driver => 'mysql'.
        $dsn = 'sqlite:' . $d['name'];
    } else {
        $dsn = "{$d['driver']}:host={$d['host']};dbname={$d['name']};charset={$d['charset']}";
    }

    try {
        $pdo = new PDO($dsn, $d['user'] ?? null, $d['pass'] ?? null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        die('اتصال به دیتابیس برقرار نشد. اطلاعات api/_config.php را بررسی کنید.');
    }
    return $pdo;
}

/** Persian-digit display helper, shared by the API and the admin panel so
 *  numbers read the same way the rest of the (already Persian-numeral)
 *  frontend does. */
function to_persian_digits(string $s): string {
    static $map = ['0' => '۰', '1' => '۱', '2' => '۲', '3' => '۳', '4' => '۴', '5' => '۵', '6' => '۶', '7' => '۷', '8' => '۸', '9' => '۹'];
    return strtr($s, $map);
}
