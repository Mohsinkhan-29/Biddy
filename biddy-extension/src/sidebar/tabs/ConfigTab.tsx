import { useEffect, useState } from "react";
import { getConfig, setConfig, type BiddyConfig } from "@shared/utils/storage";

export function ConfigTab() {
  const [config, setLocalConfig] = useState<BiddyConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getConfig().then(setLocalConfig);
  }, []);

  if (!config) return <p className="text-xs text-biddy-muted">Loading…</p>;

  const save = async () => {
    await setConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex flex-col gap-3 text-xs">
      <Field label="Backend URL">
        <input
          value={config.backendUrl}
          onChange={(e) => setLocalConfig({ ...config, backendUrl: e.target.value })}
          className="input"
        />
      </Field>

      <Field label="Skills Summary">
        <textarea
          value={config.userProfile.skillsSummary}
          onChange={(e) =>
            setLocalConfig({
              ...config,
              userProfile: { ...config.userProfile, skillsSummary: e.target.value },
            })
          }
          className="input h-16 resize-none"
        />
      </Field>

      <Field label="Resume Summary">
        <textarea
          value={config.userProfile.resumeSummary}
          onChange={(e) =>
            setLocalConfig({
              ...config,
              userProfile: { ...config.userProfile, resumeSummary: e.target.value },
            })
          }
          className="input h-16 resize-none"
        />
      </Field>

      <Field label="Proposal Tone">
        <select
          value={config.userProfile.tone}
          onChange={(e) =>
            setLocalConfig({
              ...config,
              userProfile: { ...config.userProfile, tone: e.target.value as BiddyConfig["userProfile"]["tone"] },
            })
          }
          className="input"
        >
          <option value="concise">Concise</option>
          <option value="warm">Warm</option>
          <option value="formal">Formal</option>
        </select>
      </Field>

      <label className="flex items-center gap-2 text-biddy-muted">
        <input
          type="checkbox"
          checked={config.autoAnalyzeFeed}
          onChange={(e) => setLocalConfig({ ...config, autoAnalyzeFeed: e.target.checked })}
        />
        Auto-analyze feed cards on scroll
      </label>

      <button
        onClick={save}
        className="rounded-md bg-biddy-accent text-biddy-bg font-semibold py-2 mt-1"
      >
        {saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-biddy-muted">{label}</span>
      {children}
    </label>
  );
}
