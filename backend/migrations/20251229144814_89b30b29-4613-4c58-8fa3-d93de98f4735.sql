-- Add 'general_user' and 'admin' to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'general_user';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';