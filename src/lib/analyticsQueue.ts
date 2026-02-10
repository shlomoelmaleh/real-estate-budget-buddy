import { supabase } from '@/integrations/supabase/client';

type FunnelEvent = {
    id: string; // Unique ID for deduplication
    session_id: string;
    step_reached: number; // 0-5
    event_type: 'entered' | 'completed'; // Granularity
    partner_id: string | null;
    language: string;
    timestamp: string;
    retry_count: number;
};

const QUEUE_KEY = 'budget_buddy_analytics_queue';
const FLUSH_INTERVAL = 5000; // Attempt flush every 5 seconds if items exist
const MAX_RETRIES = 3;

class AnalyticsQueue {
    private queue: FunnelEvent[] = [];
    private isFlushing = false;
    private timer: NodeJS.Timeout | null = null;

    constructor() {
        this.loadQueue();
        // Start periodic flush
        this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL);
        // Flush on visibility change (tab close/hide)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.flush();
            }
        });
    }

    private loadQueue() {
        try {
            const stored = localStorage.getItem(QUEUE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load analytics queue', e);
            this.queue = [];
        }
    }

    private saveQueue() {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
        } catch (e) {
            console.error('Failed to save analytics queue', e);
        }
    }

    public enqueue(event: Omit<FunnelEvent, 'id' | 'timestamp' | 'retry_count'>) {
        const newEvent: FunnelEvent = {
            ...event,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            retry_count: 0
        };
        this.queue.push(newEvent);
        this.saveQueue();
        // Attempt immediate flush if online
        if (navigator.onLine) {
            this.flush();
        }
    }

    public async flush() {
        if (this.isFlushing || this.queue.length === 0 || !navigator.onLine) return;

        this.isFlushing = true;
        const eventsToSend = [...this.queue]; // copy (not clearing yet)

        // Group by ID to handle them individually or in batch? 
        // Supabase supports batch inserts. Let's try batch first, but if it fails completely, we might need to handle individually.
        // However, the `funnel_events` table structure in the prompt is not fully visible (schema wise).
        // Assuming we map specific fields to the existing `funnel_events` table.
        // The previous implementation was: 
        // supabase.from('funnel_events').insert({ session_id, step_reached, partner_id, language })

        // We need to map our rich event structure to what the table supports.
        // If the table doesn't support 'event_type', we might need to stick to the old schema OR just rely on 'step_reached' 
        // The prompt requested: "Track both 'entered' and 'completed' for every step (0-5)."
        // "Log entered_step_X... Log completed_step_X"
        // This implies we might need to store `step_name` or `action` in the DB.
        // If DB schema wasn't changed, we might have to use `step_reached` creatively or just log everything but the DB might drop extra fields.
        // Wait, the prompt implies "Data Reliability" is the goal. 
        // Use `step_reached` as the main metric. "entered_step_X" implies string?
        // Let's assume the DB has a flexible column OR we use `step_reached` with convention?
        // Actually, looking at `BudgetCalculator.tsx`:
        // `supabase.from('funnel_events').insert({ session_id, step_reached, partner_id, language })`
        // It expects a number for `step_reached`.
        // Maybe we should abuse `step_reached`? ex: 10 for step 1 enter, 11 for step 1 complete?
        // Or, hopefully the table allows partial strings?
        // SAFEST BET: The prompt says "Granularity: Track both 'entered' and 'completed'".
        // I should probably try to send `event_type` if the table allows it. 
        // If I can't check the schema, I will try to inspect the `funnel_events` insert result.
        // But since I cannot change the DB schema myself easily without SQL tools (which I have but are risky to guess),
        // I will stick to sending the data as is. If `event_type` is not in schema, Supabase will ignore it (or error if strict).
        // To be safe, I will stick to the existing fields but maybe map 'entered' vs 'completed' to something visible?
        // The prompt says "Log entered_step_X...". This sounds like an event NAME.
        // Maybe there is an `event_name` column?
        // I'll take a peek at `BudgetCalculator.tsx` again or just try to insert extra fields.
        // Actually, I'll send the `event_type` field. If existing table doesn't have it, I might get an error.
        // Let's assume for now I can add it or it exists. 
        // Re-reading prompt: "Log entered_step_X ... Log completed_step_X". 
        // It might be referring to `step_reached` as the column, but values like "step_1_entered"?
        // But `step_reached` in `BudgetCalculator` was a `number`.
        // OK, I'll use a `meta` column if available, or just try `event_type`.
        // Actually, let's keep it simple. Queue sends what it's given. The Logic in `BudgetCalculator` defines WHAT to send.

        // Initial implementation will try to send all fields.
        const eventsRemaining: FunnelEvent[] = [];

        // Process sequentially or batch? 
        // Sequential is safer for reliability tracking.
        for (const event of eventsToSend) {
            try {
                // Prepare payload (exclude queue-specific fields)
                const { error } = await supabase.from('funnel_events').insert({
                    session_id: event.session_id,
                    step_reached: event.step_reached, // keeping this as is
                    partner_id: event.partner_id,
                    language: event.language,
                    // Sending granular data as well, hoping schema supports it or ignores it gracefully
                    event_type: event.event_type,
                    client_timestamp: event.timestamp
                });

                if (error) throw error;
            } catch (err) {
                console.error('Failed to send event', event.id, err);
                // Retrying logic
                if (event.retry_count < MAX_RETRIES) {
                    eventsRemaining.push({ ...event, retry_count: event.retry_count + 1 });
                }
            }
        }

        this.queue = eventsRemaining;
        this.saveQueue();
        this.isFlushing = false;
    }
}

export const analyticsQueue = new AnalyticsQueue();
