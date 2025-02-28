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
import chalk from 'chalk'; // Pastikan chalk diimpor
import path from 'path'; // Pastikan path diimpor
import readline from 'readline'; // Tambahkan impor readline
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
import { handleAntiChannelLink } from './FITUR_BY_WILY/ANTI_GC/antisaluran.js'; // Impor fungsi handleAntiChannelLink
import { handleAntiGroupLink } from './FITUR_BY_WILY/ANTI_GC/antigroup.js'; // Import the new function
import { handleGroupChat } from './FITUR_BY_WILY/buka_tutup_gc.js'; // Impor fungsi handleGroupChat
import { handlePrivateWelcomeMessage } from './FITUR_BY_WILY/welcometopribadi.js'; // Impor fungsi handlePrivateWelcomeMessage
import { handlePrivateGoodbyeMessage } from './FITUR_BY_WILY/goodbaytopribadi.js'; // Impor fungsi handlePrivateGoodbyeMessage

import treeKill from './lib/tree-kill.js';
import serialize, { Client } from './lib/serialize.js';
// Hapus impor sendTelegram
// import { formatSize, parseFileSize, sendTelegram } from './lib/function.js';

import { sendConnectionMessage } from './NOTIFIKASI/hehe.js'; // Impor fungsi sendConnectionMessage
import { sendTelegram } from './lib/function.js'; // Impor fungsi sendTelegram
import { autoClearSession } from './CLEAR_SESSION/autoclearsession.js'; // Impor fungsi autoClearSession
import { handleConnectionUpdate } from './PINDAHAN_CODE_WILYKUN/connectionHandler.js';
import { getPairingNumber, validatePhoneNumber, logInvalidNumberInstructions, logPairingInstructions } from './PINDAHAN_CODE_WILYKUN/validationAndPairing.js';

