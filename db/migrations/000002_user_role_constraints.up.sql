UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';
UPDATE users SET disabled = false WHERE disabled IS NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
ALTER TABLE users ALTER COLUMN disabled SET DEFAULT false;
ALTER TABLE users ALTER COLUMN disabled SET NOT NULL;
