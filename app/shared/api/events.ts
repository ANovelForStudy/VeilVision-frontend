import type { DetectionEvent, EventStatus } from "~/entities/event/model/types";
import { resolveUiEventType } from "~/entities/event/model/types";
import { apiRequest } from "~/shared/api/http";

interface EventRecord {
    id?: string | number;
    created_at?: string;
    camera_id?: string | number;
    event_type?: string;
    type?: string;
    status?: string;
    confidence?: number;
    storage_filename?: string;
    image_url?: string;
    frame_url?: string;
}

/**
 * Получить список всех событий (Read-Only)
 */
export async function fetchEvents(): Promise<DetectionEvent[]> {
    const response = await apiRequest<
        EventRecord[] | { items?: EventRecord[]; results?: EventRecord[] }
    >("/events/");
    const items = Array.isArray(response) ? response : response.items ?? response.results ?? [];
    return items.map(normalizeEvent);
}

/**
 * Получить конкретное событие по ID
 */
export async function fetchEventById(id: string | number): Promise<DetectionEvent> {
    try {
        const response = await apiRequest<EventRecord>(`/events/${id}/`);
        return normalizeEvent(response);
    } catch {
        try {
            const response = await apiRequest<EventRecord>(`/events/${id}`);
            return normalizeEvent(response);
        } catch {
            const events = await fetchEvents();
            const matchedEvent = events.find((event) => String(event.id) === String(id));

            if (!matchedEvent) {
                throw new Error("Событие не найдено.");
            }

            return matchedEvent;
        }
    }
}

function normalizeEvent(event: EventRecord): DetectionEvent {
    const eventType = (event.event_type ?? event.type ?? "unknown").trim();
    const imageUrl = event.image_url ?? event.frame_url ?? null;

    return {
        id: event.id !== undefined ? String(event.id) : crypto.randomUUID(),
        created_at: event.created_at ?? new Date().toISOString(),
        camera_id: event.camera_id ? String(event.camera_id) : "",
        event_type: eventType,
        type: resolveUiEventType(eventType),
        status: normalizeStatus(event.status),
        confidence: event.confidence ?? 0,
        image_url: imageUrl,
        storage_filename: event.storage_filename ?? null,
    };
}

function normalizeStatus(status?: string): EventStatus {
    if (status === "investigating" || status === "acknowledged" || status === "new") {
        return status;
    }

    return "new";
}
