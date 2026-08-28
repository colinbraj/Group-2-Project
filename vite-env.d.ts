/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Supabase
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;

    // n8n Webhooks
    readonly VITE_N8N_BASE_URL: string;
    readonly VITE_N8N_SEND_REPLY_WEBHOOK: string;
    readonly VITE_N8N_CREATE_POST_WEBHOOK: string;

    // AI Services
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_OPENAI_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