const logger = pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` }).child({ class: 'Wilykun' });
logger.level = 'fatal';

const usePairingCode = process.env.PAIRING_NUMBER;
const store = makeInMemoryStore({ logger });

if (process.env.WRITE_STORE === 'true') store.readFromFile(path.join(process.cwd(), process.env.SESSION_DIR, 'store.json'));

// check available file
const pathContacts = path.join(process.cwd(), process.env.SESSION_DIR, 'contacts.json');
const pathMetadata = path.join(process.cwd(), process.env.SESSION_DIR, 'groupMetadata.json');

const enableTyping = process.env.ENABLE_TYPING === 'true';
const enableRecording = process.env.ENABLE_RECORDING === 'true';
const autoOnlineAutoReadPesan = process.env.AUTO_ONLINE_AUTO_READ_PESAN === 'true';
const enableWelcomeMessage = process.env.ENABLE_WELCOME_MESSAGE === 'true';
const enableGoodbyeMessage = process.env.ENABLE_GOODBYE_MESSAGE === 'true';
const enableAntiChannelLink = process.env.ENABLE_ANTI_CHANNEL_LINK === 'true';
const enableAntiGroupLink = process.env.ENABLE_ANTI_GROUP_LINK === 'true';

// Jalankan saat panel start jika diaktifkan
if (process.env.AUTO_CLEAR_SESSION_ENABLED === 'true') {
    autoClearSession();
}

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const startSock = async () => {
	const { state, saveCreds } = await useMultiFileAuthState(path.join(process.cwd(), process.env.SESSION_DIR));
	const { version, isLatest } = await fetchLatestBaileysVersion();

	console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

	/**
	 * @type {import('baileys').WASocket}
	 */
	const Wilykun = makeWASocket.default({
		version,
		logger,
		printQRInTerminal: false, // Ubah menjadi false agar default ke pairing code
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
	if (!Wilykun.authState.creds.registered) {
		let phoneNumber;
		let isValid = false;

		while (!isValid) {
			phoneNumber = await getPairingNumber();
			isValid = await validatePhoneNumber(phoneNumber);

			if (!isValid) {
				logInvalidNumberInstructions();
			}
		}

		// Buat folder sesi hanya setelah nomor yang valid dimasukkan
		const sessionDir = path.join(process.cwd(), process.env.SESSION_DIR);
		if (fs.existsSync(sessionDir)) {
			fs.rmSync(sessionDir, { recursive: true, force: true });
			console.log(chalk.green(`📁 Folder sesi dihapus di: ${sessionDir}`));
		}
		fs.mkdirSync(sessionDir, { recursive: true });
		console.log(chalk.green(`📁 Folder sesi dibuat di: ${sessionDir}`));

		try {
			await delay(3000);
			let code = await Wilykun.requestPairingCode(phoneNumber);
			logPairingInstructions(code);
		} catch {
			console.error(chalk.red('❌ Gagal mendapatkan kode pairing'));
			process.exit(1);
		}
	}

	// ngewei info, restart or close
	Wilykun.ev.on('connection.update', async update => {
		await handleConnectionUpdate(update, startSock);
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
		await handlePrivateWelcomeMessage(Wilykun, update); // Tambahkan panggilan ke handlePrivateWelcomeMessage
		await handlePrivateGoodbyeMessage(Wilykun, update); // Tambahkan panggilan ke handlePrivateGoodbyeMessage
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

		// Hubungkan fitur anti channel link jika diaktifkan
		if (enableAntiChannelLink) {
			await handleAntiChannelLink(Wilykun, m, store);
		}

		// Hubungkan fitur anti group link jika diaktifkan
		if (enableAntiGroupLink) {
			await handleAntiGroupLink(Wilykun, m, store);
		}

		// Hubungkan fitur hallo message
		await handleHalloMessage(Wilykun, m);

		// status self apa publik
		if (process.env.SELF === 'true' && !m.isOwner) return;

		// kanggo kes
		await (await import(`./message.js?v=${Date.now()}`)).default(Wilykun, store, m);
	});

	Wilykun.ev.on('messages.upsert', async ({ messages }) => {
		await handleGroupChat(Wilykun, store, messages); // Pindahkan penanganan ke handleGroupChat
	});

	setInterval(async () => {
		// write contacts and metadata
		if (store.groupMetadata) fs.writeFileSync(pathMetadata, JSON.stringify(store.groupMetadata));
		if (store.contacts) fs.writeFileSync(pathContacts, JSON.stringify(store.contacts));

		// write store
		if (process.env.WRITE_STORE === 'true') store.writeToFile(path.join(process.cwd(), process.env.SESSION_DIR, 'store.json'));

		 // Hapus bagian auto restart berdasarkan sisa RAM
	}, 10 * 1000); // tiap 10 detik

	if (process.env.HANDLE_ERRORS === 'true') {
		process.on('uncaughtException', function (err) {
			let e = String(err);
			const ignoredErrors = [
				"Socket connection timeout",
				"item-not-found",
				"rate-overlimit",
				"Connection Closed",
				"Timed Out",
				"Value not found",
				"Failed to decrypt message with any known session",
				"Bad MAC",
				"Closing open session for new outgoing prekey bundle",
				"Closing session: SessionEntry"
			];
			if (ignoredErrors.some(ignoredError => e.includes(ignoredError))) return;
			console.log('Caught exception: ', err);
		});

		process.on('unhandledRejection', function (reason, promise) {
			let e = String(reason);
			const ignoredErrors = [
				"Socket connection timeout",
				"item-not-found",
				"rate-overlimit",
				"Connection Closed",
				"Timed Out",
				"Value not found",
				"Failed to decrypt message with any known session",
				"Bad MAC",
				"Closing open session for new outgoing prekey bundle",
				"Closing session: SessionEntry"
			];
			if (ignoredErrors.some(ignoredError => e.includes(ignoredError))) return;
			console.error('Unhandled rejection at:', promise, 'reason:', reason);
		});
	}
};

startSock();
