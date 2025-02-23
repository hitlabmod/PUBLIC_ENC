import dotenv from 'dotenv';

dotenv.config(); // Load .env file

export async function handleAntiForwardedNewsletter(Wilykun, m, store) {
	if (process.env.ENABLE_ANTI_FORWARDED_NEWSLETTER === 'true' && m.key.remoteJid.endsWith('@g.us') && m.message?.extendedTextMessage?.contextInfo?.forwardingScore > 0 && !m.key.fromMe) {
		const contacts = store.contacts; // Gunakan store.contacts
		const participant = m.key.participant || m.key.remoteJid;
		const contact = contacts[participant] || {};
		const displayName = contact.notify || contact.vname || contact.name || participant.split('@')[0];
		const groupMetadata = await Wilykun.groupMetadata(m.key.remoteJid);
		const groupOwner = groupMetadata.owner;
		const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);

		// Cek apakah pengirim adalah admin atau bot
		if (admins.includes(participant) || participant === groupOwner) {
			console.log(`Forwarded newsletter message from admin or bot ${displayName} in group: ${m.key.remoteJid} not deleted`);
			return;
		}

		let ppuser;
		try {
			ppuser = await Wilykun.profilePictureUrl(participant, 'image');
		} catch {
			ppuser = 'https://files.catbox.moe/nuz3yc.jpeg'; // Gambar default jika tidak ada
		}

		await Wilykun.readMessages([m.key]); // Mark the message as read
		await Wilykun.sendMessage(m.key.remoteJid, { 
			image: { url: ppuser },
			caption: `Halo @${displayName}, pesan yang diteruskan terdeteksi dan telah dihapus. Mohon untuk tidak membagikan pesan tersebut lagi 🚫`,
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
