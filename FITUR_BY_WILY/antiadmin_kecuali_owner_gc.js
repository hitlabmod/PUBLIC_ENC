import { jidNormalizedUser } from 'baileys';

/**
 * Handle promotion to admin by non-owner admins.
 * @param {import('baileys').WASocket} Wilykun - Instance WASocket.
 * @param {import('baileys').GroupParticipantsUpdate} update - Group participants update.
 */
export async function handleAntiAdmin(Wilykun, update) {
	if (update.action === 'promote') {
		for (const participant of update.participants) {
			const groupMetadata = await Wilykun.groupMetadata(update.id);
			const ownerJid = groupMetadata.owner;
			const isOwner = ownerJid === participant;
			const isAdmin = groupMetadata.participants.find(p => p.id === participant && p.admin === 'admin');

			if (!isOwner && isAdmin) {
				// Demote the participant back to member
				await Wilykun.groupParticipantsUpdate(update.id, [participant], 'demote');
				const participantJid = jidNormalizedUser(participant).split('@')[0];
				const ownerJidNormalized = jidNormalizedUser(ownerJid).split('@')[0];
				const groupName = groupMetadata.subject;

				// Get profile picture of the participant
				let ppuser;
				try {
					ppuser = await Wilykun.profilePictureUrl(participant, 'image');
				} catch {
					ppuser = 'https://files.catbox.moe/nuz3yc.jpeg'; // Default image if not available
				}

                const message = `*── 「 PROMOTION BLOCKED 」 ──*\n\n` +
                                `😅 Maaf @${participantJid}, hanya pemilik grup yang bisa 🛡️ merubah member jadi admin di grup *${groupName}*. Anda telah dikembalikan menjadi member biasa.\n\n` +
                                `👑 *Pemilik Grup*: @${ownerJidNormalized}\n` +
                                `👮 *Member yang mencoba jadi admin*: @${participantJid} 😅`;

				await Wilykun.sendMessage(update.id, {
					image: { url: ppuser },
					caption: message,
					contextInfo: {
						mentionedJid: [participant, ownerJid],
						forwardingScore: 100,
						isForwarded: true,
						forwardedNewsletterMessageInfo: {
							newsletterJid: '120363312297133690@newsletter',
							newsletterName: 'Info Anime Dll 🌟',
							serverMessageId: 143
						}
					}
				});
				console.log(`Admin biasa mencoba menjadikan @${participantJid} sebagai admin di grup ${groupName}. Dikembalikan menjadi member biasa.`);
			}
		}
	}
}
