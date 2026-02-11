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
        const eventsToSend = [...this.queue];
        const eventsRemaining: FunnelEvent[] = [];

        // Prepare payloads for all events
        const payloads = eventsToSend.map(event => ({
            session_id: event.session_id,
            step_reached: event.step_reached,
            partner_id: event.partner_id,
            language: event.language,
            event_type: event.event_type,
            client_timestamp: event.timestamp
        }));

        try {
            // DRY-RUN PROTECTION for DEV mode
            if (import.meta.env.DEV) {
                console.log('%c[DEV MODE] Analytics Dry-Run Intercepted', 'background: #000; color: #00ff00; font-weight: bold; padding: 4px;');
                console.table(payloads);
                console.log('[DEV MODE] Funnel event intercepted. Data not sent to database.');

                // Clear the queue as if it was sent successfully
                this.queue = [];
                this.saveQueue();
                this.isFlushing = false;
                return;
            }

            // TRY BATCH INSERT FIRST (80% network reduction)
            console.log(`[Analytics] Attempting batch insert of ${payloads.length} events`);
            const { error: batchError } = await supabase.from('funnel_events').insert(payloads);

            if (batchError) {
                // Batch failed - log the error and fall back to individual inserts
                console.warn('[Analytics] Batch insert failed, falling back to individual inserts:', batchError);

                // FALLBACK: Send each event individually to prevent data loss
                for (const event of eventsToSend) {
                    try {
                        const { error: individualError } = await supabase.from('funnel_events').insert({
                            session_id: event.session_id,
                            step_reached: event.step_reached,
                            partner_id: event.partner_id,
                            language: event.language,
                            // Try to send new fields, but if they don't exist in DB, they'll be ignored
                            event_type: event.event_type,
                            client_timestamp: event.timestamp
                        });

                        if (individualError) {
                            console.error('[Analytics] Individual insert failed for event:', event.id, individualError);
                            // Retry logic
                            if (event.retry_count < MAX_RETRIES) {
                                eventsRemaining.push({ ...event, retry_count: event.retry_count + 1 });
                            } else {
                                console.error('[Analytics] Max retries reached for event:', event.id);
                            }
                        } else {
                            console.log('[Analytics] Individual event sent successfully:', event.id);
                        }
                    } catch (err) {
                        console.error('[Analytics] Exception during individual insert:', err);
                        if (event.retry_count < MAX_RETRIES) {
                            eventsRemaining.push({ ...event, retry_count: event.retry_count + 1 });
                        }
                    }
                }
            } else {
                // Batch succeeded - all events sent
                console.log(`[Analytics] Batch insert successful: ${payloads.length} events sent`);
            }
        } catch (err) {
            // Network or other catastrophic error - retry all events
            console.error('[Analytics] Batch operation exception, requeueing all events:', err);
            for (const event of eventsToSend) {
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
