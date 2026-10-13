CREATE TABLE complaint_photos (
  key VARCHAR(255) PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);