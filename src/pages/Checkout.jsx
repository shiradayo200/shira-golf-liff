import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import axios from 'axios'
import { StepBar } from './Calendar'

const GAS_URL    = import.meta.env.VITE_GAS_URL
const PAYPAY_TEL = '090-9887-3321'
const BANK       = { 銀行: '池田泉州銀行', 支店: '池田営業部', 種別: '普通', 番号: '239259' }

const TICKET_PLANS = [
  { id: '5',  label: '5回券',  price: 20000, months: 3,  perLesson: 4000 },
  { id: '10', label: '10回券', price: 37500, months: 6,  perLesson: 3750 },
  { id: '15', label: '15回券', price: 52500, months: 9,  perLesson: 3500 },
  { id: '20', label: '20回券', price: 60000, months: 12, perLesson: 3000 },
]

const LESSON_LABEL = {
  swing_analysis: 'スイング分析（無料体験）',
  online:         'オンラインレッスン',
  face_monthly:   '対面レッスン（月額）',
  tokyo:          '東京レッスン（単発）',
}

export default function Checkout({ profile, bookingData, onDone, onBack }) {
  const [step, setStep] = useState('confirm')
  const [plan, setPlan] = useState(null)
  const [busy, setBusy] = useState(false)
  const { lessonType, slot } = bookingData
  const isTennoji = slot?.location === 'L4'
  const frames    = slot?.frames || 1
  const tennojiPrice = frames === 2 ? 20000 : 10000

  async function submit(extra = {}) {
    setBusy(true)
    try {
      const body = new URLSearchParams({
        action:      'createReservation',
        userId:      profile.userId,
        displayName: profile.displayName,
        lessonType,
        location:    slot.location,
        startTime:   slot.start.toISOString(),
        endTime:     slot.end.toISOString(),
        ...extra,
      })
      await axios.post(GAS_URL, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      setStep('done')
    } catch {
      alert('送信に失敗しました。もう一度お試しください。')
    }
    setBusy(false)
  }

  // ── 完了 ─────────────────────────────────────────────────────────
  if (step === 'done') {
    const isOnline = lessonType === 'online' || lessonType === 'swing_analysis'
    return (
      <div style={s.page}>
        <div style={s.header}>
          <span style={s.headerTitle}>{isTennoji ? '仮予約受付完了' : '予約完了'}</span>
        </div>
        <div style={s.doneWrap}>
          <div style={s.doneIcon}>✓</div>
          <p style={s.doneTitle}>{isTennoji ? '仮予約を受け付けました' : '予約が完了しました'}</p>
          <p style={s.doneSub}>
            {isTennoji
              ? 'LINEにてマイゴルアプリでの本予約手順をお送りします'
              : isOnline ? 'LINEにGoogle MeetのURLをお送りします' : 'LINEに確認メッセージをお送りします'}
          </p>
        </div>
        {isTennoji && (
          <div style={s.tennojiNotice}>
            <p style={s.tennojiNoticeTitle}>⚠️ 仮予約について</p>
            <p style={s.tennojiNoticeText}>
              こちらはシステム上の仮予約です。{'\n'}
              実際のご予約はLINEでお送りする手順に従い、マイゴルアプリで完了してください。
            </p>
          </div>
        )}
        <div style={s.summaryBox}>
          <SummaryRow label="日付" value={format(slot.start, 'yyyy年M月d日(E)', { locale: ja })} />
          <SummaryRow label="時間" value={slot.label} bold />
          <SummaryRow label="レッスン" value={LESSON_LABEL[lessonType]} />
          {isTennoji && <SummaryRow label="料金" value={`¥${tennojiPrice.toLocaleString()}`} bold last />}
          {!isTennoji && <SummaryRow label="レッスン" value={LESSON_LABEL[lessonType]} last />}
        </div>
        <div style={s.btnWrap}>
          <PrimaryBtn onClick={onDone}>トップへ戻る</PrimaryBtn>
        </div>
      </div>
    )
  }

  // ── スイング分析 ──────────────────────────────────────────────────
  if (lessonType === 'swing_analysis') {
    return (
      <PageShell onBack={onBack} title="予約内容の確認" stepNum={2}>
        <BookingSummary slot={slot} lessonType={lessonType} />
        <Notice>予約確定後、LINEにGoogle MeetのURLをお送りします。完全無料でお気軽にご参加ください。</Notice>
        <div style={s.btnWrap}>
          <PrimaryBtn onClick={() => submit({ payMethod: 'free' })} loading={busy}>予約を確定する</PrimaryBtn>
        </div>
      </PageShell>
    )
  }

  // ── 天王寺（L4）仮予約 ────────────────────────────────────────────
  if (lessonType === 'face_monthly' && isTennoji) {
    return (
      <PageShell onBack={onBack} title="予約内容の確認" stepNum={2}>
        <BookingSummary slot={slot} lessonType={lessonType} />
        <div style={s.summaryBox}>
          <SummaryRow label="枠数" value={`${frames}枠 ${frames * 50}分`} />
          <SummaryRow label="料金" value={`¥${tennojiPrice.toLocaleString()}`} bold last />
        </div>
        <Notice>
          ⚠️ こちらはシステム上の仮予約です。{'\n'}
          予約後、LINEにてマイゴルアプリでの本予約手順・注意事項をお送りします。
        </Notice>
        <div style={s.btnWrap}>
          <PrimaryBtn
            onClick={() => submit({ payMethod: 'mygol_tennoji', frames: String(frames) })}
            loading={busy}
          >
            仮予約を送る
          </PrimaryBtn>
        </div>
      </PageShell>
    )
  }

  // ── 対面レッスン（L1/L2/L3） ──────────────────────────────────────
  if (lessonType === 'face_monthly') {
    return (
      <PageShell onBack={onBack} title="予約内容の確認" stepNum={2}>
        <BookingSummary slot={slot} lessonType={lessonType} />
        <Notice>月額プランはマイゴルアプリでの決済が必要です。予約後に登録フローをご案内します。</Notice>
        <div style={s.btnWrap}>
          <PrimaryBtn onClick={() => submit({ payMethod: 'mygol' })} loading={busy}>予約リクエストを送る</PrimaryBtn>
        </div>
      </PageShell>
    )
  }

  // ── 東京レッスン ──────────────────────────────────────────────────
  if (lessonType === 'tokyo') {
    return (
      <PageShell onBack={onBack} title="予約内容の確認" stepNum={2}>
        <BookingSummary slot={slot} lessonType={lessonType} />
        <div style={s.summaryBox}>
          <SummaryRow label="料金" value="¥18,000 + 施設料 ¥1,100" bold last />
        </div>
        <Notice>マイゴルアプリからの予約・決済をご案内します。</Notice>
        <div style={s.btnWrap}>
          <PrimaryBtn onClick={() => submit({ payMethod: 'mygol_tokyo' })} loading={busy}>予約リクエストを送る</PrimaryBtn>
        </div>
      </PageShell>
    )
  }

  // ── オンライン ────────────────────────────────────────────────────
  if (lessonType === 'online') {

    // 回数券の有無
    if (step === 'confirm') {
      return (
        <PageShell onBack={onBack} title="予約内容の確認" stepNum={2}>
          <BookingSummary slot={slot} lessonType={lessonType} />
          <div style={s.sectionHead}>回数券はお持ちですか？</div>
          <div style={s.optionList}>
            <button style={s.optionRow} onClick={() => setStep('ticket_use')}>
              <div style={s.optionBody}>
                <span style={s.optionTitle}>回数券をお持ちの方</span>
                <span style={s.optionSub}>回数券を1回使用して即時確定</span>
              </div>
              <span style={s.chevron}>›</span>
            </button>
            <button style={{ ...s.optionRow, borderBottom: 'none' }} onClick={() => setStep('buy_ticket')}>
              <div style={s.optionBody}>
                <span style={s.optionTitle}>初めての方・新規購入</span>
                <span style={s.optionSub}>回数券を購入して予約します</span>
              </div>
              <span style={s.chevron}>›</span>
            </button>
          </div>
        </PageShell>
      )
    }

    // 回数券使用 → 即時確定
    if (step === 'ticket_use') {
      return (
        <PageShell onBack={() => setStep('confirm')} title="回数券で予約" stepNum={2}>
          <BookingSummary slot={slot} lessonType={lessonType} />
          <Notice>回数券を1回使用してご予約を確定します。確定後、LINEにGoogle MeetのURLをお送りします。</Notice>
          <div style={s.btnWrap}>
            <PrimaryBtn onClick={() => submit({ payMethod: 'ticket' })} loading={busy}>予約を確定する</PrimaryBtn>
          </div>
        </PageShell>
      )
    }

    // プラン選択
    if (step === 'buy_ticket') {
      return (
        <PageShell onBack={() => setStep('confirm')} title="回数券プランを選択" stepNum={2}>
          <BookingSummary slot={slot} lessonType={lessonType} />
          <div style={s.sectionHead}>ご希望のプランを選択してください</div>
          <table style={s.planTable}>
            <thead>
              <tr>
                <th style={s.th}>プラン</th>
                <th style={s.th}>金額</th>
                <th style={s.th}>1回単価</th>
                <th style={s.th}>有効期限</th>
                <th style={s.th} />
              </tr>
            </thead>
            <tbody>
              {TICKET_PLANS.map((pk, idx) => (
                <tr
                  key={pk.id}
                  style={{
                    ...s.planRow,
                    ...(plan?.id === pk.id ? s.planRowOn : {}),
                    borderBottom: idx < TICKET_PLANS.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                  onClick={() => setPlan(pk)}
                >
                  <td style={s.td}>{pk.label}</td>
                  <td style={{ ...s.td, fontWeight: 700 }}>¥{pk.price.toLocaleString()}</td>
                  <td style={{ ...s.td, color: '#6B7280' }}>¥{pk.perLesson.toLocaleString()}</td>
                  <td style={{ ...s.td, color: '#6B7280' }}>{pk.months}ヶ月</td>
                  <td style={s.td}>
                    <span style={plan?.id === pk.id ? s.radioOn : s.radioOff} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plan && (
            <div style={s.btnWrap}>
              <PrimaryBtn onClick={() => setStep('pay')}>お支払い方法へ →</PrimaryBtn>
            </div>
          )}
        </PageShell>
      )
    }

    // 支払い方法選択
    if (step === 'pay') {
      return (
        <PageShell onBack={() => setStep('buy_ticket')} title="お支払い方法を選択" stepNum={2}>
          <div style={s.summaryBox}>
            <SummaryRow label="プラン" value={plan.label} />
            <SummaryRow label="金額" value={`¥${plan.price.toLocaleString()}`} bold last />
          </div>
          <div style={s.sectionHead}>お支払い方法</div>
          <div style={s.optionList}>
            <button style={s.optionRow} onClick={() => setStep('paypay')}>
              <div style={s.optionBody}>
                <span style={s.optionTitle}>PayPay で支払う</span>
                <span style={s.optionSub}>送金後にスクリーンショットを送信</span>
              </div>
              <span style={s.chevron}>›</span>
            </button>
            <button style={{ ...s.optionRow, borderBottom: 'none' }} onClick={() => setStep('bank')}>
              <div style={s.optionBody}>
                <span style={s.optionTitle}>銀行振込で支払う</span>
                <span style={s.optionSub}>振込後に明細画像を送信</span>
              </div>
              <span style={s.chevron}>›</span>
            </button>
          </div>
        </PageShell>
      )
    }

    // PayPay
    if (step === 'paypay') {
      return (
        <PageShell onBack={() => setStep('pay')} title="PayPay 送金" stepNum={2}>
          <div style={s.summaryBox}>
            <SummaryRow label="プラン" value={plan.label} />
            <SummaryRow label="金額" value={`¥${plan.price.toLocaleString()}`} bold last />
          </div>
          <div style={s.sectionHead}>送金先</div>
          <div style={s.summaryBox}>
            <SummaryRow label="PayPay 電話番号" value={PAYPAY_TEL} bold last />
          </div>
          <Notice>送金後、LINEトーク画面に送金完了のスクリーンショットをお送りください。確認後に予約を確定します（通常1〜2時間以内）。</Notice>
          <div style={s.btnWrap}>
            <PrimaryBtn onClick={() => submit({ payMethod: 'paypay', ticketPlan: plan.id })} loading={busy}>
              送金しました（予約申請）
            </PrimaryBtn>
          </div>
        </PageShell>
      )
    }

    // 銀行振込
    if (step === 'bank') {
      return (
        <PageShell onBack={() => setStep('pay')} title="銀行振込" stepNum={2}>
          <div style={s.summaryBox}>
            <SummaryRow label="プラン" value={plan.label} />
            <SummaryRow label="金額" value={`¥${plan.price.toLocaleString()}`} bold last />
          </div>
          <div style={s.sectionHead}>振込先</div>
          <div style={s.summaryBox}>
            {Object.entries(BANK).map(([k, v], i, arr) => (
              <SummaryRow key={k} label={k} value={v} last={i === arr.length - 1} />
            ))}
          </div>
          <Notice>振込後、LINEトーク画面に振込明細のスクリーンショットをお送りください。確認後に予約を確定します（通常1〜2時間以内）。</Notice>
          <div style={s.btnWrap}>
            <PrimaryBtn onClick={() => submit({ payMethod: 'bank', ticketPlan: plan.id })} loading={busy}>
              振り込みました（予約申請）
            </PrimaryBtn>
          </div>
        </PageShell>
      )
    }
  }

  return null
}

// ── Sub-components ─────────────────────────────────────────────────

function PageShell({ onBack, title, stepNum, children }) {
  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn}>← 戻る</button>
        <span style={s.headerTitle}>{title}</span>
        <div style={{ width: 40 }} />
      </div>
      {stepNum && <StepBar step={stepNum} />}
      <div style={s.body}>{children}</div>
    </div>
  )
}

function BookingSummary({ slot, lessonType }) {
  const isOnline = lessonType === 'online' || lessonType === 'swing_analysis'
  return (
    <div style={s.summaryBox}>
      <SummaryRow label="日付" value={format(slot.start, 'yyyy年M月d日(E)', { locale: ja })} />
      <SummaryRow label="時間" value={slot.label} bold />
      <SummaryRow label="レッスン" value={LESSON_LABEL[lessonType]} />
      {!isOnline && slot.location && slot.location !== 'ONLINE' && (
        <SummaryRow label="場所" value={slot.location} last />
      )}
      {isOnline && <SummaryRow label="場所" value="オンライン（Google Meet）" last />}
    </div>
  )
}

function SummaryRow({ label, value, bold, last }) {
  return (
    <div style={{ ...s.summaryRow, borderBottom: last ? 'none' : '1px solid #F3F4F6' }}>
      <span style={s.summaryLabel}>{label}</span>
      <span style={{ ...s.summaryValue, fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  )
}

function Notice({ children }) {
  return (
    <div style={s.notice}>{children}</div>
  )
}

function PrimaryBtn({ children, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{ ...s.primaryBtn, opacity: (loading || disabled) ? 0.6 : 1 }}
    >
      {loading ? '送信中...' : children}
    </button>
  )
}

// ── Styles ─────────────────────────────────────────────────────────

const s = {
  page:        { background: '#F5F6F7', minHeight: '100vh' },
  header:      { background: '#fff', borderBottom: '1px solid #E5E7EB',
                 padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 },
  backBtn:     { background: 'none', border: 'none', cursor: 'pointer',
                 fontSize: 13, color: '#6B7280', padding: 0, flexShrink: 0 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1F2937' },
  stepLabel:   { fontSize: 11, color: '#9CA3AF', flexShrink: 0, width: 40, textAlign: 'right' },
  body:        { paddingBottom: 32 },

  summaryBox:  { background: '#fff', borderTop: '1px solid #E5E7EB',
                 borderBottom: '1px solid #E5E7EB', marginBottom: 0 },
  summaryRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                 padding: '11px 16px' },
  summaryLabel:{ fontSize: 13, color: '#6B7280' },
  summaryValue:{ fontSize: 14, color: '#1F2937' },

  sectionHead: { padding: '14px 16px 8px', fontSize: 11, fontWeight: 600, color: '#6B7280',
                 letterSpacing: 0.5, textTransform: 'uppercase', background: '#F5F6F7',
                 borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB',
                 marginTop: 12 },

  optionList:  { background: '#fff', borderTop: '1px solid #E5E7EB',
                 borderBottom: '1px solid #E5E7EB' },
  optionRow:   { display: 'flex', alignItems: 'center', padding: '14px 16px', width: '100%',
                 background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left',
                 borderBottom: '1px solid #F3F4F6', gap: 12 },
  optionBody:  { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  optionTitle: { fontSize: 14, fontWeight: 600, color: '#1F2937' },
  optionSub:   { fontSize: 12, color: '#9CA3AF' },
  chevron:     { color: '#D1D5DB', fontSize: 18 },

  planTable:   { width: '100%', borderCollapse: 'collapse', background: '#fff',
                 borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' },
  th:          { padding: '9px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280',
                 borderBottom: '1px solid #E5E7EB', textAlign: 'left', background: '#F9FAFB' },
  planRow:     { cursor: 'pointer' },
  planRowOn:   { background: '#F0FDF4' },
  td:          { padding: '12px 12px', fontSize: 13, color: '#1F2937' },
  radioOff:    { display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
                 border: '2px solid #D1D5DB', verticalAlign: 'middle' },
  radioOn:     { display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
                 border: '5px solid #00968A', background: '#fff', verticalAlign: 'middle' },

  tennojiNotice:     { margin: '0 16px 12px', padding: '14px', background: '#FFF7ED',
                       border: '1px solid #FED7AA', borderRadius: 8 },
  tennojiNoticeTitle:{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#C2410C' },
  tennojiNoticeText: { margin: 0, fontSize: 12, color: '#9A3412', lineHeight: 1.75, whiteSpace: 'pre-line' },

  notice:      { margin: '12px 16px', padding: '12px', background: '#FFFBEB',
                 border: '1px solid #FDE68A', borderRadius: 4,
                 fontSize: 12, color: '#92400E', lineHeight: 1.7 },

  btnWrap:     { padding: '16px' },
  primaryBtn:  { width: '100%', padding: '13px', background: '#00968A', color: '#fff',
                 border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 700,
                 cursor: 'pointer' },

  // Done
  doneWrap:    { padding: '32px 16px 20px', textAlign: 'center', background: '#fff',
                 borderBottom: '1px solid #E5E7EB' },
  doneIcon:    { width: 52, height: 52, borderRadius: '50%', background: '#00968A',
                 color: '#fff', fontSize: 24, display: 'flex', alignItems: 'center',
                 justifyContent: 'center', margin: '0 auto 14px', fontWeight: 800 },
  doneTitle:   { margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#1F2937' },
  doneSub:     { margin: 0, fontSize: 13, color: '#6B7280' },
}
