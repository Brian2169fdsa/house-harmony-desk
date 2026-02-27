import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Download,
  Rocket,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { policyTemplates, generateDocument, PolicyTemplateParams } from "@/lib/policyTemplates";

const TOTAL_STEPS = 10;

const STEP_TITLES = [
  "Business Model Definition",
  "Business Formation",
  "Property Selection",
  "Insurance",
  "Policies & Procedures",
  "Staffing",
  "AzRHA Membership",
  "ADHS Licensing",
  "Referral Network",
  "Launch Readiness",
];

const MUNICIPALITY_NOTES: Record<string, string> = {
  phoenix:
    "Phoenix requires compliance with Zoning Ordinance §608. 6 or fewer residents: no special permit. 7+ residents: Conditional Use Permit (CUP) required. Business license: $50/yr.",
  scottsdale:
    "All sober living homes subject to Scottsdale City Code. Homes with 7+ unrelated adults require a Group Home permit. Residential spacing requirements apply.",
  mesa:
    "Mesa City Code applies. Homes of 6 or fewer typically treated as single-family use. Contact Mesa Development Services for a pre-application meeting before signing a lease.",
  prescott:
    "Prescott is generally favorable to recovery housing. City of Prescott regulations for incorporated areas; Yavapai County for unincorporated areas.",
  tucson:
    "Tucson and Pima County are supportive of sober living. Check Tucson Unified Development Code for group home definitions. Active local recovery housing coalition.",
};

type StepData = Record<string, any>;

function MunicipalityCallout({ municipality }: { municipality: string }) {
  const note = MUNICIPALITY_NOTES[municipality];
  if (!note) return null;
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <p className="text-sm text-blue-800 dark:text-blue-300">
        <strong>{municipality.charAt(0).toUpperCase() + municipality.slice(1)}:</strong> {note}
      </p>
    </div>
  );
}

function ChecklistItem({
  id,
  label,
  checked,
  onChange,
  description,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v as boolean)}
        className="mt-0.5"
      />
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Step Components ────────────────────────────────────────────────────────

