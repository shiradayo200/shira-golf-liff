import { useState, useEffect } from 'react'
import {
  format, addDays, addWeeks, subWeeks,
  startOfWeek, isBefore, isAfter, startOfToday
} from 'date-fns'
import { ja } from 'date-fns/locale'
import axios from 'axios'
import { LESSON_DURATION } from '../utils/slotEngine'

const GAS_URL = import.meta.env.VITE_GAS_URL

const LESSON_META = {
  swing_analysis: { label: 'スイング分析兼レッスン説明会' },
  online:         { label: 'オンラインレッスン' },
  face_monthly:   { label: '対面レッスン（月額）' },
  tokyo:          { label: '東京レッスン（単発）' },
}

const LOCATION_OPTIONS = {
  face_monthly: [
    { code: 'L1', name: '泉北GC' },
    { code: 'L2', name: '上ヶ原GC' },
    { code: 'L3', name: '阪神GC' },
    { code: 'L4', name: 'マイゴル天王寺' },
  ],
  tokyo:          [{ code: 'L5',     name: 'マイゴル赤坂1ST' }],
  online:         [{ code: 'ONLINE', name: 'オンライン（Google Meet）' }],
  swing_analysis: [{ code: 'ONLINE', name: 'オンライン（Google Meet）' }],
}

const HR_START = 8   // 8:00 から表示
const HR_END   = 20  // 20:00 まで表示
const HR_PX    = 56  // 1時間あたりのピクセル高

function groupSlots(slots) {
  if (!slots.length) return []
  const sorted = [...slots].sort((a, b) => new Date(a.start) - new Date(b.start))
  const groups = []
  let group = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const gap = (new Date(sorted[i].start) - new Date(sorted[i - 1].start)) / 60000
    if (gap <= 15) group.push(sorted[i])
    else { groups.push(group); group = [sorted[i]] }
  }
  groups.push(group)
  return groups
}

