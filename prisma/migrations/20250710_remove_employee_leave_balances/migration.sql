-- Remove legacy per-employee leave balance columns.
-- Leave balances are now derived from LeaveCategory + approved LeaveRequest rows.
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "annualBalance";
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "sickBalance";
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "casualBalance";
