-- Saathi referral code captured during recharge / checkout on this subscription
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "saathicode" TEXT;
