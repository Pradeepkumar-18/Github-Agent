export default () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'code-intelligence-api',

    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/code_intelligence',
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    github: {
        webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
        appId: process.env.GITHUB_APP_ID || '',
        privateKey: process.env.GITHUB_PRIVATE_KEY || '',
    },

    ai: {
        openaiKey: process.env.OPENAI_API_KEY || '',
        geminiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.AI_MODEL || 'gpt-4o',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'dev_secret',
    },
});
