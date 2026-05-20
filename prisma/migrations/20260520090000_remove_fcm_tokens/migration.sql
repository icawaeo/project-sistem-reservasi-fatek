-- Drop browser push token storage because this branch runs as a regular web app.
DROP TABLE IF EXISTS "FcmToken";
