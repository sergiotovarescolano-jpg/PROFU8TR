import { useState } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'
import { useGcalConfig, useGcalSyncStatus } from '../../hooks/useGcalSync'
import { revokeAccess } from '../../utils/gcal/auth'
import { saveConfig, type SyncSummary } from '../../utils/gcal/state'
import { runSync } from '../../utils/gcal/sync'

const CLIENT_ID_PATTERN = /^[\w-]+\.apps\.googleusercontent\.com$/

function describeSummary(s: SyncSummary): string {
  const parts = [
    s.created && `${s.created} creados`,
    s.updated && `${s.updated} actualizados`,
    s.deleted && `${s.deleted} borrados`,
    s.imported && `${s.imported} traídos de Google`,
    s.removed && `${s.removed} quitados en la app`,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Todo estaba al día'
}

export function GoogleCalendarSection() {
  const config = useGcalConfig()
  const status = useGcalSyncStatus()
  const [clientId, setClientId] = useState(config.clientId)
  const [editingId, setEditingId] = useState(!config.clientId)
  const [copied, setCopied] = useState(false)
  const origin = location.origin

  async function copyOrigin() {
    try {
      await navigator.clipboard.writeText(origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // sin portapapeles: el origen queda visible para copiarlo a mano
    }
  }

  function saveClientId() {
    saveConfig({ clientId: clientId.trim() })
    setEditingId(false)
  }

  const connect = () => runSync({ interactive: true }).catch(() => {})

  async function disconnect() {
    await revokeAccess()
    saveConfig({ enabled: false })
  }

  if (editingId) {
    const valid = CLIENT_ID_PATTERN.test(clientId.trim())
    return (
      <div>
        <p className="mb-3 text-sm text-white/65">
          Tus entrenos y partidos aparecerán en un calendario propio, «Fútbol Planner», y lo que muevas allí se refleja aquí. Necesita
          un Client ID gratuito de Google Cloud: los pasos están en el README, sección «Google Calendar».
        </p>
        <div className="mb-3 rounded-xl border border-neon-400/25 bg-black/25 p-3">
          <p className="field-label !mb-0">Origen a autorizar en Google</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-sm text-white">{origin}</code>
            <button
              type="button"
              onClick={copyOrigin}
              className="font-hud shrink-0 rounded-lg border border-neon-400/40 px-3 py-1.5 text-sm font-bold text-neon-200 uppercase active:scale-95"
            >
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        <Input
          label="Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="123…apps.googleusercontent.com"
          autoComplete="off"
          spellCheck={false}
        />
        {clientId.trim() && !valid && <p className="-mt-2 mb-3 text-xs text-[#ffa094]">Debe terminar en «.apps.googleusercontent.com».</p>}
        <div className="flex gap-2">
          {config.clientId && (
            <Button variant="secondary" fullWidth onClick={() => setEditingId(false)}>
              Cancelar
            </Button>
          )}
          <Button fullWidth disabled={!valid} onClick={saveClientId}>
            Guardar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {config.enabled ? (
        <div className="mb-3 flex items-start gap-3 rounded-xl border border-pitch-400/35 bg-pitch-500/10 px-3 py-2.5">
          <span className="mt-0.5 text-lg" aria-hidden="true">
            {status.running ? '🔄' : '✅'}
          </span>
          <div className="min-w-0">
            <p className="font-hud text-lg leading-tight font-bold text-white uppercase">
              {status.running ? 'Sincronizando…' : 'Conectado'}
            </p>
            {config.lastSyncAt && (
              <p className="text-xs text-white/60">
                Última vez {formatDistanceToNow(parseISO(config.lastSyncAt), { locale: es, addSuffix: true })}
                {config.lastSummary && ` · ${describeSummary(config.lastSummary)}`}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm text-white/65">
          Conecta tu cuenta de Google. Se creará el calendario «Fútbol Planner» (la app solo puede tocar ese calendario).
        </p>
      )}

      {status.error && (
        <p role="alert" className="mb-3 rounded-xl border border-[#ff4b3e]/40 bg-[#ff4b3e]/10 px-3 py-2 text-sm text-[#ffc4bc]">
          ⚠️ {status.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button fullWidth onClick={connect} disabled={status.running}>
          {!config.enabled ? 'Conectar con Google' : status.needsReconnect ? 'Reconectar y sincronizar' : 'Sincronizar ahora'}
        </Button>
        {config.enabled && (
          <Button variant="secondary" fullWidth onClick={disconnect} disabled={status.running}>
            Desconectar
          </Button>
        )}
        <button
          type="button"
          onClick={() => setEditingId(true)}
          className="min-h-10 text-sm font-medium text-neon-300 active:text-neon-200"
        >
          Cambiar Client ID
        </button>
      </div>

      {config.enabled && (
        <p className="mt-2 text-xs text-white/45">
          Se sincroniza solo mientras la app está abierta. Google pide reconectar cada hora aprox. Al desconectar, el calendario sigue en
          Google: puedes ocultarlo o borrarlo desde allí.
        </p>
      )}
    </div>
  )
}
