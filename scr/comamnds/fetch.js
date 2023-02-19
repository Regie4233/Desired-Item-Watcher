const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('showitems')
		.setDescription('Fetch all tracked items in your account'),
	// async execute(interaction) {
	// 	await interaction.reply('test!');
	// },
};