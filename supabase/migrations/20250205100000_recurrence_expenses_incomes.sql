-- Recurrence fields for expenses and incomes (optional: weekly/monthly repeat, next occurrence date)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT CHECK (recurrence_frequency IS NULL OR recurrence_frequency IN ('none', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER NOT NULL DEFAULT 1 CHECK (recurrence_interval >= 1),
  ADD COLUMN IF NOT EXISTS next_occurrence DATE;

ALTER TABLE incomes
  ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT CHECK (recurrence_frequency IS NULL OR recurrence_frequency IN ('none', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER NOT NULL DEFAULT 1 CHECK (recurrence_interval >= 1),
  ADD COLUMN IF NOT EXISTS next_occurrence DATE;

COMMENT ON COLUMN expenses.recurrence_frequency IS 'none = one-off, weekly/monthly = recurring';
COMMENT ON COLUMN expenses.next_occurrence IS 'Next date to create a recurring expense (user or cron)';
COMMENT ON COLUMN incomes.recurrence_frequency IS 'none = one-off, weekly/monthly = recurring';
COMMENT ON COLUMN incomes.next_occurrence IS 'Next date to create a recurring income (user or cron)';
