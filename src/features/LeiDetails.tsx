import { useState } from "react";
import { Button, Callout } from "../shyft";

interface LeiRecord {
  lei: string;
  legal_name: string | null;
  entity_status: string | null;
  jurisdiction: string | null;
  legal_address: string | null;
  hq_address: string | null;
  registration_status: string | null;
  registered_at: string | null;
  last_updated: string | null;
  next_renewal: string | null;
  gleif_url: string;
}

type Status =
  | { kind: "collapsed" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "open"; record: LeiRecord };

/**
 * On-demand legal entity details, fetched from GLEIF (via our worker,
 * edge-cached) only when the user asks — a reveal, not another page.
 */
export function LeiDetails({ lei }: { lei: string }) {
  const [status, setStatus] = useState<Status>({ kind: "collapsed" });

  async function reveal() {
    setStatus({ kind: "loading" });
    try {
      const response = await fetch(`/api/lei-record?lei=${encodeURIComponent(lei)}`);
      const body = (await response.json()) as LeiRecord & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not load the GLEIF record.");
      }
      setStatus({ kind: "open", record: body });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Could not load the GLEIF record.",
      });
    }
  }

  if (status.kind === "collapsed" || status.kind === "loading") {
    return (
      <div className="lei-details__actions">
        <Button variant="ghost" size="sm" loading={status.kind === "loading"} onClick={reveal}>
          Show legal entity details
        </Button>
      </div>
    );
  }

  if (status.kind === "error") {
    return <Callout tone="danger">{status.message}</Callout>;
  }

  const { record } = status;
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value: string | null) => {
    if (value) rows.push({ label, value });
  };
  push("Legal name", record.legal_name);
  push("Entity status", record.entity_status);
  push("Jurisdiction", record.jurisdiction);
  push("Legal address", record.legal_address);
  push("Headquarters", record.hq_address);
  push("LEI registration", record.registration_status);
  push("First registered", record.registered_at);
  push("Last updated", record.last_updated);
  push("Next renewal", record.next_renewal);

  return (
    <div className="lei-details">
      <div className="lei-details__header">
        <span className="sh-overline">Legal entity record · GLEIF</span>
        <a href={record.gleif_url} target="_blank" rel="noopener noreferrer">
          View on GLEIF
        </a>
      </div>
      <dl className="shyft-rows">
        {rows.map((row) => (
          <div className="shyft-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
