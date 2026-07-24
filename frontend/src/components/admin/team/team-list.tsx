"use client";

/**
 * TeamList — table of admins with inline role + active toggles.
 * "Invite" button opens a modal-style form that returns a one-time
 * temporary password.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { inviteTeamAction, updateTeamAction } from "@/lib/actions/admin-team";

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "fulfillment", label: "Fulfillment" },
  { value: "support", label: "Support" },
  { value: "marketing", label: "Marketing" },
  { value: "viewer", label: "Viewer" },
];

interface Member {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export function TeamList({ initial }: { initial: Member[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone"
        >
          <Plus className="h-3.5 w-3.5" />
          Invite member
        </button>
      </div>

      {open ? <InviteForm onCancel={() => setOpen(false)} onDone={() => { setOpen(false); router.refresh(); }} /> : null}

      <div className="border border-line bg-ivory overflow-x-auto">
        {initial.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone">No team members yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone">Email</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone">Role</th>
                <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.18em] text-stone">Active</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone hidden md:table-cell">Last login</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((m) => (
                <Row key={m.id} member={m} onChange={() => router.refresh()} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Row({ member, onChange }: { member: Member; onChange: () => void }) {
  const [pending, startTransition] = useTransition();
  function setRole(role: string) {
    startTransition(async () => {
      const res = await updateTeamAction(member.id, { role });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Role updated");
        onChange();
      }
    });
  }
  function setActive(is_active: boolean) {
    startTransition(async () => {
      const res = await updateTeamAction(member.id, { is_active });
      if (res.error) toast.error(res.error);
      else {
        toast.success(is_active ? "Reactivated" : "Deactivated");
        onChange();
      }
    });
  }
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3 text-ink">{member.email}</td>
      <td className="px-4 py-3">
        <select
          value={member.role}
          onChange={(e) => setRole(e.target.value)}
          disabled={pending}
          className="letty-input"
        >
          {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
        </select>
      </td>
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={member.is_active}
          onChange={(e) => setActive(e.target.checked)}
          disabled={pending}
          className="h-3.5 w-3.5 accent-ink"
        />
      </td>
      <td className="px-4 py-3 text-right text-xs text-stone hidden md:table-cell">
        {member.last_login_at ? new Date(member.last_login_at).toLocaleString() : "—"}
      </td>
    </tr>
  );
}

function InviteForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  function submit() {
    if (!email) {
      toast.error("Email is required");
      return;
    }
    startTransition(async () => {
      const res = await inviteTeamAction({ email, role });
      if (res.error || !res.data) {
        toast.error(res.error ?? "Failed");
        return;
      }
      if (res.data.temporary_password) {
        setIssued({ email: res.data.email, password: res.data.temporary_password });
      }
      toast.success("Member invited");
      onDone();
    });
  }

  return (
    <div className="border border-line bg-ivory p-4 space-y-3">
      {issued ? (
        <div className="border border-line bg-ivory p-3 flex items-center justify-between">
          <p className="text-xs">
            Temporary password for <span className="font-mono">{issued.email}</span>:{" "}
            <span className="font-mono text-ink">{issued.password}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(issued.password);
              toast.success("Copied");
            }}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink"
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
        </div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="letty-input mt-1 w-full" />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="letty-input mt-1 w-full">
            {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 px-3 text-[11px] uppercase tracking-[0.18em] text-stone">
          <X className="h-3.5 w-3.5 inline mr-1" /> Close
        </button>
        <button type="button" onClick={submit} disabled={pending} className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Send invite
        </button>
      </div>
    </div>
  );
}
