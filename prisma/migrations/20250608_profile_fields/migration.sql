-- Ensure personal profile columns exist on Employee (safe to re-run)
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "personalEmail" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "dateOfBirth" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "bloodGroup" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "employeeCode" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "joiningDate" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "designation" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "employmentType" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "reportingManager" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "reportingHR" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "workLocation" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "branch" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "rosterShift" TEXT;
