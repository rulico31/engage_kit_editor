// Supabase Edge Function: external-api-proxy
// JWT認証を完全に無効化し、すべてのリクエストを処理

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH, HEAD',
}

Deno.serve(async (req) => {
    // CORS Preflight リクエストへの対応（認証不要）
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            status: 200,
            headers: corsHeaders
        })
    }

    try {
        // リクエストボディを取得
        const requestBody = await req.json()
        const { url, method, headers, body } = requestBody

        if (!url) {
            return new Response(JSON.stringify({ error: 'URL is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log('🌐 Proxying request to:', url, { method, body })

        // 外部APIへリクエスト（CORS制限なし）
        const fetchOptions: RequestInit = {
            method: method || 'POST',
            headers: headers || { 'Content-Type': 'application/json' },
        }

        // GET/HEAD以外の場合のみbodyを追加
        if (method !== 'GET' && method !== 'HEAD' && body) {
            fetchOptions.body = JSON.stringify(body)
        }

        const response = await fetch(url, fetchOptions)

        // レスポンスを取得
        let responseData
        const contentType = response.headers.get('content-type')

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.text()
        } else {
            responseData = await response.text()
        }

        console.log('✅ Response from external API:', response.status, responseData.substring(0, 100))

        // クライアントへ結果を返す
        return new Response(responseData, {
            status: 200, // 常に200を返す（外部APIのエラーもデータとして返す）
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
        })

    } catch (error) {
        console.error('❌ Proxy error:', error)
        return new Response(JSON.stringify({
            error: error.message || 'Unknown error',
            details: String(error)
        }), {
            status: 200, // エラーでも200を返してCORSエラーを回避
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
