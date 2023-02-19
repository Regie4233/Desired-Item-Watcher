const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('advancedrequest')
		.setDescription('Track any website with advanced request.'),
	// async execute(interaction) {
	// 	await interaction.reply('test!');
	// },
};