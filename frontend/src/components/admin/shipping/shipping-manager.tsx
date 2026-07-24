"use client";

/**
 * ShippingManager — single client component that handles zones and
 * methods together. Two stacked sections: zones first (with their
 * methods listed underneath), then a flat list of all methods.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createZoneAction,
  updateZoneAction,
  deleteZoneAction,
  createMethodAction,
  updateMethodAction,
  deleteMethodAction,
} from "@/lib/actions/admin-shipping";

interface Zone {
  id: string;
  name: string;
  countries: string[];
  is_active: boolean;
  shipping_methods: Array<{ id: string; name: string; is_active: boolean }>;
}
interface Method {
  id: string;
  zone_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  rate_ngn: number;
  rate_usd: number;
  rate_eur: number;
  rate_gbp: number;
  rate_ghs: number;
  rate_zar: number;
  rate_kes: number;
  free_over_ngn: number | null;
  free_over_usd: number | null;
  free_over_eur: number | null;
  free_over_gbp: number | null;
  free_over_ghs: number | null;
  free_over_zar: number | null;
  free_over_kes: number | null;
  zone: { id: string; name: string } | null;
}

interface ShippingManagerProps {
  initialZones: Zone[];
  initialMethods: Method[];
}

const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "GHS", "ZAR", "KES"] as const;

export function ShippingManager({ initialZones, initialMethods }: ShippingManagerProps) {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [methods, setMethods] = useState<Method[]>(initialMethods);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <ZonesSection zones={zones} setZones={setZones} onChange={refresh} />
      <MethodsSection
        zones={zones}
        methods={methods}
        setMethods={setMethods}
        onChange={refresh}
      />
    </div>
  );
}

function ZonesSection({
  zones,
  setZones,
  onChange,
}: {
  zones: Zone[];
  setZones: (z: Zone[]) => void;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <section>
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone">Shipping zones</h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone"
        >
          <Plus className="h-3.5 w-3.5" />
          New zone
        </button>
      </header>
      <div className="border border-line bg-ivory">
        {zones.length === 0 && !adding ? (
          <p className="px-4 py-8 text-center text-sm text-stone">No zones yet.</p>
        ) : (
          <ul>
            {zones.map((z) => (
              <ZoneRow key={z.id} zone={z} setZones={setZones} onChange={onChange} />
            ))}
          </ul>
        )}
        {adding ? (
          <ZoneAddForm
            onCancel={() => setAdding(false)}
            onDone={() => {
              setAdding(false);
              onChange();
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

function ZoneRow({
  zone,
  setZones,
  onChange,
}: {
  zone: Zone;
  setZones: (z: Zone[]) => void;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(zone.name);
  const [countries, setCountries] = useState(zone.countries.join(", "));
  const [active, setActive] = useState(zone.is_active);

  function save() {
    const list = countries
      .split(/[\s,]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length === 2);
    startTransition(async () => {
      const res = await updateZoneAction(zone.id, {
        name,
        countries: list,
        is_active: active,
      });
      if (res.error) toast.error(res.error);
      else {
        setZones((prev) => prev.map((x) => (x.id === zone.id ? { ...x, name, countries: list, is_active: active } : x)));
        toast.success("Saved");
        setEditing(false);
        onChange();
      }
    });
  }

  function remove() {
    if (!confirm(`Delete zone "${zone.name}"? Methods inside it will be deleted too.`)) return;
    startTransition(async () => {
      const res = await deleteZoneAction(zone.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Zone removed");
        onChange();
      }
    });
  }

  return (
    <li className="border-b border-line last:border-0 px-4 py-4">
      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Zone name (e.g. West Africa)"
              className="letty-input"
            />
            <input
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              placeholder="Country codes: NG, GH, SN"
              className="letty-input"
            />
            <label className="inline-flex items-center gap-2 h-10 px-3 border border-line text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-3.5 w-3.5 accent-ink"
              />
              <span className="text-stone">Active</span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="h-9 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-ink">{zone.name}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone">
              {zone.countries.join(" · ") || "—"} · {zone.shipping_methods?.length ?? 0} method(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 ${zone.is_active ? "bg-ink" : "bg-stone/30"}`}
              aria-label={zone.is_active ? "active" : "inactive"}
            />
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-8 px-3 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label="Delete"
              className="h-8 w-8 grid place-items-center text-stone hover:text-ink"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function ZoneAddForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [countries, setCountries] = useState("");

  function submit() {
    const list = countries
      .split(/[\s,]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length === 2);
    if (!name.trim() || list.length === 0) {
      toast.error("Name and at least one country code required");
      return;
    }
    startTransition(async () => {
      const res = await createZoneAction({ name, countries: list, is_active: true });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Zone created");
        onDone();
      }
    });
  }

  return (
    <div className="border-t border-line p-4 space-y-3 bg-ivory">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Zone name"
          className="letty-input"
        />
        <input
          value={countries}
          onChange={(e) => setCountries(e.target.value)}
          placeholder="Country codes: NG, GH, SN"
          className="letty-input"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="h-9 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Create zone
        </button>
      </div>
    </div>
  );
}

function MethodsSection({
  zones,
  methods,
  setMethods,
  onChange,
}: {
  zones: Zone[];
  methods: Method[];
  setMethods: (m: Method[]) => void;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <section>
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone">Shipping methods</h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          disabled={zones.length === 0}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
          New method
        </button>
      </header>
      <div className="border border-line bg-ivory overflow-x-auto">
        {methods.length === 0 && !adding ? (
          <p className="px-4 py-8 text-center text-sm text-stone">No methods yet — add a zone first.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone">Name</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone">Zone</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone">Rate (NGN)</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone">Rate (USD)</th>
                <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.18em] text-stone">Active</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <MethodRow key={m.id} method={m} zones={zones} setMethods={setMethods} onChange={onChange} />
              ))}
            </tbody>
          </table>
        )}
        {adding ? (
          <MethodAddForm
            zones={zones}
            onCancel={() => setAdding(false)}
            onDone={() => {
              setAdding(false);
              onChange();
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

function MethodRow({
  method,
  setMethods,
  onChange,
}: {
  method: Method;
  zones: Zone[];
  setMethods: (m: Method[]) => void;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rates, setRates] = useState<Record<string, number>>({
    NGN: method.rate_ngn,
    USD: method.rate_usd,
    EUR: method.rate_eur,
    GBP: method.rate_gbp,
    GHS: method.rate_ghs,
    ZAR: method.rate_zar,
    KES: method.rate_kes,
  });
  const [freeOver, setFreeOver] = useState<Record<string, number | "">>({
    NGN: method.free_over_ngn ?? "",
    USD: method.free_over_usd ?? "",
    EUR: method.free_over_eur ?? "",
    GBP: method.free_over_gbp ?? "",
    GHS: method.free_over_ghs ?? "",
    ZAR: method.free_over_zar ?? "",
    KES: method.free_over_kes ?? "",
  });
  const [active, setActive] = useState(method.is_active);

  function save() {
    startTransition(async () => {
      const body: Record<string, any> = {
        is_active: active,
        ...(Object.fromEntries(Object.entries(rates).map(([k, v]) => [`rate_${k.toLowerCase()}`, v]))),
      };
      for (const c of CURRENCIES) {
        const v = freeOver[c];
        body[`free_over_${c.toLowerCase()}`] = v === "" ? null : Number(v);
      }
      const res = await updateMethodAction(method.id, body);
      if (res.error) toast.error(res.error);
      else {
        setMethods((prev) => prev.map((x) => (x.id === method.id ? { ...x, ...method, is_active: active } : x)));
        toast.success("Saved");
        setEditing(false);
        onChange();
      }
    });
  }

  function remove() {
    if (!confirm(`Delete method "${method.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteMethodAction(method.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Removed");
        onChange();
      }
    });
  }

  return (
    <tr className="border-b border-line last:border-0 align-top">
      <td className="px-4 py-3 text-ink">{method.name}</td>
      <td className="px-4 py-3 text-xs text-stone">{method.zone?.name ?? "—"}</td>
      <td className="px-4 py-3 text-right tabular-nums">{method.rate_ngn}</td>
      <td className="px-4 py-3 text-right tabular-nums">{method.rate_usd}</td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-block h-2 w-2 ${method.is_active ? "bg-ink" : "bg-stone/30"}`}
          aria-label={method.is_active ? "active" : "inactive"}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="h-7 px-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Delete"
            className="h-7 w-7 grid place-items-center text-stone hover:text-ink"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
      {editing ? (
        <tr>
          <td colSpan={6} className="px-4 pb-4 -mt-1">
            <div className="border border-line p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CURRENCIES.map((c) => (
                <div key={c}>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-stone">{c} rate</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rates[c]}
                    onChange={(e) => setRates((p) => ({ ...p, [c]: Number(e.target.value) }))}
                    className="letty-input tabular-nums mt-1 w-full"
                  />
                </div>
              ))}
              {CURRENCIES.map((c) => (
                <div key={`fo-${c}`}>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-stone">{c} free over</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={freeOver[c]}
                    placeholder="—"
                    onChange={(e) =>
                      setFreeOver((p) => ({ ...p, [c]: e.target.value === "" ? "" : Number(e.target.value) }))
                    }
                    className="letty-input tabular-nums mt-1 w-full"
                  />
                </div>
              ))}
              <label className="col-span-2 sm:col-span-4 inline-flex items-center gap-2 h-9 px-3 border border-line text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ink"
                />
                <span className="text-stone">Active</span>
              </label>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-8 px-3 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="h-8 px-4 text-[10px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Save
              </button>
            </div>
          </td>
        </tr>
      ) : null}
    </tr>
  );
}

function MethodAddForm({
  zones,
  onCancel,
  onDone,
}: {
  zones: Zone[];
  onCancel: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rates, setRates] = useState<Record<string, number>>({ NGN: 0, USD: 0, EUR: 0, GBP: 0, GHS: 0, ZAR: 0, KES: 0 });

  function submit() {
    if (!zoneId || !name.trim()) {
      toast.error("Zone and method name are required");
      return;
    }
    startTransition(async () => {
      const body: Record<string, any> = {
        zone_id: zoneId,
        name: name.trim(),
        description: description || null,
        is_active: true,
        ...(Object.fromEntries(Object.entries(rates).map(([k, v]) => [`rate_${k.toLowerCase()}`, v]))),
      };
      const res = await createMethodAction(body);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Method created");
        onDone();
      }
    });
  }

  return (
    <div className="border-t border-line p-4 space-y-3 bg-ivory">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="letty-input">
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Method name (e.g. Standard, Express)"
          className="letty-input"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="letty-input sm:col-span-2"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CURRENCIES.map((c) => (
          <div key={c}>
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone">{c}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rates[c]}
              onChange={(e) => setRates((p) => ({ ...p, [c]: Number(e.target.value) }))}
              className="letty-input tabular-nums mt-1 w-full"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="h-9 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Create method
        </button>
      </div>
    </div>
  );
}