function Step1({ data, onChange, wizard }: { data: StepData; onChange: (d: StepData) => void; wizard: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Organization Name *</Label>
          <Input
            value={data.organization_name ?? ""}
            onChange={(e) => onChange({ ...data, organization_name: e.target.value })}
            placeholder="Phoenix Recovery House LLC"
          />
        </div>
        <div className="space-y-2">
          <Label>NARR Certification Level *</Label>
          <Select
            value={data.narr_level ?? "II"}
            onValueChange={(v) => onChange({ ...data, narr_level: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I">Level I — Peer-run ($600–$900/mo)</SelectItem>
              <SelectItem value="II">Level II — Monitored ($800–$1,200/mo)</SelectItem>
              <SelectItem value="III">Level III — Supervised ($1,000–$1,600/mo)</SelectItem>
              <SelectItem value="IV">Level IV — Integrated services ($1,400–$2,500/mo)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Most Arizona homes operate at Level II — the sweet spot for AzRHA certification and referral relationships.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Municipality *</Label>
          <Select
            value={data.municipality ?? "phoenix"}
            onValueChange={(v) => onChange({ ...data, municipality: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phoenix">Phoenix</SelectItem>
              <SelectItem value="scottsdale">Scottsdale</SelectItem>
              <SelectItem value="mesa">Mesa</SelectItem>
              <SelectItem value="prescott">Prescott</SelectItem>
              <SelectItem value="tucson">Tucson</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Planned Bed Count</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={data.bed_count ?? ""}
            onChange={(e) => onChange({ ...data, bed_count: e.target.value })}
            placeholder="8"
          />
        </div>
        <div className="space-y-2">
          <Label>Target Population</Label>
          <Select
            value={data.target_population ?? "men"}
            onValueChange={(v) => onChange({ ...data, target_population: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="mixed">Mixed (co-ed)</SelectItem>
              <SelectItem value="lgbtq">LGBTQ+ affirming</SelectItem>
              <SelectItem value="veterans">Veterans</SelectItem>
              <SelectItem value="young_adults">Young Adults (18–25)</SelectItem>
              <SelectItem value="mothers">Mothers with children</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Funding Model</Label>
          <Select
            value={data.funding_model ?? "private_pay"}
            onValueChange={(v) => onChange({ ...data, funding_model: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private_pay">Private pay</SelectItem>
              <SelectItem value="scholarship">Scholarship / grant funded</SelectItem>
              <SelectItem value="mixed">Mixed (private + scholarship)</SelectItem>
              <SelectItem value="ahcccs">AHCCCS / insurance billing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div>
          <Label className="text-base">MAT-Friendly</Label>
          <p className="text-sm text-muted-foreground">
            Accept residents on medication-assisted treatment (Suboxone, Vivitrol, methadone)
          </p>
        </div>
        <Switch
          checked={data.mat_friendly ?? false}
          onCheckedChange={(v) => onChange({ ...data, mat_friendly: v })}
        />
      </div>

      <MunicipalityCallout municipality={data.municipality ?? "phoenix"} />
    </div>
  );
}

function Step2({ data, onChange }: { data: StepData; onChange: (d: StepData) => void }) {
  const items = [
    { key: "articles_filed", label: "Articles of Organization filed with Arizona Corporation Commission", description: "azcc.gov — $50 filing fee, instant online" },
    { key: "ein_obtained", label: "EIN obtained from IRS", description: "irs.gov — free, immediate online issuance" },
    { key: "bank_account", label: "Business bank account opened", description: "Separate from personal accounts" },
    { key: "operating_agreement", label: "Operating agreement drafted", description: "Required for multi-member LLC; recommended for single-member" },
    { key: "registered_agent", label: "Registered agent appointed", description: "Required for AZ LLC; can use a registered agent service ($50–$150/yr)" },
    { key: "business_address", label: "Business address established", description: "Physical address required; can use registered agent" },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-1">
        <p className="font-medium">Arizona LLC is the recommended structure for most operators.</p>
        <p className="text-muted-foreground">
          File at <strong>azcc.gov</strong> ($50). No annual report fee in Arizona.
          If seeking federal grants or tax-deductible donations, a nonprofit 501(c)(3) may be needed (more complex).
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <ChecklistItem
            key={item.key}
            id={`step2-${item.key}`}
            label={item.label}
            description={item.description}
            checked={data[item.key] ?? false}
            onChange={(v) => onChange({ ...data, [item.key]: v })}
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={data.notes ?? ""}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Attorney name, registered agent service, other notes..."
          rows={3}
        />
      </div>
    </div>
  );
}

function Step3({ data, onChange, municipality }: { data: StepData; onChange: (d: StepData) => void; municipality: string }) {
  return (
    <div className="space-y-6">
      <MunicipalityCallout municipality={municipality} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Property Address</Label>
          <Input
            value={data.address ?? ""}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            placeholder="123 Main St, Phoenix, AZ 85001"
          />
        </div>
        <div className="space-y-2">
          <Label>Ownership Type</Label>
          <Select
            value={data.ownership_type ?? "leased"}
            onValueChange={(v) => onChange({ ...data, ownership_type: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="owned">Owned</SelectItem>
              <SelectItem value="leased">Leased</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Bedrooms</Label>
          <Input
            type="number"
            value={data.bedrooms ?? ""}
            onChange={(e) => onChange({ ...data, bedrooms: e.target.value })}
            placeholder="4"
          />
        </div>
        <div className="space-y-2">
          <Label>Bathrooms</Label>
          <Input
            type="number"
            value={data.bathrooms ?? ""}
            onChange={(e) => onChange({ ...data, bathrooms: e.target.value })}
            placeholder="2"
          />
        </div>
        {data.ownership_type === "leased" && (
          <>
            <div className="space-y-2">
              <Label>Landlord Name</Label>
              <Input
                value={data.landlord_name ?? ""}
                onChange={(e) => onChange({ ...data, landlord_name: e.target.value })}
                placeholder="Landlord or property management company"
              />
            </div>
            <div className="space-y-2">
              <Label>Landlord Phone</Label>
              <Input
                value={data.landlord_phone ?? ""}
                onChange={(e) => onChange({ ...data, landlord_phone: e.target.value })}
                placeholder="(602) 555-0100"
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-3">
        {[
          { key: "zoning_verified", label: "Zoning verified with city/county planning department" },
          { key: "cup_required", label: "Conditional Use Permit (CUP) — determined if required" },
          { key: "cup_obtained", label: "CUP obtained (if required)" },
          { key: "lease_signed", label: "Lease/purchase agreement signed" },
          { key: "smoke_detectors", label: "Smoke and CO detectors installed and tested" },
          { key: "fire_extinguisher", label: "Fire extinguisher(s) installed" },
          { key: "egress_verified", label: "Two means of egress from bedrooms confirmed" },
        ].map((item) => (
          <ChecklistItem
            key={item.key}
            id={`step3-${item.key}`}
            label={item.label}
            checked={data[item.key] ?? false}
            onChange={(v) => onChange({ ...data, [item.key]: v })}
          />
        ))}
      </div>
    </div>
  );
}

function Step4({ data, onChange }: { data: StepData; onChange: (d: StepData) => void }) {
  const policies = [
    { key: "general_liability", label: "General Liability ($1M minimum)", description: "Most critical policy — covers premises liability" },
    { key: "professional_liability", label: "Professional Liability / E&O ($1M)", description: "Covers errors in program services" },
    { key: "property_contents", label: "Property / Contents Insurance", description: "Replacement value of building contents" },
    { key: "workers_comp", label: "Workers' Compensation", description: "Required by AZ law if you have any employees" },
    { key: "sexual_misconduct", label: "Sexual Misconduct Rider", description: "Often required by lenders and certifiers" },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/50 text-sm">
        <p className="font-medium">Recommended specialty carriers for recovery housing:</p>
        <ul className="text-muted-foreground mt-2 list-disc list-inside space-y-1">
          <li>Markel Insurance (recovery housing specialty)</li>
          <li>Philadelphia Insurance Companies</li>
          <li>Great American Insurance</li>
          <li>Burns & Wilcox (specialty broker)</li>
        </ul>
      </div>

      <div className="space-y-4">
        {policies.map((policy) => (
          <div key={policy.key} className="space-y-3 p-4 rounded-lg border">
            <ChecklistItem
              id={`step4-${policy.key}`}
              label={policy.label}
              description={policy.description}
              checked={data[`${policy.key}_active`] ?? false}
              onChange={(v) => onChange({ ...data, [`${policy.key}_active`]: v })}
            />
            {data[`${policy.key}_active`] && (
              <div className="grid gap-3 md:grid-cols-2 ml-7">
                <div className="space-y-1">
                  <Label className="text-xs">Carrier</Label>
                  <Input
                    value={data[`${policy.key}_carrier`] ?? ""}
                    onChange={(e) => onChange({ ...data, [`${policy.key}_carrier`]: e.target.value })}
                    placeholder="Insurance company"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Policy Number</Label>
                  <Input
                    value={data[`${policy.key}_policy`] ?? ""}
                    onChange={(e) => onChange({ ...data, [`${policy.key}_policy`]: e.target.value })}
                    placeholder="Policy number"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Step5({
  data,
  onChange,
  wizardId,
  templateParams,
}: {
  data: StepData;
  onChange: (d: StepData) => void;
  wizardId: string;
  templateParams: PolicyTemplateParams;
}) {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: existingDocs = [] } = useQuery({
    queryKey: ["startup_documents", wizardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_documents")
        .select("*")
        .eq("wizard_id", wizardId);
      if (error) throw error;
      return data;
    },
  });

  const generateAllDocuments = async () => {
    setGenerating(true);
    try {
      // Delete existing docs
      await supabase.from("startup_documents").delete().eq("wizard_id", wizardId);

      const inserts = policyTemplates.map((template) => {
        const result = template.generate(templateParams);
        return {
          wizard_id: wizardId,
          document_type: template.key,
          title: template.title,
          content: result,
        };
      });

      const { error } = await supabase.from("startup_documents").insert(inserts);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["startup_documents", wizardId] });
      toast({ title: "12 policy documents generated" });
    } catch {
      toast({ title: "Failed to generate documents", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const downloadDocument = (doc: any) => {
    const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.document_type}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/50 text-sm">
        <p>
          Arizona sober living operators must maintain <strong>12 policy documents</strong>.
          Click "Generate All Documents" to create Arizona-specific templates pre-filled with
          your organization's information. Download each document for legal review.
        </p>
      </div>

      <Button
        onClick={generateAllDocuments}
        disabled={generating}
        className="w-full md:w-auto"
      >
        {generating ? "Generating..." : "Generate All 12 Documents"}
      </Button>

      <div className="space-y-3">
        {policyTemplates.map((template, i) => {
          const existingDoc = (existingDocs as any[]).find((d) => d.document_type === template.key);
          const isComplete = data[`doc_${template.key}`] ?? false;

          return (
            <div key={template.key} className="flex items-center gap-3 p-3 rounded-lg border">
              <ChecklistItem
                id={`step5-${template.key}`}
                label={`${i + 1}. ${template.title}`}
                checked={isComplete}
                onChange={(v) => onChange({ ...data, [`doc_${template.key}`]: v })}
              />
              <div className="ml-auto flex items-center gap-2">
                {existingDoc && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(existingDoc)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step6({ data, onChange }: { data: StepData; onChange: (d: StepData) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>House Manager Name</Label>
          <Input
            value={data.manager_name ?? ""}
            onChange={(e) => onChange({ ...data, manager_name: e.target.value })}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-2">
          <Label>House Manager Phone</Label>
          <Input
            value={data.manager_phone ?? ""}
            onChange={(e) => onChange({ ...data, manager_phone: e.target.value })}
            placeholder="(602) 555-0100"
          />
        </div>
        <div className="space-y-2">
          <Label>Years of Sobriety</Label>
          <Input
            type="number"
            value={data.manager_sobriety_years ?? ""}
            onChange={(e) => onChange({ ...data, manager_sobriety_years: e.target.value })}
            placeholder="2"
          />
        </div>
      </div>

      <div className="space-y-3">
        {[
          { key: "background_check", label: "Background check completed", description: "Level 1 Fingerprint Clearance Card — apply at azdps.gov ($67, 2–4 weeks)" },
          { key: "cpr_certified", label: "CPR / First Aid certified", description: "AHA or Red Cross — required before first resident move-in" },
          { key: "mandatory_reporter", label: "Mandatory Reporter training completed", description: "Free online at mandatedreporter.arizona.gov" },
          { key: "fair_housing_training", label: "Fair Housing training completed", description: "Free HUD online course" },
          { key: "narcan_trained", label: "Naloxone (Narcan) training and prescription obtained", description: "Narcan available in-house and staff trained to administer" },
        ].map((item) => (
          <ChecklistItem
            key={item.key}
            id={`step6-${item.key}`}
            label={item.label}
            description={item.description}
            checked={data[item.key] ?? false}
            onChange={(v) => onChange({ ...data, [item.key]: v })}
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label>Additional Staff Notes</Label>
        <Textarea
          value={data.staff_notes ?? ""}
          onChange={(e) => onChange({ ...data, staff_notes: e.target.value })}
          placeholder="Additional staff, volunteers, on-call arrangements..."
          rows={3}
        />
      </div>
    </div>
  );
}

function Step7({ data, onChange }: { data: StepData; onChange: (d: StepData) => void }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/50 text-sm">
        <p>
          <strong>AzRHA (Arizona Recovery Housing Association)</strong> certification is voluntary
          but strongly recommended. It opens referral relationships with treatment centers,
          courts, and government agencies. Apply at <strong>azrha.org</strong>.
        </p>
        <p className="mt-2 text-muted-foreground">
          Timeline: 60–90 days from application to certification. Membership fee: $100–$250/year.
        </p>
      </div>

      <div className="space-y-3">
        {[
          { key: "membership_applied", label: "AzRHA membership application submitted", description: "azrha.org" },
          { key: "membership_fee_paid", label: "Membership fee paid ($100–$250/year)" },
          { key: "self_assessment", label: "NARR self-assessment completed" },
          { key: "site_visit_scheduled", label: "Site visit/inspection scheduled with AzRHA reviewer" },
          { key: "site_visit_completed", label: "Site visit completed" },
          { key: "certification_approved", label: "Certification approved" },
          { key: "directory_listed", label: "Listed on AzRHA directory" },
        ].map((item) => (
          <ChecklistItem
            key={item.key}
            id={`step7-${item.key}`}
            label={item.label}
            description={(item as any).description}
            checked={data[item.key] ?? false}
            onChange={(v) => onChange({ ...data, [item.key]: v })}
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label>AzRHA Notes</Label>
        <Textarea
          value={data.azrha_notes ?? ""}
          onChange={(e) => onChange({ ...data, azrha_notes: e.target.value })}
          placeholder="Application status, contact name at AzRHA, scheduled dates..."
          rows={3}
        />
      </div>
    </div>
  );
}

function Step8({ data, onChange, narrLevel }: { data: StepData; onChange: (d: StepData) => void; narrLevel: string }) {
  const licenseRequired = data.provides_clinical_services || data.bills_ahcccs || narrLevel === "III" || narrLevel === "IV";

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/50 text-sm">
        <p>
          Most NARR Level I–II homes <strong>do not require</strong> ADHS licensure unless
          providing clinical services or billing AHCCCS/insurance. NARR Level III–IV typically
          require a Behavioral Health Services (BHS) license.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <Label>Providing clinical services on-site?</Label>
            <p className="text-xs text-muted-foreground">Case management, counseling, therapy</p>
          </div>
          <Switch
            checked={data.provides_clinical_services ?? false}
            onCheckedChange={(v) => onChange({ ...data, provides_clinical_services: v })}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <Label>Billing AHCCCS or insurance for services?</Label>
            <p className="text-xs text-muted-foreground">If YES, license is required</p>
          </div>
          <Switch
            checked={data.bills_ahcccs ?? false}
            onCheckedChange={(v) => onChange({ ...data, bills_ahcccs: v })}
          />
        </div>
      </div>

      {licenseRequired ? (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              ADHS BHS License Required
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Apply at azdhs.gov/licensing. Cost: $200–$500. Timeline: 90–180 days.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { key: "application_submitted", label: "BHS license application submitted to ADHS" },
              { key: "fire_inspection", label: "Fire safety inspection scheduled / completed" },
              { key: "site_inspection", label: "ADHS site inspection scheduled / completed" },
              { key: "license_issued", label: "License issued" },
            ].map((item) => (
              <ChecklistItem
                key={item.key}
                id={`step8-${item.key}`}
                label={item.label}
                checked={data[item.key] ?? false}
                onChange={(v) => onChange({ ...data, [item.key]: v })}
              />
            ))}
            <div className="space-y-2">
              <Label>License Application Number</Label>
              <Input
                value={data.application_number ?? ""}
                onChange={(e) => onChange({ ...data, application_number: e.target.value })}
                placeholder="ADHS application number"
              />
            </div>
            <div className="space-y-2">
              <Label>License Number (when issued)</Label>
              <Input
                value={data.license_number ?? ""}
                onChange={(e) => onChange({ ...data, license_number: e.target.value })}
                placeholder="ADHS license number"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-300 font-medium">
            ADHS License Not Required
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            Keep documentation confirming your operation is "housing only" with no clinical services.
            Avoid using terms like "treatment," "therapy," or "clinical" in marketing.
          </p>
          <div className="mt-3">
            <ChecklistItem
              id="step8-housing_only_documented"
              label="Housing-only status documented in policies"
              checked={data.housing_only_documented ?? false}
              onChange={(v) => onChange({ ...data, housing_only_documented: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Step9({ data, onChange }: { data: StepData; onChange: (d: StepData) => void }) {
  const addPartner = () => {
    const partners = data.partners ?? [];
    onChange({
      ...data,
      partners: [...partners, { name: "", type: "", contact: "", notes: "" }],
    });
  };

  const updatePartner = (i: number, field: string, value: string) => {
    const partners = [...(data.partners ?? [])];
    partners[i] = { ...partners[i], [field]: value };
    onChange({ ...data, partners });
  };

  const removePartner = (i: number) => {
    const partners = [...(data.partners ?? [])];
    partners.splice(i, 1);
    onChange({ ...data, partners });
  };

  const partners: any[] = data.partners ?? [];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/50 text-sm">
        <p className="font-medium">Target referral categories:</p>
        <ul className="text-muted-foreground mt-1 list-disc list-inside text-xs space-y-0.5">
          <li>Inpatient treatment centers (ITCs) — discharge weekly</li>
          <li>Intensive Outpatient Programs (IOPs)</li>
          <li>Drug courts / DUI courts</li>
          <li>Adult probation / parole offices</li>
          <li>Hospital social workers / discharge planners</li>
          <li>AHCCCS case managers</li>
        </ul>
      </div>

      <div className="space-y-4">
        {partners.map((partner, i) => (
          <div key={i} className="p-4 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Referral Partner {i + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePartner(i)}
                className="text-destructive h-7"
              >
                Remove
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Organization Name</Label>
                <Input
                  value={partner.name}
                  onChange={(e) => updatePartner(i, "name", e.target.value)}
                  placeholder="Organization name"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select
                  value={partner.type}
                  onValueChange={(v) => updatePartner(i, "type", v)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="treatment_center">Inpatient Treatment Center</SelectItem>
                    <SelectItem value="iop">IOP</SelectItem>
                    <SelectItem value="detox">Detox</SelectItem>
                    <SelectItem value="drug_court">Drug Court / DUI Court</SelectItem>
                    <SelectItem value="probation">Probation / Parole</SelectItem>
                    <SelectItem value="hospital">Hospital Social Work</SelectItem>
                    <SelectItem value="ahcccs">AHCCCS Case Management</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contact Name / Phone</Label>
                <Input
                  value={partner.contact}
                  onChange={(e) => updatePartner(i, "contact", e.target.value)}
                  placeholder="Contact info"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={partner.status ?? "identified"}
                  onValueChange={(v) => updatePartner(i, "status", v)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
                    <SelectItem value="active">Active Referral Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addPartner}>
        Add Referral Partner
      </Button>
    </div>
  );
}

function Step10({ data, onChange }: { data: StepData; onChange: (d: StepData) => void }) {
  const sections = [
    {
      title: "Legal & Compliance",
      items: [
        { key: "entity_formed", label: "LLC or legal entity formed and registered" },
        { key: "ein_obtained", label: "EIN obtained" },
        { key: "bank_account_active", label: "Business bank account active and funded" },
        { key: "insurance_bound", label: "All insurance policies bound and active" },
        { key: "zoning_compliance", label: "Zoning compliance verified with municipality" },
        { key: "business_license", label: "Business license obtained (if required)" },
        { key: "adhs_status", label: "ADHS license obtained OR housing-only status documented" },
      ],
    },
    {
      title: "Property Readiness",
      items: [
        { key: "lease_signed", label: "Lease/purchase agreement signed" },
        { key: "smoke_detectors_ready", label: "Smoke/CO detectors tested and compliant" },
        { key: "fire_extinguisher_ready", label: "Fire extinguisher(s) installed and inspected" },
        { key: "first_aid_stocked", label: "First aid kit stocked" },
        { key: "narcan_ready", label: "Narcan available with trained administrator" },
        { key: "exits_marked", label: "Emergency exits clearly marked" },
        { key: "furnished", label: "House fully furnished (beds, kitchen, common areas)" },
        { key: "rules_posted", label: "House rules posted visibly" },
        { key: "emergency_contacts_posted", label: "Emergency contacts posted in kitchen and common area" },
      ],
    },
    {
      title: "Documents & Policies",
      items: [
        { key: "all_docs_final", label: "All 12 policy documents finalized" },
        { key: "handbook_printed", label: "Resident Handbook printed for house" },
        { key: "intake_packets", label: "Intake packets prepared (admission agreement, occupancy agreement)" },
        { key: "emergency_protocol_posted", label: "Emergency response protocol posted prominently" },
      ],
    },
    {
      title: "Staffing",
      items: [
        { key: "manager_hired", label: "House manager hired or role defined" },
        { key: "fingerprint_clearance", label: "Background check / fingerprint clearance completed" },
        { key: "cpr_done", label: "CPR/First Aid certified" },
        { key: "mandatory_reporter_done", label: "Mandatory reporter training completed" },
      ],
    },
    {
      title: "Referral & Marketing",
      items: [
        { key: "azrha_certified", label: "AzRHA certification obtained (or applied)" },
        { key: "website_live", label: "Website live" },
        { key: "phone_active", label: "Phone line active and answered" },
        { key: "marketing_ready", label: "Marketing materials / brochures ready" },
      ],
    },
    {
      title: "Technology & Financial",
      items: [
        { key: "soberops_configured", label: "SoberOps configured (house, beds, facility settings)" },
        { key: "payment_system", label: "Payment collection system ready" },
        { key: "operating_reserve", label: "3-month operating reserve funded" },
      ],
    },
  ];

  const allItems = sections.flatMap((s) => s.items);
  const completedCount = allItems.filter((item) => data[item.key]).length;
  const totalCount = allItems.length;
  const pct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span>Launch Readiness</span>
          <span>{completedCount}/{totalCount} complete</span>
        </div>
        <Progress value={pct} className="h-3" />
        {pct === 100 && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            You're ready to launch!
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Target Launch Date</Label>
        <Input
          type="date"
          value={data.launch_date ?? ""}
          onChange={(e) => onChange({ ...data, launch_date: e.target.value })}
          className="w-48"
        />
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {section.title}
            </h3>
            {section.items.map((item) => (
              <ChecklistItem
                key={item.key}
                id={`step10-${item.key}`}
                label={item.label}
                checked={data[item.key] ?? false}
                onChange={(v) => onChange({ ...data, [item.key]: v })}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Wizard Component ───────────────────────────────────────────────────

export default function StartupWizard() {
  const { wizardId } = useParams<{ wizardId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: wizard, isLoading } = useQuery({
    queryKey: ["startup_wizard", wizardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_wizards")
        .select("*")
        .eq("id", wizardId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!wizardId,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<Record<number, StepData>>({});
  const [saving, setSaving] = useState(false);

  // Sync from DB
  useEffect(() => {
    if (wizard) {
      setCurrentStep(wizard.current_step ?? 1);
      const dbStepData = wizard.step_data as Record<string, StepData>;
      const parsed: Record<number, StepData> = {};
      for (const [k, v] of Object.entries(dbStepData)) {
        parsed[parseInt(k)] = v as StepData;
      }
      setStepData(parsed);
    }
  }, [wizard]);

  const saveProgress = useCallback(
    async (step: number, data: StepData, completedStepsOverride?: number[]) => {
      if (!wizardId || !wizard) return;
      setSaving(true);
      try {
        const allStepData = { ...stepData, [step]: data };

        // Build completed steps
        const existingCompleted = new Set<number>(wizard.completed_steps as number[]);
        // Mark step as complete if any data was entered
        if (Object.keys(data).length > 0) existingCompleted.add(step);
        const completed = completedStepsOverride ?? Array.from(existingCompleted);

        // Extract top-level wizard fields from step 1
        const step1 = allStepData[1] ?? {};
        const updates: Record<string, any> = {
          current_step: step,
          step_data: allStepData,
          completed_steps: completed,
          updated_at: new Date().toISOString(),
        };

        if (step1.organization_name) updates.organization_name = step1.organization_name;
        if (step1.municipality) updates.municipality = step1.municipality;
        if (step1.narr_level) updates.narr_level = step1.narr_level;
        if (step === TOTAL_STEPS && completed.length === TOTAL_STEPS) {
          updates.status = "completed";
        }

        const { error } = await supabase
          .from("startup_wizards")
          .update(updates)
          .eq("id", wizardId);

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["startup_wizard", wizardId] });
        queryClient.invalidateQueries({ queryKey: ["startup_wizards"] });
      } catch {
        toast({ title: "Failed to save progress", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [wizardId, wizard, stepData, queryClient]
  );

  const currentData = stepData[currentStep] ?? {};

  const handleStepDataChange = (data: StepData) => {
    setStepData((prev) => ({ ...prev, [currentStep]: data }));
  };

  const goNext = async () => {
    await saveProgress(currentStep, currentData);
    if (currentStep < TOTAL_STEPS) setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const progressPercent = wizard
    ? Math.round(((wizard.completed_steps as number[]).length / TOTAL_STEPS) * 100)
    : 0;

  // Template params derived from step 1 data
  const step1 = stepData[1] ?? {};
  const templateParams: PolicyTemplateParams = {
    orgName: step1.organization_name ?? wizard?.organization_name ?? "Your Organization",
    municipality: step1.municipality ?? wizard?.municipality ?? "phoenix",
    narrLevel: step1.narr_level ?? wizard?.narr_level ?? "II",
    address: (stepData[3] ?? {}).address ?? "",
    bedCount: parseInt(step1.bed_count ?? "8", 10),
    matFriendly: step1.mat_friendly ?? false,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading wizard...</p>
      </div>
    );
  }

  if (!wizard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Wizard not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/startup")}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          All Wizards
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate flex items-center gap-2">
            <Rocket className="h-6 w-6 shrink-0" />
            {wizard.organization_name}
          </h1>
        </div>
        {saving && (
          <span className="text-xs text-muted-foreground">Saving...</span>
        )}
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall progress</span>
          <span>{progressPercent}% complete</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step pills */}
      <div className="flex gap-1 flex-wrap">
        {STEP_TITLES.map((title, i) => {
          const stepNum = i + 1;
          const isCompleted = (wizard.completed_steps as number[]).includes(stepNum);
          const isCurrent = currentStep === stepNum;
          return (
            <button
              key={stepNum}
              onClick={() => setCurrentStep(stepNum)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              title={title}
            >
              {isCompleted && !isCurrent ? "✓ " : ""}
              {stepNum}
            </button>
          );
        })}
      </div>

      {/* Current step card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Step {currentStep} — {STEP_TITLES[currentStep - 1]}
          </CardTitle>
          <CardDescription>
            {currentStep}/{TOTAL_STEPS} steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <Step1
              data={currentData}
              onChange={handleStepDataChange}
              wizard={wizard}
            />
          )}
          {currentStep === 2 && (
            <Step2 data={currentData} onChange={handleStepDataChange} />
          )}
          {currentStep === 3 && (
            <Step3
              data={currentData}
              onChange={handleStepDataChange}
              municipality={templateParams.municipality}
            />
          )}
          {currentStep === 4 && (
            <Step4 data={currentData} onChange={handleStepDataChange} />
          )}
          {currentStep === 5 && (
            <Step5
              data={currentData}
              onChange={handleStepDataChange}
              wizardId={wizardId!}
              templateParams={templateParams}
            />
          )}
          {currentStep === 6 && (
            <Step6 data={currentData} onChange={handleStepDataChange} />
          )}
          {currentStep === 7 && (
            <Step7 data={currentData} onChange={handleStepDataChange} />
          )}
          {currentStep === 8 && (
            <Step8
              data={currentData}
              onChange={handleStepDataChange}
              narrLevel={templateParams.narrLevel}
            />
          )}
          {currentStep === 9 && (
            <Step9 data={currentData} onChange={handleStepDataChange} />
          )}
          {currentStep === 10 && (
            <Step10 data={currentData} onChange={handleStepDataChange} />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={goNext} disabled={saving}>
          {currentStep === TOTAL_STEPS ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Finish
            </>
          ) : (
            <>
              Save & Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
