import { readFileSync } from 'fs'
import { GoogleAuth } from 'google-auth-library'

const sa = JSON.parse(readFileSync('D:/programing/jnapp/jnapp/dominos-c7d38-firebase-adminsdk-fbsvc-0a19d00252.json', 'utf8'))
const token = 'cSKioKnjSVK4dFl5DKy1Mi:APA91bHLrfEIOpuClCejm0f_M6mYpFFJKWE2NaFwzxdvonUKDccIUlydI6G0jvw7GyXf8ACNGqVakbCL6VtSFF7vfx_cWDWs7Zkl80v8SvSwFV_sTuLQ4L0'

const auth = new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/firebase.messaging'] })
const client = await auth.getClient()
const at = await client.getAccessToken()
const accessToken = typeof at === 'string' ? at : at?.token

const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: {
      token,
      notification: { title: 'Test notif', body: 'FCM direct test — app killed?' },
      android: { priority: 'HIGH', notification: { channel_id: 'jnapp_push' } },
      data: { title: 'Test notif', body: 'FCM direct test — app killed?' }
    }
  })
})
const text = await res.text()
console.log('Status:', res.status)
console.log('Body:', text)
