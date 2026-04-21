import { Hono } from 'hono';
import type { HonoEnv } from '../../env';
import ads from './ads';
import ai from './ai';
import products from './products';
import stats from './stats';
import zones from './zones';

const api = new Hono<HonoEnv>();
api.route('/products', products);
api.route('/zones', zones);
api.route('/ads', ads);
api.route('/stats', stats);
api.route('/ai', ai);

export default api;
