<?php
/**
 * _config.example.php
 * -----------------------------------------------------------------------
 * Copy this file to `_config.php` (same folder) and fill in your real
 * database credentials — `_config.php` itself is gitignored so real
 * secrets never get committed.
 *
 *   cp api/_config.example.php api/_config.php
 *
 * On a typical cPanel host: create a MySQL database and a database user
 * from cPanel → "MySQL Databases" first (cPanel usually prefixes both
 * with your account name, e.g. `myuser_namyandegi`), grant that user "ALL
 * PRIVILEGES" on the database, then paste those exact values below.
 * -----------------------------------------------------------------------
 */
return [
    'db' => [
        'driver'  => 'mysql',
        'host'    => 'localhost',
        'name'    => 'namyandegi',          // TODO: your real database name
        'user'    => 'namyandegi_user',     // TODO: your real database user
        'pass'    => 'REPLACE_ME',          // TODO: that user's password
        'charset' => 'utf8mb4',
    ],

    // New-application notifications are sent here with PHP's mail() —
    // works out of the box on most shared hosting; if your host needs SMTP
    // instead, swap the @mail(...) call in api/applications.php for your
    // provider's SMTP library.
    'admin_notify_email' => 'you@example.com',

    'site_name' => 'برند شما',

    // Where uploaded ID/license documents are stored — outside any
    // web-listable path is ideal; this default (uploads/applications next
    // to this repo) is protected by uploads/.htaccess against directory
    // listing and script execution, which is enough for most shared hosts.
    'upload_dir' => __DIR__ . '/../uploads/applications',
    'upload_max_bytes' => 5 * 1024 * 1024, // 5MB
];
