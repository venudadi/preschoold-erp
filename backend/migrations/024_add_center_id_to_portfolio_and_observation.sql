-- 024_add_center_id_to_portfolio_and_observation.sql
-- Add center_id to digital_portfolios and observation_logs for robust student transfer support
-- NOTE: FK constraints may be skipped if centers.id has incompatible type from old deployments

-- Add column and FK constraint to digital_portfolios
ALTER TABLE digital_portfolios
  ADD COLUMN center_id VARCHAR(36) AFTER child_id;

ALTER TABLE digital_portfolios
  ADD CONSTRAINT fk_digital_portfolios_center FOREIGN KEY (center_id) REFERENCES centers(id);

CREATE INDEX idx_digital_portfolios_center_id ON digital_portfolios(center_id);

-- Add column and FK constraint to observation_logs
ALTER TABLE observation_logs
  ADD COLUMN center_id VARCHAR(36) AFTER child_id;

ALTER TABLE observation_logs
  ADD CONSTRAINT fk_observation_logs_center FOREIGN KEY (center_id) REFERENCES centers(id);

CREATE INDEX idx_observation_logs_center_id ON observation_logs(center_id);
