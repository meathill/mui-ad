import { Hono } from 'hono';
import type { HonoEnv } from '../../env';
import adminRoutes from './admin';
import ads from './ads';
import aiGenerations from './ai-generations';
import apiKeysRoutes from './api-keys';
import approvalsRoutes from './approvals';
import products from './products';
import settingsRoutes from './settings';
import stats from './stats';
import zones from './zones';

const api = new Hono<HonoEnv>();
api.route('/products', products);
api.route('/zones', zones);
api.route('/ads', ads);
api.route('/stats', stats);
api.route('/ai-generations', aiGenerations);
api.route('/api-keys', apiKeysRoutes);
api.route('/settings', settingsRoutes);
api.route('/approvals', approvalsRoutes);
api.route('/admin', adminRoutes);

export default api;
