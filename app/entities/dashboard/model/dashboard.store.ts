import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type EventType = 'fire' | 'smoke'
export type EventStatus = 'new' | 'investigating' | 'acknowledged'
export type CameraHealth = 'online' | 'offline'
export type CameraStatus = 'normal' | 'fire' | 'smoke'
export type SensorKind = 'temperature' | 'smoke' | 'co'
export type ServerStatus = 'connected' | 'degraded' | 'reconnecting'

export interface MetricTrend {
  direction: 'up' | 'down'
  value: string
  context: string
}

export interface DashboardMetric {
  id: string
  label: string
  value: string
  icon: string
  tone: 'neutral' | 'fire' | 'smoke' | 'warning' | 'safe'
  trend: MetricTrend
  detail?: string
}

export interface DetectionEvent {
  id: string
  timestamp: string
  type: EventType
  cameraName: string
  status: EventStatus
  confidence: number
}

export interface CameraFeed {
  id: string
  name: string
  location: string
  health: CameraHealth
  status: CameraStatus
  temperature: number
  smokeDensity: number
  lastEventAt: string | null
}

export interface SensorReading {
  id: string
  name: string
  kind: SensorKind
  unit: string
  value: number
  threshold: number
  updatedAt: string
}

export interface DetectionPoint {
  hour: string
  count: number
}

const CAMERA_CATALOG: Array<Omit<CameraFeed, 'status' | 'temperature' | 'smokeDensity' | 'lastEventAt'>> = [
  { id: 'cam-01', name: 'Камера A-12', location: 'Склад ЛВЖ', health: 'online' },
  { id: 'cam-02', name: 'Камера B-03', location: 'Линия упаковки', health: 'online' },
  { id: 'cam-03', name: 'Камера C-07', location: 'Электрощитовая', health: 'online' },
  { id: 'cam-04', name: 'Камера D-19', location: 'Погрузочная зона', health: 'online' },
  { id: 'cam-05', name: 'Камера E-04', location: 'Транспортный шлюз', health: 'online' },
  { id: 'cam-06', name: 'Камера F-08', location: 'Склад тары', health: 'offline' }
]

const SENSOR_SEED: SensorReading[] = [
  { id: 'sensor-01', name: 'Температурный контур 01', kind: 'temperature', unit: '°C', value: 38.2, threshold: 58, updatedAt: isoMinutesAgo(2) },
  { id: 'sensor-02', name: 'SmokeSense 14', kind: 'smoke', unit: 'ppm', value: 14, threshold: 40, updatedAt: isoMinutesAgo(1) },
  { id: 'sensor-03', name: 'CO Guard 08', kind: 'co', unit: 'ppm', value: 7, threshold: 35, updatedAt: isoMinutesAgo(3) },
  { id: 'sensor-04', name: 'Температурный контур 05', kind: 'temperature', unit: '°C', value: 42.7, threshold: 60, updatedAt: isoMinutesAgo(1) },
  { id: 'sensor-05', name: 'SmokeSense 03', kind: 'smoke', unit: 'ppm', value: 18, threshold: 45, updatedAt: isoMinutesAgo(4) },
  { id: 'sensor-06', name: 'CO Guard 11', kind: 'co', unit: 'ppm', value: 9, threshold: 35, updatedAt: isoMinutesAgo(2) }
]

const DETECTION_SERIES_SEED = [1, 0, 1, 1, 2, 1, 0, 1, 2, 2, 4, 5, 3, 2, 2, 6, 4, 3, 2, 5, 4, 3, 2, 1]

const INITIAL_EVENTS: DetectionEvent[] = [
  buildEvent('evt-1001', 4, 'smoke', 'Камера B-03', 'investigating', 0.78),
  buildEvent('evt-1002', 7, 'fire', 'Камера A-12', 'new', 0.96),
  buildEvent('evt-1003', 9, 'smoke', 'Камера D-19', 'acknowledged', 0.73),
  buildEvent('evt-1004', 12, 'smoke', 'Камера E-04', 'investigating', 0.81),
  buildEvent('evt-1005', 16, 'fire', 'Камера C-07', 'new', 0.91),
  buildEvent('evt-1006', 19, 'smoke', 'Камера A-12', 'acknowledged', 0.69),
  buildEvent('evt-1007', 24, 'fire', 'Камера D-19', 'investigating', 0.88),
  buildEvent('evt-1008', 29, 'smoke', 'Камера B-03', 'new', 0.84),
  buildEvent('evt-1009', 34, 'smoke', 'Камера C-07', 'acknowledged', 0.67),
  buildEvent('evt-1010', 41, 'fire', 'Камера E-04', 'investigating', 0.93),
  buildEvent('evt-1011', 52, 'smoke', 'Камера A-12', 'acknowledged', 0.7),
  buildEvent('evt-1012', 61, 'fire', 'Камера D-19', 'acknowledged', 0.9)
]

