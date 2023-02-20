const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('adminfetchall')
		.setDescription('Fetch all data from database'),
	// async execute(interaction) {
	// 	await console.log("admin commands: get all data");
	// },
};