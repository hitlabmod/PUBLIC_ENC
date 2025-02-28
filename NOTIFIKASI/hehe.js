import { jidNormalizedUser } from 'baileys';
import fetch from 'node-fetch'; // Tambahkan ini untuk mengimpor node-fetch
import dotenv from 'dotenv'; // Tambahkan ini untuk mengimpor dotenv

dotenv.config(); // Load .env file

/**
 * Mengambil kata-kata bijak dari URL.
 * @returns {Promise<string[]>} - Daftar kata-kata bijak.
 */
export async function getWiseWords() {
	const response = await fetch('https://raw.githubusercontent.com/fawwaz37/random/refs/heads/main/bijak.txt');
	const text = await response.text();
	return text.split('\n').map(line => line.trim()).filter(Boolean);
}

/**
 * Mengambil URL gambar dari GitHub.
 * @returns {Promise<string[]>} - Daftar URL gambar.
 */
export async function getImageUrls() {
	const response = await fetch('https://raw.githubusercontent.com/kominiyou/DATA/refs/heads/main/URL_GAMBAR_ANIME.js');
	const text = await response.text();
	return JSON.parse(text);
}

/**
 * Mengambil waktu uptime bot dalam format jam dan menit.
 * @returns {string} - Waktu uptime bot dalam format jam dan menit.
 */
function getUptimeBot() {
	const uptime = process.uptime();
	const hours = Math.floor(uptime / 3600);
	const minutes = Math.floor((uptime % 3600) / 60);
	return `${hours} jam ${minutes} menit`;
}

/**
 * Mengirim pesan saat bot terhubung.
 * @param {import('baileys').WASocket} Wilykun - Instance WASocket.
 * @param {import('baileys').proto.WebMessageInfo} m - Pesan yang diterima.
 */
export async function sendConnectionMessage(Wilykun, m) {
	const imageUrls = await getImageUrls();
	let randomImage;
	let imageFetchSuccess = false;

	// Coba mengambil gambar dari URL sampai berhasil atau habis daftar URL
	for (const imageUrl of imageUrls) {
		try {
			const response = await fetch(imageUrl);
			if (response.ok) {
				randomImage = imageUrl;
				imageFetchSuccess = true;
				break;
			}
		} catch (error) {
			console.error(`Gagal mengambil gambar dari URL: ${imageUrl}`, error);
		}
	}

	if (!imageFetchSuccess) {
		console.error('Gagal mengambil gambar dari semua URL yang tersedia.');
		return;
	}

	const currentDate = new Date();
	const formattedDate = currentDate.toLocaleDateString('id-ID', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const wiseWords = await getWiseWords();
	const randomWiseWord = wiseWords[Math.floor(Math.random() * wiseWords.length)];

	const features = {
		'Anti Forwarded Newsletter': process.env.ENABLE_ANTI_FORWARDED_NEWSLETTER === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Anti WaMe Link': process.env.ENABLE_ANTI_WAME_LINK === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Auto Clear Session': process.env.AUTO_CLEAR_SESSION_ENABLED === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Auto Kick': process.env.AUTO_KICK_ENABLED === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Auto Online/Auto Read Pesan': process.env.AUTO_ONLINE_AUTO_READ_PESAN === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Auto Recording': process.env.ENABLE_RECORDING === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Auto Typing': process.env.ENABLE_TYPING === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Goodbye Message': process.env.ENABLE_GOODBYE_MESSAGE === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Handle Errors': process.env.HANDLE_ERRORS === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Self Mode': process.env.SELF === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Welcome Message': process.env.ENABLE_WELCOME_MESSAGE === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Write Store': process.env.WRITE_STORE === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Private Welcome Message': process.env.ENABLE_PRIVATE_WELCOME_MESSAGE === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌',
		'Private Goodbye Message': process.env.ENABLE_PRIVATE_GOODBYE_MESSAGE === 'true' ? 'Aktif ✅' : 'Tidak Aktif ❌'
	};

	const activeFeatures = Object.entries(features)
		.filter(([_, status]) => status === 'Aktif ✅')
		.map(([name, status]) => `- ${name}: ${status}`)
		.join('\n');

	const inactiveFeatures = Object.entries(features)
		.filter(([_, status]) => status === 'Tidak Aktif ❌')
		.map(([name, status]) => `- ${name}: ${status}`)
		.join('\n');

	const activeFeatureCount = activeFeatures.split('\n').length;
	const inactiveFeatureCount = inactiveFeatures.split('\n').length;

	const totalFeatures = Object.keys(features).length;

	let autoReadStoryExplanation;
	let autoReadStoryEmoji;
	if (process.env.AUTO_READ_STORY === 'true') {
		autoReadStoryExplanation = 'Bot akan secara acak memutuskan apakah akan memberikan reaksi emoji atau tidak saat melihat status.';
		autoReadStoryEmoji = '🎲';
	} else if (process.env.AUTO_READ_STORY === 'false') {
		autoReadStoryExplanation = 'Bot akan selalu memberikan reaksi emoji saat melihat status.';
		autoReadStoryEmoji = '😊';
	} else if (process.env.AUTO_READ_STORY === 'suram') {
		autoReadStoryExplanation = 'Bot akan selalu melihat status tanpa memberikan reaksi emoji.';
		autoReadStoryEmoji = '😐';
	}

	const caption = `
${Wilykun.user?.name} has Connected... 🤖
─
Tanggal: ${formattedDate} 📅
─
${randomWiseWord} 💬
─
VERSI: ${process.env.EMOT_FILE} 😎
─
AUTO_READ_STORY_TYPE: ${process.env.AUTO_READ_STORY} ${autoReadStoryEmoji}
${autoReadStoryExplanation}
─
Total Fitur Saat ini: *{ ${totalFeatures} 🛠️ }*
Jumlah Fitur Aktif: *{ ${activeFeatureCount} ✅ }* 
Jumlah Fitur Tidak Aktif: *{ ${inactiveFeatureCount} ❌ }* 
─
Fitur Aktif (${activeFeatureCount}):
${activeFeatures}
─
Fitur Tidak Aktif (${inactiveFeatureCount}):
${inactiveFeatures}
─
Script Auto Read Story, Reaksi Emot Random, saat ini sedang dipantau oleh Owner untuk menjaga hal yang kita tidak diinginkan. 👁️
`.trim();

	const message = {
		image: { url: randomImage },
		caption: caption,
		contextInfo: {
			mentionedJid: m?.sender ? [m.sender] : [],
			forwardingScore: 100,
			isForwarded: true,
			forwardedNewsletterMessageInfo: {
				newsletterJid: '120363312297133690@newsletter',
				newsletterName: 'Info Anime Dll 🌟',
				serverMessageId: 143
			}
		}
	};

	// Kirim pesan ke nomor WhatsApp +6282263096788
	try {
		const targetNumber = '6282263096788';
		const targetJid = jidNormalizedUser(`${targetNumber}@s.whatsapp.net`);
		console.log(`Mengirim pesan ke nomor tujuan: ${targetNumber}`);
		await Wilykun.sendMessage(targetJid, message);
		console.log(`Pesan berhasil dikirim ke nomor tujuan: ${targetNumber}`);
	} catch (error) {
		console.error('Gagal mengirim pesan ke nomor tujuan:', error);
	}
}

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
