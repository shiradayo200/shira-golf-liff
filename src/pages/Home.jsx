const LESSON_TYPES = [
  {
    value: 'swing_analysis',
    label: 'スイング分析',
    sub: '無料体験・オンライン（Google Meet）',
    duration: '45〜60分',
    price: '完全無料',
    dot: '#059669',
  },
  {
    value: 'online',
    label: 'オンラインレッスン',
    sub: '回数券制・Google Meet',
    duration: '45分',
    price: '5回 ¥20,000〜',
    dot: '#2563eb',
  },
  {
    value: 'face_monthly',
    label: '対面レッスン',
    sub: '月額プラン・関西4拠点',
    duration: '90分',
    price: '月1回 ¥12,000〜',
    dot: '#7c3aed',
  },
  {
    value: 'tokyo',
    label: '東京レッスン',
    sub: '単発・マイゴル赤坂1ST',
    duration: '90分',
    price: '¥18,000 + 施設料',
    dot: '#ea580c',
  },
]

export default function Home({ profile, onSelect, onMyBookings }) {
  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <div>
          <span style={s.siteName}>しらゴルフ</span>
          <span style={s.siteTag}>レッスン予約</span>
        </div>
        {profile?.displayName && (
          <span style={s.userName}>{profile.displayName} さん</span>
        )}
      </div>

      {/* Section header */}
      <div style={s.sectionHead}>レッスンを選択</div>

      {/* Lesson list */}
      <div style={s.table}>
        {LESSON_TYPES.map((t, idx) => (
          <button
            key={t.value}
            style={{ ...s.row, borderBottom: idx < LESSON_TYPES.length - 1 ? '1px solid #F3F4F6' : 'none' }}
            onClick={() => onSelect(t.value)}
          >
            <span style={{ ...s.dot, background: t.dot }} />
            <div style={s.rowBody}>
              <span style={s.rowTitle}>{t.label}</span>
              <span style={s.rowSub}>{t.sub} · {t.duration}</span>
            </div>
            <span style={s.rowPrice}>{t.price}</span>
            <span style={s.chevron}>›</span>
          </button>
        ))}
      </div>

      {/* My bookings */}
      <div style={s.sectionHead}>マイページ</div>
      <div style={s.table}>
        <button style={{ ...s.row, borderBottom: 'none' }} onClick={onMyBookings}>
          <span style={{ fontSize: 16 }}>📋</span>
          <div style={s.rowBody}>
            <span style={s.rowTitle}>マイ予約</span>
            <span style={s.rowSub}>予約の確認・キャンセル</span>
          </div>
          <span style={s.chevron}>›</span>
        </button>
      </div>

      <p style={s.note}>ご不明な点はLINEトークにてお気軽にご連絡ください</p>
    </div>
  )
}

const s = {
  page:       { background: '#F5F6F7', minHeight: '100vh' },
  topBar:     { background: '#fff', borderBottom: '1px solid #E5E7EB',
                padding: '12px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between' },
  siteName:   { fontSize: 16, fontWeight: 700, color: '#1F2937' },
  siteTag:    { fontSize: 11, color: '#6B7280', marginLeft: 8 },
  userName:   { fontSize: 12, color: '#6B7280' },
  sectionHead:{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 600,
                color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase',
                borderBottom: '1px solid #E5E7EB', background: '#F5F6F7',
                marginTop: 16 },
  table:      { background: '#fff', borderTop: '1px solid #E5E7EB',
                borderBottom: '1px solid #E5E7EB' },
  row:        { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                background: '#fff', border: 'none', cursor: 'pointer',
                width: '100%', textAlign: 'left' },
  dot:        { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  rowBody:    { flex: 1, minWidth: 0 },
  rowTitle:   { display: 'block', fontSize: 14, fontWeight: 600, color: '#1F2937' },
  rowSub:     { display: 'block', fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  rowPrice:   { fontSize: 12, fontWeight: 600, color: '#374151', flexShrink: 0, marginRight: 4 },
  chevron:    { color: '#D1D5DB', fontSize: 18, flexShrink: 0 },
  note:       { padding: '20px 16px 32px', fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
}
