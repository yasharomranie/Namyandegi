<?php
require __DIR__ . '/../api/_db.php';
require __DIR__ . '/../api/_auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: representatives.php');
    exit;
}
csrf_check();

$id = (int) ($_POST['id'] ?? 0);
if ($id > 0) {
    $stmt = db()->prepare('DELETE FROM representatives WHERE id = ?');
    $stmt->execute([$id]);
}
header('Location: representatives.php?deleted=1');
