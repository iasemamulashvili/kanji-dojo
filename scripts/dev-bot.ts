import { config } from 'dotenv';
config({ path: '.env.local' });
import bot from '../lib/telegram/bot';

console.log('Starting Kanji Dojo Bot in Local Polling Mode...');

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
