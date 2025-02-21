import 'dotenv/config';

import makeWASocket, {
	delay,
	useMultiFileAuthState,
	fetchLatestBaileysVersion,
	makeInMemoryStore,
	jidNormalizedUser,
	DisconnectReason,
	Browsers,
	makeCacheableSignalKeyStore,
} from 'baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
// Hapus impor fungsi dari helpers.js
// import { handleConnectionUpdate } from './ALAMAK/helpers.js'; // Impor fungsi handleConnectionUpdate
import { handleDisconnectReason, handleGroupParticipantsUpdate, handleHalloMessage } from './ALAMAK/case.js'; // Impor fungsi handleDisconnectReason, handleGroupParticipantsUpdate, dan handleHalloMessage
// Hapus impor fungsi dari statusViewCounter.js
// import { incrementStatusViewCount, incrementNoReactViewCount } from './lib/statusViewCounter.js';
import { autoReactStatus, checkUnreadStatuses } from './Random_Emot/Code_Auto_Read_Story.js';
import { handleAutoTyping } from './FITUR_BY_WILY/Auto_Typing_Ricord_Ceklis_2_no_read.js'; // Impor fungsi handleAutoTyping
import { handleWelcomeMessage } from './FITUR_BY_WILY/welcome.js'; // Impor fungsi handleWelcomeMessage
import { handleGoodbyeMessage } from './FITUR_BY_WILY/goodbay.js'; // Impor fungsi handleGoodbyeMessage
import { handleAntiWaMeLink } from './FITUR_BY_WILY/ANTI_GC/antiwame.js'; // Impor fungsi handleAntiWaMeLink
import { handleAntiForwardedNewsletter } from './FITUR_BY_WILY/ANTI_GC/antiforwardednewsletter.js'; // Impor fungsi handleAntiForwardedNewsletter

import treeKill from './lib/tree-kill.js';
import serialize, { Client } from './lib/serialize.js';
// Hapus impor sendTelegram
// import { formatSize, parseFileSize, sendTelegram } from './lib/function.js';

import { sendConnectionMessage } from './NOTIFIKASI/hehe.js'; // Impor fungsi sendConnectionMessage

