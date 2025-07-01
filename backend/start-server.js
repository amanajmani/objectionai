import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import dotenv from 'dotenv';
import { appRouter } from './trpc/index.js';
import { createContext } from './trpc/context.js';
import { testConnection } from './db/supabase.js';
import { testGroqConnection } from './db/groq.js';

// Load environment variables
dotenv.config();

const server = Fastify({
  maxParamLength: 5000,
  logger: true,
});

// Register CORS
await server.register(cors, {
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Alternative frontend port
    'http://localhost:4173', // Vite preview
    process.env.FRONTEND_URL, // Custom frontend URL
  ].filter(Boolean),
  credentials: true,
});

// Register tRPC plugin
await server.register(fastifyTRPCPlugin, {
  prefix: '/api/trpc',
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error);
    },
  },
});

// Health check endpoint
server.get('/health', async (request, reply) => {
  return { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ObjectionAI Backend'
  };
});

// Root endpoint
server.get('/', async (request, reply) => {
  return { 
    message: 'ObjectionAI Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      trpc: '/api/trpc',
    }
  };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    console.log('🚀 Starting ObjectionAI Backend...');
    
    // Test database connection
    await testConnection();
    
    // Test Groq connection
    await testGroqConnection();
    
    await server.listen({ port: parseInt(port), host });
    
    console.log(`✅ Server running on http://${host}:${port}`);
    console.log(`📡 tRPC endpoint: http://${host}:${port}/api/trpc`);
    console.log(`🏥 Health check: http://${host}:${port}/health`);
    
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  try {
    await server.close();
    console.log('✅ Server closed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

// Local development mode
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();