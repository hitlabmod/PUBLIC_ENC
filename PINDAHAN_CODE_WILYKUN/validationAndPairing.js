import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

export async function getPairingNumber() {
	return new Promise((resolve) => {
		console.log(chalk.blue.bold('\n==================== PAIRING SETUP ===================='));
		console.log(chalk.yellow('📱 Masukkan nomor WhatsApp Anda: '));
		rl.question(chalk.yellow('📱 Nomer Whatsappmu '), (answer) => {
			console.log(chalk.blue.bold('======================================================\n'));
			resolve(answer);
		});
	});
}

export async function validatePhoneNumber(phoneNumber) {
	const isValid = /^\d+$/.test(phoneNumber) && phoneNumber.length >= 10 && phoneNumber.length <= 15;
	return isValid;
}

export function logInvalidNumberInstructions() {
	console.log(chalk.red('❌ Nomor tidak valid. Silakan masukkan nomor yang benar.'));
	console.log(chalk.yellow('📋  Cara memasukkan nomor yang valid:'));
	console.log(chalk.yellow('1️⃣  Pastikan nomor hanya berisi angka.'));
	console.log(chalk.yellow('2️⃣  Jangan sertakan karakter selain angka (misalnya, tanda plus atau spasi).'));
	console.log(chalk.yellow('3️⃣  Panjang nomor harus antara 10 hingga 15 digit.'));
	console.log(chalk.yellow('📞  Contoh nomor yang valid: 6281234567890'));
}

export function logPairingInstructions(code) {
	console.log(chalk.green.bold('\n==================== PAIRING CODE ===================='));
	console.log(chalk.cyan.bold(`${code?.match(/.{1,4}/g)?.join('-') || code}`));
	console.log(chalk.green.bold('======================================================\n'));
	console.log(chalk.yellow('🔗 Gunakan kode di atas untuk menghubungkan bot dengan WhatsApp Anda.'));
	console.log(chalk.yellow('📋  Cara memasukkan pairing code di WhatsApp terbaru:'));
	console.log(chalk.yellow('1️⃣  Buka aplikasi WhatsApp di ponsel Anda.'));
	console.log(chalk.yellow('2️⃣  Ketuk ikon tiga titik di pojok kanan atas untuk membuka menu.'));
	console.log(chalk.yellow('3️⃣  Pilih "Perangkat Tertaut" dari menu.'));
	console.log(chalk.yellow('4️⃣  Ketuk "Tautkan Perangkat" dan masukkan pairing code yang ditampilkan di atas.'));
	console.log(chalk.yellow('5️⃣  Ikuti instruksi di layar untuk menyelesaikan proses pairing.'));
}
