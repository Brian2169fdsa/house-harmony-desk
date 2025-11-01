import React from "react";

interface FeatureGateProps {
  flag: string;
  children: React.ReactNode;
}

export default function FeatureGate({ flag, children }: FeatureGateProps) {
  const enabled = typeof window !== "undefined" && localStorage.getItem(flag) === "true";

  if (enabled) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">Feature disabled</h1>
        <p className="text-muted-foreground">Enable this in Settings → Feature Flags.</p>
        <a href="/settings" className="underline text-primary">Open Settings</a>
      </div>
    </div>
  );
}
