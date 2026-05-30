import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req: Request) => {
  // Reject if webhook secret doesn't match
  const incomingSecret = req.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (incomingSecret !== Deno.env.get('TELEGRAM_WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const message = body?.message as Record<string, unknown> | undefined
  if (!message) {
    // Non-message update (edited message, channel post, etc.) — ignore
    return new Response('OK', { status: 200 })
  }

  // Only respond to the allowed Telegram user
  const from = message.from as Record<string, unknown> | undefined
  const senderId = String(from?.id ?? '')
  if (senderId !== Deno.env.get('TELEGRAM_ALLOWED_USER_ID')) {
    return new Response('OK', { status: 200 })
  }

  const text = (message.text as string | undefined)?.trim()
  if (!text) {
    // Non-text message (photo, sticker, voice, etc.) — ignore
    return new Response('OK', { status: 200 })
  }

  const chat = message.chat as Record<string, unknown>
  const chatId = chat?.id

  const now = new Date().toISOString()
  const { error } = await supabase.from('tasks').insert({
    id: crypto.randomUUID(),
    user_id: Deno.env.get('APP_USER_ID'),
    text,
    completed: false,
    completed_at: null,
    priority: 'medium',
    status: 'capture',
    project_id: null,
    pinned: false,
    subtasks: [],
    created_at: now,
    updated_at: now,
  })

  if (error) {
    console.error('Task insert failed:', error)
    await sendReply(chatId, '❌ Failed to capture task. Check function logs.')
    return new Response('OK', { status: 200 })
  }

  await sendReply(chatId, `✅ Captured: "${text}"`)
  return new Response('OK', { status: 200 })
})

async function sendReply(chatId: unknown, text: string) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}