const logger = pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` }).child({ class: 'Wilykun' });
logger.level = 'fatal';

const usePairingCode = process.env.PAIRING_NUMBER;
const store = makeInMemoryStore({ logger });

if (process.env.WRITE_STORE === 'true') store.readFromFile(`./${process.env.SESSION_NAME}/store.json`);

// check available file
const pathContacts = `./${process.env.SESSION_NAME}/contacts.json`;
const pathMetadata = `./${process.env.SESSION_NAME}/groupMetadata.json`;

const enableTyping = process.env.ENABLE_TYPING === 'true';
const enableRecording = process.env.ENABLE_RECORDING === 'true';
const autoOnlineAutoReadPesan = process.env.AUTO_ONLINE_AUTO_READ_PESAN === 'true';
const enableWelcomeMessage = process.env.ENABLE_WELCOME_MESSAGE === 'true';
const enableGoodbyeMessage = process.env.ENABLE_GOODBYE_MESSAGE === 'true';

const startSock = async () => {
	const { state, saveCreds } = await useMultiFileAuthState(`./${process.env.SESSION_NAME}`);
	const { version, isLatest } = await fetchLatestBaileysVersion();

	console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

	/**
	 * @type {import('baileys').WASocket}
	 */
	const Wilykun = makeWASocket.default({
		version,
		logger,
		printQRInTerminal: !usePairingCode,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		browser: Browsers.ubuntu('Chrome'),
		markOnlineOnConnect: false,
		generateHighQualityLinkPreview: true,
		syncFullHistory: true,
		retryRequestDelayMs: 10,
		transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 10 },
		defaultQueryTimeoutMs: undefined,
		maxMsgRetryCount: 15,
		appStateMacVerification: {
			patch: true,
			snapshot: true,
		},
		getMessage: async key => {
			const jid = jidNormalizedUser(key.remoteJid);
			const msg = await store.loadMessage(jid, key.id);

			return msg?.message || '';
		},
		shouldSyncHistoryMessage: msg => {
			console.log(`\x1b[32mMemuat Chat [${msg.progress}%]\x1b[39m`);
			return !!msg.syncType;
		},
	});

	store.bind(Wilykun.ev);
	await Client({ Wilykun, store });

	// login dengan pairing
	if (usePairingCode && !Wilykun.authState.creds.registered) {
		try {
			let phoneNumber = usePairingCode.replace(/[^0-9]/g, '');

			await delay(3000);
			let code = await Wilykun.requestPairingCode(phoneNumber);
			console.log(`\x1b[32m${code?.match(/.{1,4}/g)?.join('-') || code}\x1b[39m`);
		} catch {
			console.error('Gagal mendapatkan kode pairing');
			process.exit(1);
		}
	}

	// ngewei info, restart or close
	Wilykun.ev.on('connection.update', async update => {
		// Pindahkan penanganan pembaruan koneksi ke sini
		const { connection, lastDisconnect } = update;
		if (connection === 'close') {
			const error = lastDisconnect.error;
			const statusCode = error instanceof Boom ? error.output.statusCode : null;
			const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;
			console.log('Connection closed due to', error, ', reconnecting', shouldReconnect);
			// Coba untuk memulai ulang socket jika tidak logout atau otentikasi gagal
			if (shouldReconnect) {
				startSock();
			} else {
				console.log('Tidak dapat memulai ulang koneksi karena alasan:', statusCode);
				// Tambahkan log untuk alasan spesifik
				if (statusCode === 401) {
					console.log('Otentikasi gagal. Silakan periksa kredensial Anda.');
					 // Hapus file sesi jika otentikasi gagal
					try {
						fs.rmSync(`./${process.env.SESSION_NAME}`, { recursive: true, force: true });
						console.log('File sesi dihapus. Silakan buat ulang sesi.');
					} catch (err) {
						console.error('Gagal menghapus file sesi:', err);
					}
					// Tambahkan tindakan untuk menangani otentikasi gagal
					// Misalnya, Anda dapat mengirim notifikasi atau menghentikan proses
				} else if (statusCode === DisconnectReason.loggedOut) {
					console.log('Anda telah logout. Silakan login kembali.');
					// Tambahkan tindakan untuk menangani logout
					// Misalnya, Anda dapat menghapus sesi yang ada dan meminta login ulang
				} else if (statusCode === 515) {
					console.log('Stream Errored (restart required). Restarting...');
					// Restart setelah 5 detik
					setTimeout(() => startSock(), 5000);
				}
			}
		} else if (connection === 'open') {
			console.log('Connection opened');
			// Kirim pesan saat bot terhubung
			await sendConnectionMessage(Wilykun, null);
		}
	});

	// write session kang
	Wilykun.ev.on('creds.update', saveCreds);

	// contacts
	if (fs.existsSync(pathContacts)) {
		store.contacts = JSON.parse(fs.readFileSync(pathContacts, 'utf-8'));
	} else {
		fs.writeFileSync(pathContacts, JSON.stringify({}));
	}
	// group metadata
	if (fs.existsSync(pathMetadata)) {
		store.groupMetadata = JSON.parse(fs.readFileSync(pathMetadata, 'utf-8'));
	} else {
		fs.writeFileSync(pathMetadata, JSON.stringify({}));
	}

	// add contacts update to store
	Wilykun.ev.on('contacts.update', update => {
		for (let contact of update) {
			let id = jidNormalizedUser(contact.id);
			if (store && store.contacts) store.contacts[id] = { ...(store.contacts?.[id] || {}), ...(contact || {}) };
		}
	});

	// add contacts upsert to store
	Wilykun.ev.on('contacts.upsert', update => {
		for (let contact of update) {
			let id = jidNormalizedUser(contact.id);
			if (store && store.contacts) store.contacts[id] = { ...(contact || {}), isContact: true };
		}
	});

	// nambah perubahan grup ke store
	Wilykun.ev.on('groups.update', updates => {
		for (const update of updates) {
			const id = update.id;
			if (store.groupMetadata[id]) {
				store.groupMetadata[id] = { ...(store.groupMetadata[id] || {}), ...(update || {}) };
			}
		}
	});

	// merubah status member
	Wilykun.ev.on('group-participants.update', async update => {
		handleGroupParticipantsUpdate(store, update); // Gunakan fungsi handleGroupParticipantsUpdate
		if (enableWelcomeMessage) {
			await handleWelcomeMessage(Wilykun, update); // Gunakan fungsi handleWelcomeMessage
		}
		if (enableGoodbyeMessage) {
			await handleGoodbyeMessage(Wilykun, update); // Gunakan fungsi handleGoodbyeMessage
		}
	});

	// bagian pepmbaca status ono ng kene
	Wilykun.ev.on('messages.upsert', async ({ messages }) => {
		if (!messages[0].message) return;
		let m = await serialize(Wilykun, messages[0], store);

		// Handle auto typing, recording, and auto online/auto read pesan
		await handleAutoTyping(Wilykun, m);

		// nambah semua metadata ke store
		if (store.groupMetadata && Object.keys(store.groupMetadata).length === 0) store.groupMetadata = await Wilykun.groupFetchAllParticipating();

		// untuk membaca pesan status
		if (m.key && !m.key.fromMe && m.key.remoteJid === 'status@broadcast') {
			if (m.type === 'protocolMessage' && m.message.protocolMessage.type === 0) return;
			await Wilykun.readMessages([m.key]);
			await autoReactStatus(Wilykun, m);
			// Hapus bagian yang menambah jumlah status yang dilihat
			// incrementStatusViewCount();
			// incrementNoReactViewCount();
		}

		 // Hubungkan fitur anti forwarded newsletter message
		await handleAntiForwardedNewsletter(Wilykun, m);

		// Hubungkan fitur anti wa.me link
		await handleAntiWaMeLink(Wilykun, m, store);

		 // Hubungkan fitur hallo message
		await handleHalloMessage(Wilykun, m);

		// status self apa publik
		if (process.env.SELF === 'true' && !m.isOwner) return;

		// kanggo kes
		await (await import(`./message.js?v=${Date.now()}`)).default(Wilykun, store, m);
	});

	setInterval(async () => {
		// write contacts and metadata
		if (store.groupMetadata) fs.writeFileSync(pathMetadata, JSON.stringify(store.groupMetadata));
		if (store.contacts) fs.writeFileSync(pathContacts, JSON.stringify(store.contacts));

		// write store
		if (process.env.WRITE_STORE === 'true') store.writeToFile(`./${process.env.SESSION_NAME}/store.json`);

		 // Hapus bagian auto restart berdasarkan sisa RAM
	}, 10 * 1000); // tiap 10 detik

	if (process.env.HANDLE_ERRORS === 'true') {
		process.on('uncaughtException', function (err) {
			let e = String(err);
			if (e.includes("Socket connection timeout")) return;
			if (e.includes("item-not-found")) return;
			if (e.includes("rate-overlimit")) return;
			if (e.includes("Connection Closed")) return;
			if (e.includes("Timed Out")) return;
			if (e.includes("Value not found")) return;
			if (e.includes("Failed to decrypt message with any known session") || e.includes("Bad MAC")) {
				console.log('--------------------------------------------------');
				console.error('Session error detected:', e);
				console.log('Restarting due to session error...');
				console.log('--------------------------------------------------');
				setTimeout(() => startSock(), 5000); // Restart after 5 seconds
				return;
			}
			console.log('Caught exception: ', err);
		});

		process.on('unhandledRejection', console.error);
	}
};

startSock();