export const useDashboardStore = defineStore('dashboard', () => {
  const isLoading = ref(true)
  const connectionStatus = ref<ServerStatus>('connected')
  const cameras = ref<CameraFeed[]>(buildInitialCameras())
  const events = ref<DetectionEvent[]>(INITIAL_EVENTS)
  const sensors = ref<SensorReading[]>(SENSOR_SEED)
  const detectionSeries = ref<DetectionPoint[]>(buildDetectionSeries())
  const eventCounter = ref(1012)
  const initialized = ref(false)

  let loadingTimer: ReturnType<typeof setTimeout> | null = null
  let eventTimer: ReturnType<typeof setInterval> | null = null
  let sensorTimer: ReturnType<typeof setInterval> | null = null
  let connectionTimer: ReturnType<typeof setInterval> | null = null

  const activeCamerasOnline = computed(() => cameras.value.filter((camera) => camera.health === 'online').length)
  const activeSensors = computed(() => sensors.value.length)
  const fireToday = computed(() => events.value.filter((event) => event.type === 'fire').length)
  const smokeToday = computed(() => events.value.filter((event) => event.type === 'smoke').length)
  const unprocessedAlerts = computed(() => events.value.filter((event) => event.status !== 'acknowledged').length)
  const systemUptime = computed(() => {
    if (connectionStatus.value === 'connected') return 99.82
    if (connectionStatus.value === 'degraded') return 98.96
    return 97.41
  })

  const latestEvents = computed(() => events.value.filter((event) => event.type === 'fire').slice(0, 5))
  const activeAlertFeeds = computed(() => cameras.value.filter((camera) => camera.status === 'fire' && camera.health === 'online'))
  const visibleFeeds = computed(() => {
    const prioritized = [...activeAlertFeeds.value]
    const normalOnline = cameras.value.filter((camera) => camera.status === 'normal' && camera.health === 'online')

    for (const camera of normalOnline) {
      if (prioritized.length >= 6) break
      prioritized.push(camera)
    }

    return prioritized.slice(0, 6)
  })

  const metrics = computed<DashboardMetric[]>(() => [
    {
      id: 'online-cameras',
      label: 'Камеры онлайн',
      value: `${activeCamerasOnline.value}/${cameras.value.length}`,
      icon: 'i-lucide-cctv',
      tone: 'safe',
      trend: { direction: 'up', value: '+1', context: 'к прошлой смене' },
      detail: 'Потоки доступны и синхронизированы'
    },
    {
      id: 'unprocessed-alerts',
      label: 'Необработанные тревоги',
      value: String(unprocessedAlerts.value),
      icon: 'i-lucide-bell-ring',
      tone: unprocessedAlerts.value > 4 ? 'fire' : 'warning',
      trend: { direction: unprocessedAlerts.value > 3 ? 'up' : 'down', value: unprocessedAlerts.value > 3 ? '+2' : '-1', context: 'за 30 минут' },
      detail: 'Требуют подтверждения оператором'
    },
    {
      id: 'events-today',
      label: 'События за сегодня',
      value: `${events.value.length}`,
      icon: 'i-lucide-flame',
      tone: 'smoke',
      trend: { direction: 'up', value: `${fireToday.value} огонь / ${smokeToday.value} дым`, context: 'структура потока' },
      detail: 'Детекции подтверждены CNN'
    },
    {
      id: 'uptime',
      label: 'Аптайм за 24 часа',
      value: `${systemUptime.value.toFixed(2)}%`,
      icon: 'i-lucide-server-cog',
      tone: 'safe',
      trend: { direction: 'up', value: '+0.14%', context: 'к вчерашнему периоду' },
      detail: connectionStatus.value === 'connected' ? 'Связь стабильна' : 'Есть деградация канала'
    },
    {
      id: 'sensors',
      label: 'Активные датчики',
      value: `${activeSensors.value}`,
      icon: 'i-lucide-activity',
      tone: 'neutral',
      trend: { direction: 'up', value: '+3', context: 'после техобслуживания' },
      detail: 'Температура, дым и CO'
    }
  ])

  function initialize() {
    if (initialized.value) return

    initialized.value = true
    isLoading.value = true

    loadingTimer = setTimeout(() => {
      isLoading.value = false
    }, 1200)

    eventTimer = setInterval(() => {
      pushNextEvent()
    }, 9000)

    sensorTimer = setInterval(() => {
      updateSensors()
    }, 5000)

    connectionTimer = setInterval(() => {
      rotateConnectionStatus()
    }, 18000)
  }

  function dispose() {
    if (loadingTimer) clearTimeout(loadingTimer)
    if (eventTimer) clearInterval(eventTimer)
    if (sensorTimer) clearInterval(sensorTimer)
    if (connectionTimer) clearInterval(connectionTimer)

    loadingTimer = null
    eventTimer = null
    sensorTimer = null
    connectionTimer = null
    initialized.value = false
  }

  function pushNextEvent() {
    const sourceCamera = cameras.value.find((camera) => camera.health === 'online') ?? cameras.value[0]
    const nextType: EventType = Math.random() > 0.55 ? 'smoke' : 'fire'
    const nextStatus: EventStatus = nextType === 'fire' ? 'new' : Math.random() > 0.5 ? 'investigating' : 'new'

    eventCounter.value += 1

    const event = buildEvent(
      `evt-${eventCounter.value}`,
      0,
      nextType,
      sourceCamera.name,
      nextStatus,
      Number((0.72 + Math.random() * 0.26).toFixed(2))
    )

    events.value = [event, ...events.value]

    cameras.value = cameras.value.map((camera) => {
      if (camera.id !== sourceCamera.id) {
        if (camera.status !== 'normal' && Math.random() > 0.45) {
          return { ...camera, status: 'normal' }
        }

        return camera
      }

      return {
        ...camera,
        status: nextType,
        temperature: Number((camera.temperature + (nextType === 'fire' ? 6 : 2.4)).toFixed(1)),
        smokeDensity: Number((camera.smokeDensity + (nextType === 'smoke' ? 9 : 4)).toFixed(1)),
        lastEventAt: event.timestamp
      }
    })

    detectionSeries.value = [...detectionSeries.value.slice(1), {
      hour: detectionSeries.value[detectionSeries.value.length - 1]?.hour ?? currentHourLabel(),
      count: Math.min(9, Math.max(0, detectionSeries.value[detectionSeries.value.length - 1]?.count ?? 0) + (nextType === 'fire' ? 2 : 1))
    }].map((point, index, source) => {
      const hoursBack = source.length - 1 - index
      return {
        hour: hourLabel(hoursBack),
        count: point.count
      }
    })
  }

  function updateSensors() {
    const now = new Date().toISOString()

    sensors.value = sensors.value.map((sensor, index) => {
      const modifier = Math.sin(Date.now() / 6000 + index) * 0.9
      const nextValue = buildSensorValue(sensor, modifier)

      return {
        ...sensor,
        value: nextValue,
        updatedAt: now
      }
    })
  }

  function rotateConnectionStatus() {
    const phase = Math.floor(Date.now() / 18000) % 6
    connectionStatus.value = phase === 3 ? 'degraded' : phase === 5 ? 'reconnecting' : 'connected'
  }

  return {
    activeAlertFeeds,
    cameras,
    connectionStatus,
    detectionSeries,
    dispose,
    events,
    fireToday,
    initialize,
    isLoading,
    latestEvents,
    metrics,
    sensors,
    smokeToday,
    systemUptime,
    unprocessedAlerts,
    visibleFeeds
  }
})

