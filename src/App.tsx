import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppBackground } from './components/layout/AppBackground'
import { BottomNav } from './components/layout/BottomNav'
import { WeekPage } from './pages/WeekPage'
import { ExercisesPage } from './pages/ExercisesPage'
import { RoutinesPage } from './pages/RoutinesPage'
import { RoutineEditPage } from './pages/RoutineEditPage'
import { SessionLogPage } from './pages/SessionLogPage'
import { SettingsPage } from './pages/SettingsPage'
import { useGcalAutoSync } from './hooks/useGcalSync'

// Recharts es la librería más pesada: solo se descarga al abrir Estadísticas.
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })))

export function App() {
  // Sincroniza con Google Calendar en segundo plano mientras la app está abierta (si está conectada).
  useGcalAutoSync()

  return (
    <HashRouter>
      <AppBackground />
      <div className="min-h-screen pb-20">
        <Routes>
          <Route path="/" element={<WeekPage />} />
          <Route path="/ejercicios" element={<ExercisesPage />} />
          <Route path="/rutinas" element={<RoutinesPage />} />
          <Route path="/rutinas/:id" element={<RoutineEditPage />} />
          <Route path="/sesion/:id" element={<SessionLogPage />} />
          <Route
            path="/estadisticas"
            element={
              <Suspense fallback={<div className="p-6 text-center text-white/50">Cargando estadísticas…</div>}>
                <StatsPage />
              </Suspense>
            }
          />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Routes>
      </div>
      <BottomNav />
    </HashRouter>
  )
}
