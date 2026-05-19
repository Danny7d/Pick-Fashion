import { useEffect, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { fetchAdminSettings, saveAdminSettings } from "./adminUtils";

const Settings = () => {
  const { profile, session } = UserAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const nextSettings = await fetchAdminSettings();
        if (!cancelled) setSettings(nextSettings);
      } catch (error) {
        if (!cancelled) {
          setSettings({
            store_name: "Pick Fashion",
            store_email: "pickfashionzr@gmail.com",
            store_phone: "",
            currency: "Br",
            low_stock_threshold: 3,
            notify_new_orders: true,
            notify_low_stock: true,
            notify_customer_messages: true,
          });
          setNotice(error.message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice("");
    try {
      await saveAdminSettings(settings);
      setNotice("Settings saved.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="h-48 animate-pulse rounded-3xl bg-white" />;
  }

  return (
    <div className="motion-page space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Store identity, notification flags, and owner profile reference.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="motion-card admin-surface rounded-3xl p-6">
          <h2 className="text-lg font-black text-slate-950">Admin profile</h2>
          <div className="mt-5 space-y-4 text-sm">
            <ReadOnlyField label="Username" value={profile?.username || "—"} />
            <ReadOnlyField label="Email" value={session?.user?.email || "—"} />
            <ReadOnlyField label="Role" value={profile?.role || "admin"} />
          </div>
        </section>

        <section className="motion-card admin-surface rounded-3xl p-6">
          <h2 className="text-lg font-black text-slate-950">Store settings</h2>
          <div className="mt-5 grid gap-4">
            <EditableField label="Store name">
              <input
                value={settings.store_name}
                onChange={(event) =>
                  updateField("store_name", event.target.value)
                }
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </EditableField>
            <EditableField label="Store email">
              <input
                type="email"
                value={settings.store_email}
                onChange={(event) =>
                  updateField("store_email", event.target.value)
                }
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </EditableField>
            <EditableField label="Store phone">
              <input
                value={settings.store_phone || ""}
                onChange={(event) =>
                  updateField("store_phone", event.target.value)
                }
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </EditableField>
            <div className="grid gap-4 md:grid-cols-2">
              <EditableField label="Currency">
                <select
                  value={settings.currency}
                  onChange={(event) =>
                    updateField("currency", event.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
                >
                  <option value="Br">Br</option>
                </select>
              </EditableField>
              <EditableField label="Low stock threshold">
                <input
                  min="0"
                  type="number"
                  value={settings.low_stock_threshold}
                  onChange={(event) =>
                    updateField("low_stock_threshold", event.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
                />
              </EditableField>
            </div>
          </div>
        </section>
      </div>

      <section className="motion-card admin-surface rounded-3xl p-6">
        <h2 className="text-lg font-black text-slate-950">Notifications</h2>
        <div className="mt-5 space-y-4">
          <ToggleRow
            label="New order notifications"
            checked={settings.notify_new_orders}
            onChange={(checked) => updateField("notify_new_orders", checked)}
          />
          <ToggleRow
            label="Low stock alerts"
            checked={settings.notify_low_stock}
            onChange={(checked) => updateField("notify_low_stock", checked)}
          />
          <ToggleRow
            label="Customer message alerts"
            checked={settings.notify_customer_messages}
            onChange={(checked) =>
              updateField("notify_customer_messages", checked)
            }
          />
        </div>
      </section>

      {notice && (
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          {notice}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="motion-button animated-sheen rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
};

const ReadOnlyField = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-2 rounded-2xl bg-stone-50 px-4 py-3 text-slate-900">
      {value}
    </p>
  </div>
);

const EditableField = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">
      {label}
    </span>
    {children}
  </label>
);

const ToggleRow = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-4">
    <span className="text-sm font-semibold text-slate-800">{label}</span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-5 w-5 accent-orange-500"
    />
  </label>
);

export default Settings;
