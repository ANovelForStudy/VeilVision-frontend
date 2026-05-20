export type EventType = 'fire' | 'smoke' | 'other';
export type EventStatus = 'new' | 'investigating' | 'acknowledged';

export interface DetectionEvent {
    id: string;
    created_at: string;
    camera_id: string;
    event_type: string;
    type: EventType;
    status: EventStatus;
    confidence: number;
    image_url: string | null;
    storage_filename: string | null;
}

export interface EventCard {
    id: string;
    timestamp: string;
    cameraName: string;
    cameraLocation: string;
    eventType: string;
    type: EventType;
    status: EventStatus;
    confidence: number;
    imageUrl: string | null;
    storageFilename: string | null;
}

export function resolveUiEventType(eventType: string): EventType {
    const normalized = eventType.trim().toLowerCase();

    if (normalized.includes('smoke') || normalized.includes('дым')) {
        return 'smoke';
    }

    if (
        normalized.includes('fire') ||
        normalized.includes('огонь') ||
        normalized.includes('пожар') ||
        normalized.includes('flame')
    ) {
        return 'fire';
    }

    return 'other';
}

export function formatEventTypeLabel(eventType: string) {
    const trimmed = eventType.trim();
    return trimmed.length > 0 ? trimmed : 'Неизвестный тип';
}
