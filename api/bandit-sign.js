import { createClient } from '@supabase/supabase-js'

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { user_id, photo_base64, lat, lng, timestamp } = req.body

  if (!user_id || !photo_base64 || !lat || !lng || !timestamp) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    const buffer = Buffer.from(photo_base64, 'base64')
    const fileName = `signs/${user_id}/${timestamp}.jpg`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('bandit-signs')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg'
      })

    if (uploadError) throw uploadError

    const photo_url = `${process.env.SUPABASE_URL}/storage/v1/object/public/bandit-signs/${fileName}`

    const { error: insertError } = await supabase.from('sign_placements').insert([
      {
        user_id,
        photo_url,
        lat,
        lng,
        timestamp
      }
    ])

    if (insertError) throw insertError

    return res.status(200).json({ success: true, photo_url })
  } catch (err) {
    return res.status(500).json({ message: 'Server Error', details: err.message })
  }
}