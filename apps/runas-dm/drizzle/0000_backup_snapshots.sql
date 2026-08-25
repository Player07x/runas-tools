CREATE TABLE `backup_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `payload` text NOT NULL,
  `updated_at` integer NOT NULL
);