export default function Calendar({ profile, lessonType, onBook, onBack }) {
  const today   = startOfToday()
  const minDate = addDays(today, 1)
  const maxDate = addDays(today, 30)

  const meta = LESSON_META[lessonType] || { label: lessonType }
  const dur  = LESSON_DURATION[lessonType] ?? 60
  const locs = LOCATION_OPTIONS[lessonType] || []

  const [weekMon, setWeekMon] = useState(() => startOfWeek(today, { weekStartsOn: 1 }))
  const [loc, setLoc]         = useState(locs.length === 1 ? locs[0].code : null)
  const [slots, setSlots]     = useState({})
  const [loading, setLoading] = useState(false)

  const days = Array.from({ length: 5 }, (_, i) => addDays(weekMon, i))

  const canPrev = !isBefore(addDays(subWeeks(weekMon, 1), 4), minDate)
  const canNext = !isAfter(addWeeks(weekMon, 1), maxDate)

  useEffect(() => {
    if (!loc) return
    fetchWeek(weekMon)
  }, [weekMon, loc])

  async function fetchWeek(mon) {
    setLoading(true)
    setSlots({})
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(mon, i))
    try {
      const r = await axios.get(GAS_URL, { params: {
        action: 'getWeekSlots', weekStart: format(mon, 'yyyy-MM-dd'),
        lessonType, location: loc, userId: profile.userId, _t: Date.now()
      }})
      const byDate = r.data.slotsByDate || {}
      const res = {}
      weekDays.forEach(d => {
        const ds = format(d, 'yyyy-MM-dd')
        res[ds] = (isBefore(d, minDate) || isAfter(d, maxDate)) ? [] : (byDate[ds] || [])
      })
      setSlots(res)
    } catch {
      const res = {}
      weekDays.forEach(d => { res[format(d, 'yyyy-MM-dd')] = [] })
      setSlots(res)
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      {/* 戻るボタン */}
      <div style={s.topBar}>
        <button onClick={onBack} style={s.backBtn}>← 戻る</button>
      </div>

      {/* レッスンヘッダー */}
      <div style={s.lessonHead}>
        <span style={s.durBadge}>所要時間 {dur}分</span>
        <h1 style={s.lessonTitle}>{meta.label}</h1>
      </div>

      {/* ステップインジケーター */}
      <StepBar step={1} />

      {/* 説明文 */}
      <div style={s.descBox}>
        <p style={s.descText}>
          ご予約はカレンダーに表示されている枠で可能です。<br />
          カレンダーに表示されていない日時をご希望の方は別途LINEにてご相談ください。
        </p>
      </div>

      {/* 場所選択（複数拠点のみ） */}
      {locs.length > 1 && (
        <div style={s.locWrap}>
          <div style={s.locLabel}>場所を選択してください</div>
          <div style={s.locGrid}>
            {locs.map(l => (
              <button
                key={l.code}
                style={{ ...s.locBtn, ...(loc === l.code ? s.locBtnOn : {}) }}
                onClick={() => { setLoc(l.code); setSlots({}) }}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loc && (
        <div style={s.calWrap}>
          <div style={s.calPrompt}>ご都合の良い日時を選択してください</div>

          {/* 週ナビゲーション */}
          <div style={s.weekNav}>
            <button
              style={{ ...s.navBtn, opacity: canPrev ? 1 : 0.3 }}
              disabled={!canPrev}
              onClick={() => setWeekMon(w => subWeeks(w, 1))}
            >
              ‹ 前へ
            </button>
            <span style={s.weekLabel}>{format(weekMon, 'yyyy年M月', { locale: ja })}</span>
            <button
              style={{ ...s.navBtn, opacity: canNext ? 1 : 0.3 }}
              disabled={!canNext}
              onClick={() => setWeekMon(w => addWeeks(w, 1))}
            >
              次へ ›
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div style={s.dayHeaderRow}>
            <div style={s.axisGutter} />
            {days.map(d => {
              const disabled = isBefore(d, minDate) || isAfter(d, maxDate)
              const dow = d.getDay()
              const dateColor = disabled ? '#D1D5DB' : dow === 0 ? '#EF4444' : dow === 6 ? '#3B82F6' : '#374151'
              return (
                <div key={format(d, 'yyyy-MM-dd')} style={s.dayHeadCell}>
                  <span style={{ ...s.dayNum, color: dateColor }}>{format(d, 'd')}</span>
                  <span style={{ ...s.dayName, color: dateColor }}>{format(d, 'E', { locale: ja })}</span>
                </div>
              )
            })}
          </div>

          {/* タイムグリッド */}
          <div style={s.gridOuter}>
            {/* 時刻軸 */}
            <div style={s.axisCol}>
              {Array.from({ length: HR_END - HR_START }, (_, i) => (
                <div key={i} style={{ ...s.hourLbl, height: HR_PX }}>
                  {HR_START + i}:00
                </div>
              ))}
            </div>

            {/* 日別カラム */}
            {days.map(d => {
              const ds       = format(d, 'yyyy-MM-dd')
              const disabled = isBefore(d, minDate) || isAfter(d, maxDate)
              const daySlots = slots[ds] || []
              const totalH   = (HR_END - HR_START) * HR_PX

              return (
                <div key={ds} style={{ ...s.dayCol, height: totalH }}>
                  {/* 横グリッドライン */}
                  {Array.from({ length: HR_END - HR_START }, (_, i) => (
                    <div key={i} style={{ ...s.hLine, top: i * HR_PX }} />
                  ))}

                  {/* ローディング */}
                  {loading && !disabled && (
                    <div style={s.loadOverlay} />
                  )}

                  {/* 空き枠ブロック：連続スロットをグループ化して押しやすく表示 */}
                  {!loading && !disabled && groupSlots(daySlots).map((group, gi) => {
                    const firstSt = new Date(group[0].start)
                    const top = (firstSt.getHours() + firstSt.getMinutes() / 60 - HR_START) * HR_PX
                    const durH  = dur / 60 * HR_PX
                    const groupH = Math.max(durH, group.length * 32)

                    return (
                      <div key={gi} style={{ ...s.slotGroup, top, height: groupH }}>
                        {group.map(sl => {
                          const st = new Date(sl.start)
                          const en = new Date(sl.end)
                          return (
                            <button
                              key={sl.start}
                              style={s.slotRow}
                              onClick={() => onBook({ start: st, end: en, label: sl.label, location: loc })}
                            >
                              <span style={s.slotFrom}>{format(st, 'H:mm')}</span>
                              <span style={s.slotTo}>-{format(en, 'H:mm')}</span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function StepBar({ step }) {
  const STEPS = ['日程選択', '情報入力', '完了']
  const items = []
  STEPS.forEach((lbl, i) => {
    const n      = i + 1
    const active = step === n
    const done   = step > n
    if (i > 0) {
      items.push(
        <div key={`line-${i}`} style={{ flex: 1, height: 1, background: done ? '#00968A' : '#E5E7EB' }} />
      )
    }
    items.push(
      <div key={n} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: active ? '#00968A' : '#F3F4F6',
        border: `1px solid ${active ? '#00968A' : '#E5E7EB'}`,
        borderRadius: 999, padding: '5px 11px', flexShrink: 0,
      }}>
        <span style={{ color: active ? '#fff' : '#9CA3AF', fontSize: 11, fontWeight: 700 }}>{n}</span>
        <span style={{ color: active ? '#fff' : '#9CA3AF', fontSize: 10, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
          {lbl}
        </span>
      </div>
    )
  })
  return <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 8px', gap: 4 }}>{items}</div>
}

const s = {
  page: {
    background: '#fff', minHeight: '100vh',
    fontFamily: '-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif',
  },

  topBar:  { padding: '12px 16px', borderBottom: '1px solid #F3F4F6' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', padding: 0 },

  lessonHead:  { padding: '16px 16px 6px' },
  durBadge:    { display: 'inline-block', fontSize: 11, color: '#00968A', fontWeight: 600,
                 background: '#E6F7F5', padding: '2px 10px', borderRadius: 999, marginBottom: 8 },
  lessonTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: '#1F2937', lineHeight: 1.35 },

  descBox:  { padding: '0 16px 12px' },
  descText: { margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.75 },

  locWrap:  { padding: '12px 16px', borderTop: '1px solid #F3F4F6' },
  locLabel: { fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 8 },
  locGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  locBtn:   { padding: '8px 4px', background: '#F9FAFB', border: '1px solid #E5E7EB',
              borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer', textAlign: 'center' },
  locBtnOn: { background: '#E6F7F5', border: '1px solid #00968A', color: '#00968A', fontWeight: 600 },

  calWrap:   { borderTop: '1px solid #F3F4F6' },
  calPrompt: { padding: '12px 16px 2px', fontSize: 13, fontWeight: 600, color: '#1F2937' },

  weekNav:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' },
  navBtn:    { background: 'none', border: '1px solid #E5E7EB', borderRadius: 6,
               padding: '5px 14px', fontSize: 13, color: '#374151', cursor: 'pointer' },
  weekLabel: { fontSize: 14, fontWeight: 700, color: '#1F2937' },

  dayHeaderRow: { display: 'flex', alignItems: 'center', borderBottom: '2px solid #F3F4F6',
                  padding: '0 0 8px' },
  axisGutter:   { width: 42, flexShrink: 0 },
  dayHeadCell:  { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
  dayNum:       { fontSize: 15, fontWeight: 700 },
  dayName:      { fontSize: 11 },

  gridOuter: { display: 'flex', overflowY: 'auto', maxHeight: 400 },
  axisCol:   { width: 42, flexShrink: 0 },
  hourLbl:   { display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
               paddingRight: 6, fontSize: 10, color: '#B0B7C3', paddingTop: 2 },

  dayCol:      { flex: 1, borderLeft: '1px solid #F3F4F6', position: 'relative', minWidth: 0 },
  hLine:       { position: 'absolute', left: 0, right: 0, height: 1, background: '#F3F4F6' },
  loadOverlay: { position: 'absolute', inset: 0, background: '#F9FAFB',
                 animation: 'pulse 1.5s ease-in-out infinite' },

  slotGroup: { position: 'absolute', left: 2, right: 2,
               background: '#00968A', borderRadius: 6, overflow: 'hidden',
               display: 'flex', flexDirection: 'column',
               boxShadow: '0 1px 4px rgba(0,150,138,0.3)' },
  slotRow:   { background: 'transparent', border: 'none',
               borderBottom: '1px solid rgba(255,255,255,0.25)',
               cursor: 'pointer', textAlign: 'left',
               padding: '0 6px', flex: 1, minHeight: 32,
               display: 'flex', alignItems: 'center', gap: 3 },
  slotFrom:  { fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1 },
  slotTo:    { fontSize: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1 },
}
