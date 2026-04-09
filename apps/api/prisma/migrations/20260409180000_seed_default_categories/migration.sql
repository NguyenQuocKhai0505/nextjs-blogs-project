-- Default categories for post picker (idempotent)
INSERT INTO "categories" ("name", "slug", "sort_order")
VALUES
  ('Technology', 'technology', 1),
  ('Design', 'design', 2),
  ('Development', 'development', 3),
  ('Lifestyle', 'lifestyle', 4),
  ('Music', 'music', 5),
  ('Travel', 'travel', 6),
  ('Food', 'food', 7)
ON CONFLICT ("slug") DO NOTHING;
