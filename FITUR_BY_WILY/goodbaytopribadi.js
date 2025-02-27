import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

export async function handlePrivateGoodbyeMessage(Wilykun, update) {
    if (process.env.ENABLE_PRIVATE_GOODBYE_MESSAGE !== 'true') return;

    const { id, participants, action } = update;

    if (action === 'remove') {
        const groupMetadata = await Wilykun.groupMetadata(id);
        const groupName = groupMetadata.subject;

        for (const participant of participants) {
            const participantTag = `@${participant.split('@')[0]}`;

            // Get Profile Picture User
            let ppuser;
            try {
                ppuser = await Wilykun.profilePictureUrl(participant, 'image');
            } catch {
                ppuser = 'https://files.catbox.moe/nuz3yc.jpeg'; // Default image if not available
            }

            const message = `*── 「 GOODBYE 」 ──*\n\n` +
                            `*Selamat tinggal dari grup ${groupName}, ${participantTag}!*` +
                            `\n\n*Semoga sukses di masa depan!* 😊\n` +
                            `────────────────────`;

            await Wilykun.sendMessage(participant, {
                image: { url: ppuser },
                caption: message,
                contextInfo: {
                    mentionedJid: [participant],
                    forwardingScore: 100,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363312297133690@newsletter',
                        newsletterName: 'Info Anime Dll 🌟',
                        serverMessageId: 143
                    }
                }
            });
            console.log(chalk.green(`Pesan selamat tinggal dikirim ke ${participantTag} secara pribadi.`));
        }
    }
}
