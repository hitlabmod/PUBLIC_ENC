import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

export async function handlePrivateWelcomeMessage(Wilykun, update) {
    if (process.env.ENABLE_PRIVATE_WELCOME_MESSAGE !== 'true') return;

    const { id, participants, action } = update;

    if (action === 'add') {
        const groupMetadata = await Wilykun.groupMetadata(id);
        const groupName = groupMetadata.subject;
        const groupParticipants = groupMetadata.participants;

        for (const participant of participants) {
            const participantTag = `@${participant.split('@')[0]}`;
            const memberCount = groupParticipants.length;

            // Get Profile Picture User
            let ppuser;
            try {
                ppuser = await Wilykun.profilePictureUrl(participant, 'image');
            } catch {
                ppuser = 'https://files.catbox.moe/nuz3yc.jpeg'; // Default image if not available
            }

            const message = `*── 「 WELCOME 」 ──*\n\n` +
                            `*Selamat datang di grup ${groupName}, ${participantTag}!*` +
                            `\n\n*Selamat!* Kamu anggota ke-${memberCount} di grup ini.` +
                            `\n\n*Semoga betah ya* 😊\n` +
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
            console.log(chalk.green(`Pesan selamat datang dikirim ke ${participantTag} secara pribadi.`));
        }
    }
}
