BEGIN;

TRUNCATE
users;

INSERT INTO users (id, email, name, password, admin)
VALUES
(1, 'admin@admin.com', 'admin', '$2a$12$w979U3RD5MEnDEsGxtCOc.aEDQU3QcGCtAUy8SbC.esh2EGwbRYT6', true),
(2, 'test@test.com', 'test', '$2a$12$whPTDc.7uyqiSm4VqCSYtOeigOZHBVXvssZY2zHFy9jdXMsuwq7/6', false);

-- Admin pass: Adminpass1!
-- Test pass: Testuser1!


COMMIT;