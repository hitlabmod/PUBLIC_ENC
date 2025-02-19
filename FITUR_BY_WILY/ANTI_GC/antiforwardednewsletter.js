import dotenv from 'dotenv';
import { images } from '../../NOTIFIKASI/Url_Images_Anime.js'; // Impor URL gambar

dotenv.config(); // Load .env file

export async function handleAntiForwardedNewsletter(Wilykun, m, store) {
	if (process.env.ENABLE_ANTI_FORWARDED_NEWSLETTER === 'true' && m.key.remoteJid.endsWith('@g.us') && (m.message.conversation || m.message.extendedTextMessage?.text) && !m.key.fromMe) {
		const messageText = m.message.conversation || m.message.extendedTextMessage?.text;
		if (m.message.contextInfo?.forwardedNewsletterMessageInfo) {
			const participant = m.key.participant || m.key.remoteJid;
			const contact = store.contacts[participant] || {};
			const displayName = contact.notify || contact.vname || contact.name || participant.split('@')[0];
			const groupMetadata = await Wilykun.groupMetadata(m.key.remoteJid);
			const groupOwner = groupMetadata.owner;
			const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);

			// Cek apakah pengirim adalah admin atau bot
			if (admins.includes(participant) || participant === groupOwner) {
				console.log(`Forwarded newsletter message from admin or bot ${displayName} in group: ${m.key.remoteJid} not deleted`);
				return;
			}

			const randomImageUrl = images[Math.floor(Math.random() * images.length)]; // Pilih gambar random

			await Wilykun.readMessages([m.key]); // Mark the message as read
			await Wilykun.sendMessage(m.key.remoteJid, { 
				image: { url: randomImageUrl },
				caption: `Halo @${displayName}, pesan newsletter terdeteksi dan telah dihapus. Mohon untuk tidak membagikan pesan tersebut lagi 🚫`,
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
			}, { quoted: m });
			await Wilykun.sendMessage(m.key.remoteJid, { delete: m.key });
			console.log(`Deleted forwarded newsletter message from ${displayName} in group: ${m.key.remoteJid}`);
		}
	}
}