function buildInitialCameras(): CameraFeed[] {
  return CAMERA_CATALOG.map((camera, index) => ({
    ...camera,
    status: index === 0 ? 'fire' : index % 3 === 0 ? 'smoke' : 'normal',
    temperature: 34 + index * 2.7,
    smokeDensity: 8 + index * 1.5,
    lastEventAt: index < 4 ? isoMinutesAgo(7 + index * 5) : null
  }))
}

function buildDetectionSeries(): DetectionPoint[] {
  return DETECTION_SERIES_SEED.map((count, index, source) => ({
    hour: hourLabel(source.length - 1 - index),
    count
  }))
}

function buildEvent(
  id: string,
  minutesAgo: number,
  type: EventType,
  cameraName: string,
  status: EventStatus,
  confidence: number
): DetectionEvent {
  return {
    id,
    timestamp: isoMinutesAgo(minutesAgo),
    type,
    cameraName,
    status,
    confidence
  }
}

function buildSensorValue(sensor: SensorReading, modifier: number): number {
  if (sensor.kind === 'temperature') return Number((sensor.value + modifier).toFixed(1))
  if (sensor.kind === 'smoke') return Number(Math.max(0, sensor.value + modifier * 2.8).toFixed(0))
  return Number(Math.max(0, sensor.value + modifier * 1.6).toFixed(0))
}

function isoMinutesAgo(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString()
}

function hourLabel(hoursBack: number): string {
  const date = new Date(Date.now() - hoursBack * 3_600_000)
  return `${String(date.getHours()).padStart(2, '0')}:00`
}

function currentHourLabel(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:00`
}
