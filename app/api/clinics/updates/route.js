import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();

const DEFAULT_POLL_INTERVAL_MS = Math.max(
  3000,
  parseInt(process.env.CLINICS_SSE_POLL_INTERVAL_MS || '10000', 10)
);
const DEFAULT_HEARTBEAT_MS = Math.max(
  5000,
  parseInt(process.env.CLINICS_SSE_HEARTBEAT_MS || '20000', 10)
);

async function fetchLatestSnapshot() {
  try {
    const [clinicRow] = await query(
      `SELECT 
         COUNT(*) AS total,
         UNIX_TIMESTAMP(
           GREATEST(
             IFNULL(MAX(updated_at), '1970-01-01 00:00:00')
           )
         ) AS version
       FROM clinics`
    );

    const [logRow] = await query(
      `SELECT 
         id,
         status,
         records_fetched,
         records_inserted,
         records_updated,
         records_failed,
         total_records,
         processed_records,
         progress_percent,
         current_page,
         total_pages,
         error_message,
         started_at,
         completed_at,
         duration_seconds,
         UNIX_TIMESTAMP(COALESCE(completed_at, started_at)) AS timestamp
       FROM sync_logs
       WHERE entity_type = 'clinics'
       ORDER BY GREATEST(
         IFNULL(completed_at, '1970-01-01 00:00:00'),
         started_at
       ) DESC
       LIMIT 1`
    );

    return {
      version: clinicRow?.version ?? 0,
      total: clinicRow?.total ?? 0,
      syncLog: logRow
        ? {
            id: logRow.id,
            status: logRow.status,
            fetched: logRow.records_fetched ?? 0,
            inserted: logRow.records_inserted ?? 0,
            updated: logRow.records_updated ?? 0,
            failed: logRow.records_failed ?? 0,
            total_records: logRow.total_records ?? 0,
            processed_records: logRow.processed_records ?? 0,
            progress_percent: logRow.progress_percent ?? 0,
            current_page: logRow.current_page ?? 0,
            total_pages: logRow.total_pages ?? 0,
            error_message: logRow.error_message,
            started_at: logRow.started_at,
            completed_at: logRow.completed_at,
            duration_seconds: logRow.duration_seconds,
            timestamp: logRow.timestamp ?? 0,
          }
        : null,
    };
  } catch (error) {
    return {
      version: 0,
      total: 0,
      syncLog: null,
      error: error.message,
    };
  }
}

function formatSseEvent(event, data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return encoder.encode(`event: ${event}\ndata: ${payload}\n\n`);
}

export async function GET() {
  const pollInterval =
    Number.isFinite(DEFAULT_POLL_INTERVAL_MS) && DEFAULT_POLL_INTERVAL_MS > 0
      ? DEFAULT_POLL_INTERVAL_MS
      : 10000;
  const heartbeatInterval =
    Number.isFinite(DEFAULT_HEARTBEAT_MS) && DEFAULT_HEARTBEAT_MS > 0
      ? DEFAULT_HEARTBEAT_MS
      : 20000;

  let keepAliveTimer = null;
  let pollTimer = null;
  let previousVersion = 0;
  let previousTotal = 0;
  let previousSyncTimestamp = 0;
  let previousSyncStatus = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(formatSseEvent('open', { ok: true }));

      const snapshot = await fetchLatestSnapshot();
      previousVersion = snapshot.version || 0;
      previousTotal = snapshot.total || 0;
      previousSyncTimestamp =
        snapshot.syncLog?.timestamp || snapshot.version || 0;
      previousSyncStatus = snapshot.syncLog ? { ...snapshot.syncLog } : null;

      controller.enqueue(
        formatSseEvent('clinics:bootstrap', {
          version: previousVersion,
          total: previousTotal,
          lastSync: snapshot.syncLog,
        })
      );

      keepAliveTimer = setInterval(() => {
        if (closed) return;
        controller.enqueue(formatSseEvent('heartbeat', { t: Date.now() }));
      }, heartbeatInterval);

      const poll = async () => {
        if (closed) {
          return;
        }
        try {
          const latest = await fetchLatestSnapshot();

          const hasNewVersion =
            (latest.version || 0) > (previousVersion || 0);
          const hasCountChanged =
            (latest.total || 0) !== (previousTotal || 0);
          const hasNewSync =
            (latest.syncLog?.timestamp || 0) > (previousSyncTimestamp || 0);
          
          // Check if sync status or progress changed
          const currentSync = latest.syncLog;
          const syncStatusChanged = currentSync && previousSyncStatus && (
            currentSync.status !== previousSyncStatus.status ||
            currentSync.progress_percent !== previousSyncStatus.progress_percent ||
            currentSync.processed_records !== previousSyncStatus.processed_records ||
            currentSync.current_page !== previousSyncStatus.current_page ||
            currentSync.inserted !== previousSyncStatus.inserted ||
            currentSync.updated !== previousSyncStatus.updated ||
            currentSync.failed !== previousSyncStatus.failed
          );
          
          // If sync is in progress, send update more frequently to keep UI responsive
          const isSyncInProgress = currentSync && 
            (currentSync.status === 'started' || currentSync.status === 'in_progress');

          if (hasNewVersion || hasCountChanged || hasNewSync || syncStatusChanged || (isSyncInProgress && !previousSyncStatus)) {
            previousVersion = latest.version || previousVersion;
            previousTotal = latest.total || previousTotal;
            previousSyncTimestamp =
              latest.syncLog?.timestamp || previousSyncTimestamp;
            previousSyncStatus = currentSync ? { ...currentSync } : null;

            controller.enqueue(
              formatSseEvent('clinics:refresh', {
                version: previousVersion,
                total: previousTotal,
                lastSync: latest.syncLog,
              })
            );
          }
        } catch (error) {
          controller.enqueue(
            formatSseEvent('clinics:error', {
              message: error.message,
            })
          );
        }
      };

      await poll();
      pollTimer = setInterval(poll, pollInterval);
    },
    cancel() {
      closed = true;
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (pollTimer) clearInterval(pollTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

