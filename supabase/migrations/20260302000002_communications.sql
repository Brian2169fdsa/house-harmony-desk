-- ============================================================
-- SYSTEM 5: Communication & Notification Templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.communication_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type   TEXT NOT NULL CHECK (recipient_type IN ('resident','staff','investor','vendor','lead')),
  recipient_id     UUID,
  recipient_name   TEXT,
  channel          TEXT NOT NULL CHECK (channel IN ('in_app','email','sms')),
  template_id      UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  subject          TEXT,
  body             TEXT NOT NULL,
  variables_used   JSONB,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','sent','delivered','failed','read')),
  sent_by          UUID REFERENCES auth.users(id),
  sent_at          TIMESTAMPTZ,
  read_at          TIMESTAMPTZ,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_logs_recipient
  ON public.communication_logs(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_logs_status
  ON public.communication_logs(status, created_at DESC);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_comm_logs"
  ON public.communication_logs FOR ALL TO authenticated USING (true);


CREATE TABLE IF NOT EXISTS public.scheduled_communications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id          UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  recipient_type       TEXT,
  recipient_filter_json JSONB,
  channel              TEXT NOT NULL DEFAULT 'in_app',
  scheduled_for        TIMESTAMPTZ NOT NULL,
  recurrence           TEXT NOT NULL DEFAULT 'once' CHECK (recurrence IN ('once','daily','weekly','monthly')),
  status               TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','sent','cancelled')),
  sent_at              TIMESTAMPTZ,
  created_by           UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sched_comms_status_date
  ON public.scheduled_communications(status, scheduled_for);

ALTER TABLE public.scheduled_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_sched_comms"
  ON public.scheduled_communications FOR ALL TO authenticated USING (true);

-- Seed additional message templates for communications system
INSERT INTO public.message_templates (name, category, subject_template, body_template, variables, is_system) VALUES
  (
    'Late Fee Warning', 'payments',
    'Late Fee Notice — {{amount}} Due',
    E'Hi {{resident_name}},\n\nA late fee of {{late_fee}} has been applied to your account. Your total balance is now {{total_balance}}.\n\nPlease pay immediately to avoid further fees.\n\n{{facility_name}}',
    ARRAY['resident_name','late_fee','total_balance','amount','facility_name'], true
  ),
  (
    'House Meeting Reminder', 'general',
    'House Meeting — {{meeting_date}} at {{meeting_time}}',
    E'Hi {{resident_name}},\n\nReminder: House meeting is scheduled for {{meeting_date}} at {{meeting_time}} in {{location}}. Attendance is required.\n\n{{facility_name}}',
    ARRAY['resident_name','meeting_date','meeting_time','location','facility_name'], true
  ),
  (
    'Maintenance Update Resident', 'maintenance',
    'Your Maintenance Request: {{ticket_title}}',
    E'Hi {{resident_name}},\n\nYour maintenance request "{{ticket_title}}" has been updated.\n\nStatus: {{status}}\nEstimated completion: {{eta}}\n\nNotes: {{notes}}\n\nThank you for your patience, {{facility_name}}',
    ARRAY['resident_name','ticket_title','status','eta','notes','facility_name'], true
  ),
  (
    'Discharge Warning', 'compliance',
    'IMPORTANT: House Rules Violation Notice',
    E'Hi {{resident_name}},\n\nThis letter serves as an official warning regarding {{violation_type}}. This is violation #{{violation_count}} of your house agreement.\n\nFurther violations may result in discharge. Please meet with {{manager_name}} by {{meeting_deadline}}.\n\n{{facility_name}}',
    ARRAY['resident_name','violation_type','violation_count','manager_name','meeting_deadline','facility_name'], true
  ),
  (
    'Chore Reminder', 'general',
    'Chore Reminder: {{chore_name}} Due {{due_date}}',
    E'Hi {{resident_name}},\n\nReminder that your assigned chore "{{chore_name}}" is due by {{due_date}}.\n\nLocation: {{location}}\n\nPlease complete by the deadline.\n\n{{facility_name}}',
    ARRAY['resident_name','chore_name','due_date','location','facility_name'], true
  ),
  (
    'Emergency Broadcast', 'emergency',
    'URGENT: {{subject}}',
    E'ATTENTION ALL RESIDENTS:\n\n{{message}}\n\nImmediate action required. Contact {{contact_name}} at {{contact_phone}} with any questions.\n\n{{facility_name}} Management',
    ARRAY['subject','message','contact_name','contact_phone','facility_name'], true
  ),
  (
    'Investor Monthly Update', 'investor',
    'Monthly Portfolio Update — {{month_year}}',
    E'Dear {{investor_name}},\n\nHere is your monthly portfolio update for {{month_year}}:\n\nOccupancy Rate: {{occupancy_rate}}\nGross Revenue: {{gross_revenue}}\nNet Operating Income: {{noi}}\n\nPlease log in to your investor portal for detailed reports.\n\n{{facility_name}}',
    ARRAY['investor_name','month_year','occupancy_rate','gross_revenue','noi','facility_name'], true
  ),
  (
    'Vendor Work Order', 'maintenance',
    'Work Order #{{order_number}}: {{service_type}} at {{house_name}}',
    E'Dear {{vendor_name}},\n\nYou have been assigned a work order:\n\nOrder #: {{order_number}}\nService: {{service_type}}\nProperty: {{house_name}} — {{address}}\nPriority: {{priority}}\nRequested By: {{requested_date}}\n\nDescription: {{description}}\n\nContact: {{contact_name}} at {{contact_phone}}\n\nPlease confirm receipt of this work order.',
    ARRAY['vendor_name','order_number','service_type','house_name','address','priority','requested_date','description','contact_name','contact_phone'], true
  ),
  (
    'Tour Confirmation', 'intake',
    'Tour Confirmed — {{tour_date}} at {{tour_time}}',
    E'Hi {{lead_name}},\n\nYour tour has been confirmed!\n\nDate: {{tour_date}}\nTime: {{tour_time}}\nLocation: {{house_name}}, {{address}}\n\nPlease bring a valid photo ID. If you need to reschedule, call {{contact_phone}}.\n\nWe look forward to meeting you!\n\n{{facility_name}}',
    ARRAY['lead_name','tour_date','tour_time','house_name','address','contact_phone','facility_name'], true
  ),
  (
    'Staff Schedule Published', 'staff',
    'Staff Schedule Published: Week of {{week_start}}',
    E'Hi {{staff_name}},\n\nThe staff schedule for the week of {{week_start}} has been published.\n\nYour shifts:\n{{shift_details}}\n\nPlease confirm your availability or contact {{manager_name}} with any conflicts.\n\n{{facility_name}}',
    ARRAY['staff_name','week_start','shift_details','manager_name','facility_name'], true
  )
ON CONFLICT DO NOTHING;
