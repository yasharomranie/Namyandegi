-- =========================================================================
-- نمایندگی‌های ما — دیتابیس بک‌اند
-- -------------------------------------------------------------------------
-- روی هاست خودتان (مثلاً از phpMyAdmin در cPanel) این فایل را روی دیتابیسی
-- که ساخته‌اید ایمپورت کنید. سه جدول دارد:
--   admins           کاربران پنل مدیریت (از طریق admin/setup.php ساخته می‌شود،
--                     نیازی به دستی پر کردن این جدول نیست)
--   representatives  نمایندگان تأییدشده — همینی که در سایت عمومی نشان داده می‌شود
--   applications      درخواست‌های ثبت‌شده از فرم «ثبت‌نام نمایندگی»
-- =========================================================================

CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS representatives (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- باید دقیقاً با یکی از مقادیر slug در assets/js/provinces-data.js یکی باشد
  province_slug     VARCHAR(60)  NOT NULL,
  full_name         VARCHAR(120) NOT NULL,
  job_category      VARCHAR(80)  NOT NULL,
  phone             VARCHAR(20)  NOT NULL,   -- فقط رقم، مثل 09121234567
  city              VARCHAR(80)  NOT NULL,
  address           VARCHAR(255) NOT NULL,
  active_since_year SMALLINT UNSIGNED NOT NULL, -- سال شمسی، مثل 1403
  status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_province (province_slug),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name     VARCHAR(80)  NOT NULL,
  last_name      VARCHAR(80)  NOT NULL,
  job_category   VARCHAR(80)  NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  province_slug  VARCHAR(60)  NOT NULL,
  city           VARCHAR(80)  NOT NULL,
  address        VARCHAR(255) NOT NULL,
  experience     VARCHAR(60)  NULL,
  capital_range  VARCHAR(60)  NULL,
  has_property   VARCHAR(30)  NULL,
  motivation     TEXT NULL,
  document_path  VARCHAR(255) NULL, -- مسیر نسبی داخل uploads/applications/
  status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_note     TEXT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_status (status),
  KEY idx_province (province_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
