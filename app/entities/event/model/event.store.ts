import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchEventById, fetchEvents } from '@/shared/api/events';
import type { DetectionEvent } from './types';

export const useEventStore = defineStore('event', () => {
    const events = ref<DetectionEvent[]>([]);
    const currentEvent = ref<DetectionEvent | null>(null);
    const isLoading = ref(false);
    const isLoadingCurrent = ref(false);
    const error = ref<string | null>(null);

    async function loadEvents() {
        isLoading.value = true;
        error.value = null;

        try {
            events.value = await fetchEvents();
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Ошибка при загрузке журнала событий';
            console.error('[EventStore] Нажмите F12 чтобы увидеть детали:', err);
        } finally {
            isLoading.value = false;
        }
    }

    async function loadEventById(id: string) {
        isLoadingCurrent.value = true;
        error.value = null;

        try {
            currentEvent.value = await fetchEventById(id);
        } catch (err: unknown) {
            currentEvent.value = null;
            error.value = err instanceof Error ? err.message : 'Ошибка при загрузке события';
            console.error('[EventStore] Нажмите F12 чтобы увидеть детали:', err);
        } finally {
            isLoadingCurrent.value = false;
        }
    }

    function clearEvents() {
        events.value = [];
        currentEvent.value = null;
        error.value = null;
    }

    return {
        events,
        currentEvent,
        isLoading,
        isLoadingCurrent,
        error,
        loadEvents,
        loadEventById,
        clearEvents,
    };
});
