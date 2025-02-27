import { delay } from 'baileys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import dotenv from 'dotenv';
import { getMusicUrls } from '../MP3_URL/music_url.js'; // Impor fungsi getMusicUrls

dotenv.config(); // Load .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_RETRIES = 2; // Kurangi jumlah retry
const RETRY_DELAY = 3000; // Kurangi waktu delay menjadi 3 detik

const sentWelcomeMessages = new Set(); // Set untuk melacak peserta yang sudah dikirim pesan selamat datang

function getUptimeBot() {
	const uptime = os.uptime();
	const hours = Math.floor(uptime / 3600);
	const minutes = Math.floor((uptime % 3600) / 60);
	return `${hours} jam ${minutes} menit`;
}

function formatDate() {
	const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
	return new Date().toLocaleDateString('id-ID', options).replace(/\./g, '');
}

export const handleWelcomeMessage = async (Wilykun, update) => {
	const { id, participants, action } = update;
	if (action !== 'add') return; // Hanya tangani peserta yang baru bergabung

	let retries = 0;
	while (retries < MAX_RETRIES) {
		try {
			const groupMetadata = await Wilykun.groupMetadata(id);
			const groupOwner = groupMetadata.owner;
			const groupCreationDate = new Date(groupMetadata.creation * 1000).toLocaleDateString('id-ID', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
			const adminCount = groupMetadata.participants.filter(p => p.admin).length;
			const memberCount = groupMetadata.participants.length;

			for (let participant of participants) {
				if (sentWelcomeMessages.has(participant)) continue; // Lewati jika pesan sudah dikirim

				let ppuser;
				try {
					ppuser = await Wilykun.profilePictureUrl(participant, 'image');
				} catch {
					ppuser = 'https://files.catbox.moe/nuz3yc.jpeg'; // Gambar default jika tidak ada
				}

				// Mengirim pesan selamat datang dengan gambar
				const welcomeMessage = {
					image: { url: ppuser },
					caption: `Selamat datang @${participant.split('@')[0]} di grup kami! Semoga betah dan jangan lupa baca peraturan grup ya! 😊
─
𝗦𝗲𝗯𝗲𝗹𝘂𝗺 𝗶𝘁𝘂 𝗽𝗲𝗿𝗸𝗲𝗻𝗮𝗹𝗸𝗮𝗻 𝗱𝘂𝗹𝘂 𝗸𝗮𝗺𝘂 : 
─
*NAMA: ...?* 📝
*UMUR: ...?* 🎂
*ASKOT: ...?* 🏙️
*PEKERJAAN: ...?* 💼
*HOBI: ...?* 🎨
*CITA-CITA: ...?* 🌟
─
*📢 INFORMASI GROUP 📢*
PEMBUAT GROUP : *{ @${groupOwner.split('@')[0]} 👤 }*
GROUP DI BUAT PADA : *{ ${groupCreationDate} 📅 }*
JUMLAH ADMIN SAAT INI : *{ ${adminCount} 👮 }*
JUMLAH ANGGOTA SAAT INI : *{ ${memberCount} 👥 }*`,
					contextInfo: {
						mentionedJid: [participant, groupOwner],
						forwardingScore: 100,
						isForwarded: true,
						forwardedNewsletterMessageInfo: {
							newsletterJid: '120363312297133690@newsletter',
							newsletterName: 'Info Anime Dll 🌟',
							serverMessageId: 143
						}
					}
				};

				await Wilykun.sendMessage(id, welcomeMessage);
				sentWelcomeMessages.add(participant); // Tandai peserta sebagai sudah dikirim pesan
				console.log(`Pesan selamat datang dikirim ke ${participant.split('@')[0]} di grup ${id}`);

				// Mengambil URL musik dari GitHub
				const musicUrls = await getMusicUrls();
				const randomMusicUrl = musicUrls[Math.floor(Math.random() * musicUrls.length)];
				const audioMessage = {
					audio: { url: randomMusicUrl },
					mimetype: 'audio/mpeg',
					ptt: false,
					contextInfo: {
						mentionedJid: [participant, groupOwner],
						forwardingScore: 100,
						isForwarded: true,
						forwardedNewsletterMessageInfo: {
							newsletterJid: '120363312297133690@newsletter',
							newsletterName: 'Info Anime Dll 🌟',
							serverMessageId: 143
						}
					}
				};

				await Wilykun.sendMessage(id, audioMessage);
				console.log(`Pesan audio selamat datang dikirim ke ${participant.split('@')[0]} di grup ${id}`);
			}
			break; // Keluar dari loop jika berhasil mengirim pesan
		} catch (error) {
			if (error.data === 429) {
				console.error('Rate limit exceeded, retrying...', error);
				retries++;
				await delay(RETRY_DELAY);
			} else {
				console.error('Gagal mengirim pesan selamat datang:', error);
				break; // Keluar dari loop jika kesalahan bukan karena rate limit
			}
		}
	}
};

if (process.env.HANDLE_ERRORS === 'true') {
	process.on('uncaughtException', function (err) {
		let e = String(err);
		if (e.includes("Socket connection timeout")) return;
		if (e.includes("item-not-found")) return;
		if (e.includes("rate-overlimit")) return;
		if (e.includes("Connection Closed")) return;
		if (e.includes("Timed Out")) return;
		if (e.includes("Value not found")) return;
		console.log('Caught exception: ', err);
	});

	process.on('unhandledRejection', console.error);
}
