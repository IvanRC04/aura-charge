CREATE TYPE "public"."charger_status" AS ENUM('idle', 'charging', 'error', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."charger_type" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('visit', 'session_started', 'session_completed', 'session_aborted', 'charger_status_changed', 'anomaly');--> statement-breakpoint
CREATE TYPE "public"."session_source" AS ENUM('qr_feria', 'app', 'rfid');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'completed', 'aborted');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chargers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"type" charger_type NOT NULL,
	"max_power_kw" integer NOT NULL,
	"status" charger_status DEFAULT 'idle' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chargers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"plate" text,
	"vehicle_model" text NOT NULL,
	"battery_kwh" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "event_kind" NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"charger_id" uuid,
	"session_id" uuid,
	"label" text NOT NULL,
	"payload" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"charger_id" uuid NOT NULL,
	"customer_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"start_soc_pct" integer NOT NULL,
	"end_soc_pct" integer,
	"kwh_delivered" numeric(10, 3) DEFAULT '0' NOT NULL,
	"peak_kw" numeric(6, 2) DEFAULT '0' NOT NULL,
	"cost_eur" numeric(8, 2) DEFAULT '0' NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"source" "session_source" DEFAULT 'qr_feria' NOT NULL,
	"vehicle_model_snapshot" text NOT NULL,
	"battery_kwh_snapshot" integer NOT NULL,
	"target_soc_pct" integer DEFAULT 80 NOT NULL,
	"time_accel" integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telemetry" (
	"session_id" uuid NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"power_kw" numeric(6, 2) NOT NULL,
	"voltage_v" numeric(6, 2) NOT NULL,
	"current_a" numeric(6, 2) NOT NULL,
	"soc_pct" numeric(5, 2) NOT NULL,
	"temp_battery_c" numeric(5, 2) NOT NULL,
	CONSTRAINT "telemetry_session_id_ts_pk" PRIMARY KEY("session_id","ts")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_country" text,
	"referrer" text,
	"reached_chat" boolean DEFAULT false NOT NULL,
	"reached_charge_view" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_charger_id_chargers_id_fk" FOREIGN KEY ("charger_id") REFERENCES "public"."chargers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_charger_id_chargers_id_fk" FOREIGN KEY ("charger_id") REFERENCES "public"."chargers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visits" ADD CONSTRAINT "visits_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_ts_idx" ON "events" USING btree ("ts");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_charger_idx" ON "sessions" USING btree ("charger_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_started_idx" ON "sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visits_ts_idx" ON "visits" USING btree ("ts");