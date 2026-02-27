import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AgentConfigDrawerProps {
  agent: any | null;
  open: boolean;
  onClose: () => void;
}

const CRON_PRESETS = [
  { label: "Every day at 6 AM", value: "0 6 * * *" },
  { label: "Every day at 8 AM", value: "0 8 * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every Monday at 7 AM", value: "0 7 * * 1" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Custom", value: "custom" },
];

const MODEL_OPTIONS = [
  { label: "Claude 3 Haiku (fast, economical)", value: "claude-3-haiku" },
  { label: "Claude Sonnet 4.6 (balanced)", value: "claude-sonnet-4-6" },
  { label: "Claude Opus 4.6 (most capable)", value: "claude-opus-4-6" },
];

export function AgentConfigDrawer({ agent, open, onClose }: AgentConfigDrawerProps) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [cronPreset, setCronPreset] = useState("custom");
  const [cronValue, setCronValue] = useState("");
  const [model, setModel] = useState("claude-3-haiku");
  const [temperature, setTemperature] = useState("0.3");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [configText, setConfigText] = useState("");

  useEffect(() => {
    if (!agent) return;
    setEnabled(agent.enabled ?? false);
    const cron = agent.schedule_cron ?? "";
    setCronValue(cron);
    const preset = CRON_PRESETS.find((p) => p.value === cron && p.value !== "custom");
    setCronPreset(preset ? preset.value : cron ? "custom" : "");
    const cfg = agent.config_json ?? {};
    setModel((cfg as any).model ?? "claude-3-haiku");
    setTemperature(String((cfg as any).temperature ?? 0.3));
    setSystemPrompt((cfg as any).system_prompt ?? "");
    // Show the full config minus model/temp/system_prompt for advanced editing
    const { model: _m, temperature: _t, system_prompt: _s, ...rest } = cfg as any;
    setConfigText(JSON.stringify(rest, null, 2));
  }, [agent]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let extraConfig: Record<string, unknown> = {};
      try {
        extraConfig = configText.trim() ? JSON.parse(configText) : {};
      } catch {
        throw new Error("Invalid JSON in advanced config");
      }
      const config_json = {
        ...extraConfig,
        model,
        temperature: parseFloat(temperature) || 0.3,
        ...(systemPrompt ? { system_prompt: systemPrompt } : {}),
      };
      const { error } = await supabase
        .from("agent_configurations")
        .update({
          enabled,
          config_json,
          schedule_cron: cronValue || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent_configurations"] });
      toast.success(`${agent.display_name} configuration saved`);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save configuration");
    },
  });

  if (!agent) return null;

  const isScheduled = !!agent.schedule_cron || cronValue;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[420px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{agent.display_name}</SheetTitle>
          <SheetDescription>{agent.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Enable / Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Agent</Label>
              <p className="text-sm text-muted-foreground">
                Agent will {enabled ? "actively" : "not"} process events
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <Separator />

          {/* Schedule (only for scheduled agents) */}
          {agent.schedule_cron !== undefined && (
            <>
              <div className="space-y-2">
                <Label>Run Schedule</Label>
                <Select
                  value={cronPreset}
                  onValueChange={(v) => {
                    setCronPreset(v);
                    if (v !== "custom") setCronValue(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CRON_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cronPreset === "custom" && (
                  <Input
                    placeholder="0 8 * * * (cron expression)"
                    value={cronValue}
                    onChange={(e) => setCronValue(e.target.value)}
                    className="font-mono text-sm"
                  />
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Model selection */}
          <div className="space-y-2">
            <Label>AI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label>
              Temperature{" "}
              <span className="text-muted-foreground font-normal">
                ({temperature}) — lower = more consistent
              </span>
            </Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise (0)</span>
              <span>Creative (1)</span>
            </div>
          </div>

          {/* System prompt override */}
          <div className="space-y-2">
            <Label>System Prompt Override</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              placeholder="Leave blank to use default system prompt for this agent…"
              className="text-sm"
            />
          </div>

          {/* Advanced config */}
          <div className="space-y-2">
            <Label>
              Advanced Config{" "}
              <span className="text-muted-foreground font-normal">(JSON)</span>
            </Label>
            <Textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : "Save Configuration"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
