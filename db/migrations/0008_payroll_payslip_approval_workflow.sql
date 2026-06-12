ALTER TABLE "payroll"."payslips" ADD COLUMN "payment_reference" text;--> statement-breakpoint
ALTER TABLE "payroll"."payslips" ADD COLUMN "approved_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_runs" ADD CONSTRAINT "payroll_runs_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll"."payslips" ADD CONSTRAINT "payslips_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll"."payroll_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll"."payslips" ADD CONSTRAINT "payslips_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "people"."staff"("id") ON DELETE no action ON UPDATE no action;
