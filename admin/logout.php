<?php
require __DIR__ . '/../api/_db.php';
require __DIR__ . '/../api/_auth.php';
logout_admin();
header('Location: login.php');
