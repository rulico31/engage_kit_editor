// Supabase Edge Function: external-api-proxy
// JWT認証を完全に無効化し、すべてのリクエストを処理

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH, HEAD',
}

declare const Deno: any;

Deno.serve(async (req: Request) => {
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
        const contentType = response.headers.get('content-type')
        let responseData

        // Parse response body based on content type
        const textData = await response.text()

        try {
            // Try to parse as JSON regardless of header (some APIs are sloppy)
            responseData = JSON.parse(textData)
        } catch (e) {
            // Not JSON, return as wrapped object
            console.log('⚠️ Response is not JSON, wrapping as object')
            responseData = {
                raw_response: textData,
                status: response.status
            }
        }

        console.log('✅ Response from external API:', response.status, typeof responseData)

        // クライアントへ結果を返す
        return new Response(JSON.stringify(responseData), {
            status: 200, // 常に200を返す
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
        })

    } catch (error: any) {
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
