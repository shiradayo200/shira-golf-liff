import { useEffect, useState } from 'react'
import liff from '@line/liff'
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import Checkout from './pages/Checkout'
import MyBookings from './pages/MyBookings'

const LIFF_ID = import.meta.env.VITE_LIFF_ID

export default function App() {
  const [page, setPage] = useState('home')
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [bookingData, setBookingData] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    // Read ?type= from URL to allow rich menu deep-links
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    if (type) {
      setBookingData({ lessonType: type })
      setPage('calendar')
    }

    liff.init({ liffId: LIFF_ID })
      .then(async () => {
        if (!liff.isLoggedIn()) { liff.login(); return }
        const p = await liff.getProfile()
        setProfile(p)
        setReady(true)
      })
      .catch(err => setError(err.message))
  }, [])

  if (error) return <Screen>⚠️ 初期化エラー: {error}</Screen>
  if (!ready) return <Screen>読み込み中...</Screen>

  return (
    <div style={styles.wrap}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f8fafc; }
        button { font-family: inherit; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
      {page === 'home' && (
        <Home
          profile={profile}
          onSelect={type => { setBookingData({ lessonType: type }); setPage('calendar') }}
          onMyBookings={() => setPage('myBookings')}
        />
      )}
      {page === 'myBookings' && (
        <MyBookings
          profile={profile}
          onBack={() => setPage('home')}
        />
      )}
      {page === 'calendar' && (
        <Calendar
          profile={profile}
          lessonType={bookingData.lessonType}
          onBook={slot => { setBookingData(d => ({ ...d, slot })); setPage('checkout') }}
          onBack={() => setPage('home')}
        />
      )}
      {page === 'checkout' && (
        <Checkout
          profile={profile}
          bookingData={bookingData}
          onDone={() => { setBookingData({}); setPage('home') }}
          onBack={() => setPage('calendar')}
        />
      )}
    </div>
  )
}

function Screen({ children }) {
  return <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>{children}</div>
}

const styles = {
  wrap: { maxWidth: 480, margin: '0 auto', fontFamily: '-apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif' }
}
