import { Hono } from 'hono';

const ai = new Hono();

ai.get('/', (c) => c.json({ message: 'AI endpoint' }));

export default ai;
