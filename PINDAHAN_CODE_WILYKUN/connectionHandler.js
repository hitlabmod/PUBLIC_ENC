import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { DisconnectReason } from 'baileys';
import os from 'os'; // Tambahkan impor os

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export async function handleConnectionUpdate(update, startSock) {
	const { connection, lastDisconnect } = update;
	const error = lastDisconnect?.error;
	const statusCode = error instanceof Boom ? error.output.statusCode : null;
	const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;

	if (connection === 'close') {
		if (statusCode !== 515) {
			console.log('Connection closed due to', error, ', reconnecting', shouldReconnect);
		}
		if (shouldReconnect) {
			startSock();
		} else {
			console.log('Tidak dapat memulai ulang koneksi karena alasan:', statusCode);
			if (statusCode === 401) {
				console.log('Otentikasi gagal. Silakan periksa kredensial Anda.');
				try {
					fs.rmSync(path.join(process.cwd(), process.env.SESSION_DIR), { recursive: true, force: true });
					console.log('File sesi dihapus. Silakan buat ulang sesi.');
				} catch (err) {
					console.error('Gagal menghapus file sesi:', err);
				}
			} else if (statusCode === DisconnectReason.loggedOut) {
				console.log('Anda telah logout. Silakan login kembali.');
			} else if (statusCode === 515) {
				setTimeout(() => startSock(), 5000);
			}
		}
	} else if (connection === 'open') {
		await delay(1000);
		console.log(`
⠄⠄⠄⢰⣧⣼⣯⠄⣸⣠⣶⣶⣦⣾⠄⠄⠄⠄⡀⠄⢀⣿⣿⠄⠄⠄⢸⡇⠄⠄
⠄⠄⠄⣾⣿⠿⠿⠶⠿⢿⣿⣿⣿⣿⣦⣤⣄⢀⡅⢠⣾⣛⡉⠄⠄⠄⠸⢀⣿⠄
⠄⠄⢀⡋⣡⣴⣶⣶⡀⠄⠄⠙⢿⣿⣿⣿⣿⣿⣴⣿⣿⣿⢃⣤⣄⣀⣥⣿⣿⠄
⠄⠄⢸⣇⠻⣿⣿⣿⣧⣀⢀⣠⡌⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠿⣿⣿⣿⠄
⠄⢀⢸⣿⣷⣤⣤⣤⣬⣙⣛⢿⣿⣿⣿⣿⣿⣿⡿⣿⣿⡍⠄⠄⢀⣤⣄⠉⠋⣰
⠄⣼⣖⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣿⣿⣿⣿⣿⢇⣿⣿⡷⠶⠶⢿⣿⣿⠇⢀⣤
⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣽⣿⣿⣿⡇⣿⣿⣿⣿⣿⣿⣷⣶⣥⣴⣿⡗
⢀⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠄
⢸⣿⣦⣌⣛⣻⣿⣿⣧⠙⠛⠛⡭⠅⠒⠦⠭⣭⡻⣿⣿⣿⣿⣿⣿⣿⣵⣾⠃⠄
⠘⣿⣿⣿⣿⣿⣿⣿⣿⡆⠄⠄⠄⠄⠄⠄⠄⠄⠹⠈⢋⣽⣿⣿⣿⣿⣵⣾⠃⠄
⠄⠘⣿⣿⣿⣿⣿⣿⣿⣿⠄⣴⣿⣶⣄⠄⣴⣶⠄⢀⣾⣿⣿⣿⣿⣿⣿⠃⠄⠄
⠄⠄⠈⠻⣿⣿⣿⣿⣿⣿⡄⢻⣿⣿⣿⠄⣿⣿⡀⣾⣿⣿⣿⣿⣛⠛⠁⠄⠄⠄
⠄⠄⠄⠄⠈⠛⢿⣿⣿⣿⠁⠞⢿⣿⣿⡄⢿⣿⡇⣸⣿⣿⠿⠛⠁⠄⠄⠄⠄⠄
⠄⠄⠄⠄⠄⠄⠄⠉⠻⣿⣿⣾⣦⡙⠻⣷⣾⣿⠃⠿⠋⠁⠄⠄⠄⠄⠄⢀⣠⣴
⣿⣿⣿⣶⣶⣮⣥⣒⠲⢮⣝⡿⣿⣿⡆⣿⡿⠃⠄⠄⠄⠄⠄⠄⠄⣠⣴⣿⣿⣿

▧ SERVER INFO:
│ » OS: ${os.type()} (${os.release()})
│ » Arsitektur: ${os.arch()}
│ » Versi Node.js: ${process.version}
│ » IP Address: ${Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal).address}
└───···

▧ Information
│ » Ownername : W I L Y
│ » Botname   : ス  ZEEBOT MD
│ » Version   : 7.0.0
│ » Whatsapp  : 6289688206739
│ » Telegram  : https://t.me/XyrooRynzz
└───···

Connecting....
`);
	}
}
