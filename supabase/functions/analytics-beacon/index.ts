// Supabase Edge Function: analytics-beacon
// ブラウザの navigator.sendBeacon() からのリクエストを受け取り、analytics_logs に保存する
// CORS対応済み（Dynamic Origin + Credentials）

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// @ts-ignore
import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("Analytics Beacon Function initialized")

// @ts-ignore
Deno.serve(async (req: Request) => {
    // 1. CORS Headers Setup
    // sendBeaconは 'credentials: include' (Cookie送信) を伴う場合があるため、
    // Access-Control-Allow-Origin には '*' ではなく具体的な Origin を返す必要がある。
    const origin = req.headers.get('origin') || '*'

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true', // 重要
    }

    // 2. Handle Preflight Request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 3. Request Body Parsing
        // sendBeaconは 'application/json' ではなく 'text/plain' として送られることもあるため、
        // Content-Typeに関わらずテキストとして読み込んでパースを試みる。
        const text = await req.text()
        if (!text) {
            return new Response('ok', { headers: corsHeaders }) // 空リクエストは無視してOK
        }

        let payload
        try {
            payload = JSON.parse(text)
        } catch (e) {
            // Blob type check failure protection
            console.warn('Failed to parse JSON:', e)
            return new Response('Invalid JSON', { status: 400, headers: corsHeaders })
        }

        const { project_id, session_id, event_type, metadata } = payload

        if (!project_id || !session_id || !event_type) {
            return new Response('Missing required fields', { status: 400, headers: corsHeaders })
        }

        // 4. Transform Data
        // メタデータから node_id, node_type を抽出（もしあれば）
        // useActionAnalytics.ts では metadata 内に last_interacted_node 等を入れている
        const nodeId = metadata?.last_interacted_node || metadata?.target_node_id || null
        const nodeType = metadata?.last_interacted_node_type || metadata?.target_node_type || null

        // 5. Connect to Supabase
        // Service Role Keyを使用してRLSをバイパスして書き込む
        // (クライアントからの直接書き込みだが、内容はログなので今回は許容。
        //  厳密にはJWT検証すべきだがBeaconはAuthヘッダを送りにくい制約があるためServiceRoleで書く)
        // @ts-ignore
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        // @ts-ignore
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 6. Insert to DB
        const { error } = await supabase
            .from('analytics_logs')
            .insert({
                project_id,
                session_id,
                event_type,
                node_id: nodeId,
                node_type: nodeType,
                metadata
            })

        if (error) {
            console.error('DB Insert Error:', error)
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Beacon Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
