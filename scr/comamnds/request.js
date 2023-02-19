const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('requestform')
		.setDescription('Opens a request form'),
	// async execute(interaction) {
	// 	await interaction.reply('test!');
	// },
};