import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import axios from 'axios'

const GAS_URL = import.meta.env.VITE_GAS_URL

const LESSON_LABEL = {
  swing_analysis: 'スイング分析',
  online:         'オンラインレッスン',
  face_monthly:   '対面レッスン',
  tokyo:          '東京レッスン',
}
const LESSON_COLOR = {
  swing_analysis: '#059669',
  online:         '#2563eb',
  face_monthly:   '#7c3aed',
  tokyo:          '#ea580c',
}
const STATUS_LABEL = { pending: '承認待ち', confirmed: '確定済み' }
const STATUS_COLOR = { pending: '#f59e0b', confirmed: '#16a34a' }

export default function MyBookings({ profile, onBack }) {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [canceling, setCanceling]       = useState(null)  // reservationId being canceled
  const [confirm, setConfirm]           = useState(null)  // reservation object to confirm cancel
  const [done, setDone]                 = useState(null)  // canceled reservation label

  useEffect(() => { fetchMyReservations() }, [])

  async function fetchMyReservations() {
    setLoading(true); setError('')
    try {
      const res = await axios.get(GAS_URL, {
        params: { action: 'getMyReservations', userId: profile.userId, _t: Date.now() }
      })
      setReservations(res.data.reservations || [])
    } catch {
      setError('予約の取得に失敗しました。再度お試しください。')
    }
    setLoading(false)
  }

  async function handleCancel(r) {
    setCanceling(r.id); setConfirm(null)
    try {
      const params = new URLSearchParams({
        action:        'cancelReservation',
        reservationId: r.id,
        userId:        profile.userId,
      })
      await axios.post(GAS_URL, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      setDone(LESSON_LABEL[r.lessonType] || r.lessonType)
      setReservations(prev => prev.filter(x => x.id !== r.id))
    } catch {
      setError('キャンセルに失敗しました。再度お試しください。')
    }
    setCanceling(null)
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span style={s.headerTitle}>マイ予約</span>
        <div style={{ width: 28 }} />
      </div>

      <div style={s.body}>
        {/* Done banner */}
        {done && (
          <div style={s.doneBanner}>
            <span style={{ fontSize: 18 }}>✅</span>
            <span>{done} のご予約をキャンセルしました</span>
          </div>
        )}

        {error && <p style={s.errTxt}>{error}</p>}

        {loading ? (
          <div style={s.skelWrap}>
            {[...Array(3)].map((_, i) => <div key={i} style={s.skel} />)}
          </div>
        ) : reservations.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>📅</div>
            <p style={s.emptyTitle}>予約はありません</p>
            <p style={s.emptyDesc}>レッスンを予約するとここに表示されます</p>
          </div>
        ) : (
          reservations.map(r => {
            const color = LESSON_COLOR[r.lessonType] || '#64748b'
            const start = new Date(r.startTime)
            const end   = new Date(r.endTime)
            const isCanceling = canceling === r.id
            return (
              <div key={r.id} style={s.card}>
                {/* Card top: lesson type badge + status */}
                <div style={s.cardTop}>
                  <span style={{ ...s.lessonBadge, background: color + '18', color }}>
                    {LESSON_LABEL[r.lessonType] || r.lessonType}
                  </span>
                  <span style={{ ...s.statusBadge, color: STATUS_COLOR[r.resStatus] || '#64748b' }}>
                    ● {STATUS_LABEL[r.resStatus] || r.resStatus}
                  </span>
                </div>

                {/* Date/time */}
                <div style={s.dateRow}>
                  <span style={s.dateMain}>
                    {format(start, 'M月d日(E)', { locale: ja })}
                  </span>
                  <span style={s.timeMain}>
                    {format(start, 'HH:mm')} 〜 {format(end, 'HH:mm')}
                  </span>
                </div>

                {/* Meet link */}
                {r.meetUrl && (
                  <a href={r.meetUrl} target="_blank" rel="noreferrer" style={s.meetLink}>
                    📹 Google Meet で参加
                  </a>
                )}

                {/* Divider */}
                <div style={s.divider} />

                {/* Cancel button */}
                <button
                  style={{ ...s.cancelBtn, opacity: isCanceling ? 0.6 : 1 }}
                  disabled={isCanceling}
                  onClick={() => setConfirm(r)}
                >
                  {isCanceling ? 'キャンセル処理中...' : 'この予約をキャンセルする'}
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div style={s.overlay} onClick={() => setConfirm(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <p style={s.modalTitle}>予約キャンセルの確認</p>
            <div style={s.modalInfo}>
              <p style={s.modalLesson}>{LESSON_LABEL[confirm.lessonType] || confirm.lessonType}</p>
              <p style={s.modalDate}>
                {format(new Date(confirm.startTime), 'M月d日(E) HH:mm', { locale: ja })} 〜{' '}
                {format(new Date(confirm.endTime), 'HH:mm')}
              </p>
            </div>
            <p style={s.modalNote}>※ キャンセルポリシーをご確認ください</p>
            <div style={s.modalBtns}>
              <button style={s.modalNo}  onClick={() => setConfirm(null)}>戻る</button>
              <button style={s.modalYes} onClick={() => handleCancel(confirm)}>
                キャンセルする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page:   { minHeight: '100vh', background: '#f8fafc' },
  header: { display: 'flex', alignItems: 'center', padding: '12px 16px',
            background: '#fff', borderBottom: '1px solid #f1f5f9', gap: 8 },
  backBtn:{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
            padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#0f172a' },

  body:   { padding: '16px' },

  doneBanner: { display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4',
                border: '1px solid #86efac', borderRadius: 12, padding: '12px 16px',
                marginBottom: 16, fontSize: 14, color: '#15803d', fontWeight: 600 },
  errTxt: { color: '#dc2626', fontSize: 13, marginBottom: 12 },

  skelWrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  skel:     { height: 140, borderRadius: 16, background: '#f1f5f9', animation: 'pulse 1.5s ease infinite' },

  empty:     { textAlign: 'center', padding: '60px 0' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle:{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#334155' },
  emptyDesc: { margin: 0, fontSize: 13, color: '#94a3b8' },

  card:       { background: '#fff', borderRadius: 16, padding: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 12 },
  cardTop:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  lessonBadge:{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 },
  statusBadge:{ fontSize: 12, fontWeight: 600 },
  dateRow:    { marginBottom: 10 },
  dateMain:   { fontSize: 17, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 4 },
  timeMain:   { fontSize: 22, fontWeight: 800, color: '#16a34a', letterSpacing: -0.5 },
  meetLink:   { display: 'inline-block', marginTop: 10, fontSize: 13, fontWeight: 600,
                color: '#2563eb', textDecoration: 'none',
                background: '#eff6ff', padding: '6px 14px', borderRadius: 8 },
  divider:    { height: 1, background: '#f1f5f9', margin: '14px 0' },
  cancelBtn:  { width: '100%', padding: '11px 0', background: 'none',
                border: '1.5px solid #fca5a5', borderRadius: 10,
                color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100,
             display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modal:   { background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px',
             width: '100%', maxWidth: 480 },
  modalTitle: { margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0f172a', textAlign: 'center' },
  modalInfo:  { background: '#f8fafc', borderRadius: 12, padding: '14px 16px', marginBottom: 12 },
  modalLesson:{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#475569' },
  modalDate:  { margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' },
  modalNote:  { margin: '0 0 20px', fontSize: 12, color: '#94a3b8', textAlign: 'center' },
  modalBtns:  { display: 'flex', gap: 10 },
  modalNo:    { flex: 1, padding: '13px 0', background: '#f1f5f9', border: 'none',
                borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#475569', cursor: 'pointer' },
  modalYes:   { flex: 1, padding: '13px 0', background: '#dc2626', border: 'none',
                borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' },
}
