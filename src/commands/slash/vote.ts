import { MessageReaction, SlashCommandBuilder, User } from 'discord.js';
import { SlashCommand } from '../../types';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('Triggers a ranking vote for the movie.'),
	async execute(interaction) {

    // Send a message useres can react to
    const message = await interaction.reply({content: 'React to this message to vote!', fetchReply: true });

    // Then, you need to create reaction collectors to collect the reactions. 
    // You can use the createReactionCollector method of the Message class. 
    // This method takes a filter function and an options object. 
    // The filter function is used to determine which reactions should be collected.
    const filter = (reaction: MessageReaction, user: User) => {
      // Add your conditions here. For example, you can check if the reaction is a certain emoji.
      return !!reaction.emoji.name && ['👑', '👎'].includes(reaction.emoji.name);
    };
    
    // Collect reactions for 120 seconds
    const collector = message.createReactionCollector({ filter, time: 120000 });

    // You can listen to the collect event of the collector to handle collected reactions:
    collector.on('collect', (reaction, user) => {
      console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
    });

    collector.on('end', collected => {
      console.log(`Collected ${collected.size} items`);
    });

    // Add the reactions that users can react with.
    await message.react('👑');
    await message.react('🇦');
    await message.react('🇧');
    await message.react('🇨');
    await message.react('🇩');
    await message.react('\uD83D\uDC80'); // Skull Emoji
  },
};
