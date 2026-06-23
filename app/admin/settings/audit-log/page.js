"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const moduleOptions = ["", "products", "orders", "inventory", "procurement", "settings", "customers"];
const actionOptions = ["", "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "STOCK_CHANGE"];

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function stringify(value) {
  if (value === null || value === undefined) {
    return "null";
  }

  return JSON.stringify(value, null, 2);
}

export default function AuditLogPage() {
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (module) {
      params.set("module", module);
    }

    if (action) {
      params.set("action", action);
    }

    if (userId.trim()) {
      params.set("userId", userId.trim());
    }

    return params.toString();
  }, [action, module, userId]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/audit-logs${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load audit logs.");
      }

      setLogs(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load audit logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <main className="app-shell">
      <section className="app-card p-4 sm:p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">Audit log</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Track admin changes for products, orders, inventory, and system records.
        </p>

        <div className="mt-6 grid gap-3 min-[760px]:grid-cols-[1fr_1fr_1.4fr_auto]">
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Module
            <select value={module} onChange={(event) => setModule(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-3">
              {moduleOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "All modules"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Action
            <select value={action} onChange={(event) => setAction(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-3">
              {actionOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "All actions"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-[var(--foreground)]">
            User ID
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Filter by user id"
              className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-3"
            />
          </label>
          <button
            type="button"
            onClick={loadLogs}
            className="self-end rounded-2xl bg-[var(--action)] px-5 py-3 text-sm font-semibold text-[var(--action-foreground)]"
          >
            Refresh
          </button>
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[58rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Module</th>
                <th className="px-3 py-2">Record</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[var(--muted-foreground)]">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length ? (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-[var(--border-soft)]">
                    <td className="px-3 py-3 text-[var(--muted-foreground)]">{formatDate(log.createdAt)}</td>
                    <td className="px-3 py-3 font-semibold text-[var(--foreground)]">{log.userName}</td>
                    <td className="px-3 py-3 text-[var(--foreground)]">{log.action}</td>
                    <td className="px-3 py-3 text-[var(--foreground)]">{log.module}</td>
                    <td className="px-3 py-3 font-mono text-xs text-[var(--muted-foreground)]">{log.recordId || "-"}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="rounded-xl bg-[color-mix(in_srgb,var(--action)_12%,var(--surface))] px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[var(--muted-foreground)]">
                    No audit logs match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="app-card max-h-[88vh] w-full max-w-[64rem] overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Change details</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {selectedLog.action} in {selectedLog.module}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-4 min-[900px]:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">Old value</p>
                <pre className="max-h-[32rem] overflow-auto rounded-2xl bg-[var(--surface)] p-4 text-xs leading-6 text-[var(--foreground)]">{stringify(selectedLog.oldValue)}</pre>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">New value</p>
                <pre className="max-h-[32rem] overflow-auto rounded-2xl bg-[var(--surface)] p-4 text-xs leading-6 text-[var(--foreground)]">{stringify(selectedLog.newValue)}</pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
