-- Ongelezen indicator voor WhatsApp-inbox
ALTER TABLE berichten
  ADD COLUMN IF NOT EXISTS gelezen BOOLEAN DEFAULT FALSE;

UPDATE berichten SET gelezen = TRUE WHERE richting = 'outbound';
