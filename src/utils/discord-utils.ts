import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, User, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { MovieData } from '../types';
import { calculateResults } from '../services/vote-service';

/* This file is meant for Discord components and formatting */

export async function createSaveModal(interaction: ButtonInteraction, initialDetails: MovieData): Promise<MovieData> {
	try {
		// Create the modal
		const modal = new ModalBuilder()
			.setCustomId('addDetailsModal')
			.setTitle('Result to Save');

		// Create the text input components
		const editRankInput = new TextInputBuilder()
		.setCustomId('rankInput')
		.setLabel('SBIGRank')
		.setValue(initialDetails.sbigRank)
		.setStyle(TextInputStyle.Short);

		// Create the text input components
		const sbigNotesInput = new TextInputBuilder()
		.setCustomId('notesInput')
		.setLabel('Movie Notes')
		.setValue(initialDetails.sbigNotes)
		.setStyle(TextInputStyle.Short);

		// Create the text input components
		const editInput = new TextInputBuilder()
			.setCustomId('detailsInput')
			.setLabel('Any Corrections?')
			.setValue(JSON.stringify(initialDetails, null, '\n').replace(/\n\n/g, '\n'))
			.setStyle(TextInputStyle.Paragraph);

		const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(editRankInput);
		const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(sbigNotesInput);
		const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(editInput);
		modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
		await interaction.showModal(modal);
		const modalSubmitInteraction = await interaction.awaitModalSubmit({ time: 120000 });
		const detailsInput = modalSubmitInteraction.fields.getTextInputValue('detailsInput');
		modalSubmitInteraction.reply({ content: 'Result Saved!', ephemeral: true });

        const savedMovie:MovieData = JSON.parse(detailsInput);
		savedMovie.sbigRank = modalSubmitInteraction.fields.getTextInputValue('rankInput');

		savedMovie.sbigNotes = modalSubmitInteraction.fields.getTextInputValue('notesInput');

		return savedMovie;
	} catch (error) {
		console.error(error);
		return initialDetails;
	}
}

export function createMovieDetailsEmbed(movieData: MovieData, submitter: User): EmbedBuilder {
    const movieDetailsEmbed = new EmbedBuilder()
        .setColor(9662683)
        .setAuthor({ name: submitter.displayName, iconURL: submitter.avatarURL() || undefined })
        .setTitle(movieData.title)
        .setDescription(movieData.plot)
        .addFields(
            { name: `IMDB Rating: ${movieData.imdbRating}`, value: `${printOtherRatings(movieData.otherRatings)}`, inline: true },
            { name: 'Year', value: `${movieData.year}`, inline: true },
            { name: 'Runtime', value: `${movieData.runtime}`, inline: true },
            { name: 'Genre', value: `${movieData.genre}`, inline: true },
            { name: 'Rating', value: `${movieData.rating}`, inline: true },
            { name: 'Box Office', value: `${movieData.boxOffice}`, inline: true },
            { name: 'Actors', value: `${movieData.actors}`, inline: true },
            { name: 'Director', value: `${movieData.director}`, inline: true },
            { name: 'Writers', value: `${movieData.writers}`, inline: true }
        );

    if (movieData.image != 'N/A') {
        movieDetailsEmbed.setImage(movieData.image);
    }
    return movieDetailsEmbed;
}

function printOtherRatings(otherRatings: {Source: string, Value: string}[]) : string {
	let formattedString = '';
	if (otherRatings.length == 0) {
		return ' ';
	}

    for (const rating of otherRatings) {
        formattedString += `${rating.Source}: ${rating.Value}\n`;
    }
    return formattedString;
}
export function createVoteButtonActionRows(): ActionRowBuilder<ButtonBuilder>[] {
	const sButton = new ButtonBuilder()
		.setCustomId('👑')
		.setStyle(ButtonStyle.Primary)
		.setEmoji('👑');

	const aButton = new ButtonBuilder()
		.setCustomId('A')
		.setStyle(ButtonStyle.Primary)
		.setLabel('A');

	const bButton = new ButtonBuilder()
		.setCustomId('B')
		.setStyle(ButtonStyle.Primary)
		.setLabel('B');

	const cButton = new ButtonBuilder()
		.setCustomId('C')
		.setStyle(ButtonStyle.Primary)
		.setLabel('C');

	const dButton = new ButtonBuilder()
		.setCustomId('D')
		.setStyle(ButtonStyle.Primary)
		.setLabel('D');

	const fButton = new ButtonBuilder()
		.setCustomId('F')
		.setStyle(ButtonStyle.Primary)
		.setLabel('F');

	const skullButton = new ButtonBuilder()
		.setCustomId('\uD83D\uDC80')
		.setStyle(ButtonStyle.Danger)
		.setEmoji('\uD83D\uDC80');

	const endButton = new ButtonBuilder()
		.setCustomId('End')
		.setStyle(ButtonStyle.Secondary)
		.setLabel('End Vote');

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(sButton);
	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(aButton, bButton);
	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(cButton, dButton, fButton);
	const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(skullButton);
	const row4 = new ActionRowBuilder<ButtonBuilder>().addComponents(endButton);

	return [row, row1, row2, row3, row4];
}

export function createVotingResultsEmbed(voteResults: Map<string, Array<string>>, description: string): EmbedBuilder {

	const currentResultsEmbed = new EmbedBuilder()
		.setColor(39423)
		.setTitle(`Result: ${calculateResults(voteResults)}`)
		.setDescription(description)
		// .setThumbnail('https://i.imgur.com/AfFp7pu.png')
		.addFields(
			{ name: `${createEmbedNameString(voteResults, '👑')}`, value: `${createEmbedValueString(voteResults, '👑')}`, inline: true },
			{ name: `${createEmbedNameString(voteResults, 'A')}`, value: `${createEmbedValueString(voteResults, 'A')}`, inline: true },
			{ name: `${createEmbedNameString(voteResults, 'B')}`, value: `${createEmbedValueString(voteResults, 'B')}`, inline: true },
			{ name: `${createEmbedNameString(voteResults, 'C')}`, value: `${createEmbedValueString(voteResults, 'C')}`, inline: true },
			{ name: `${createEmbedNameString(voteResults, 'D')}`, value: `${createEmbedValueString(voteResults, 'D')}`, inline: true },
			{ name: `${createEmbedNameString(voteResults, 'F')}`, value: `${createEmbedValueString(voteResults, 'F')}`, inline: true },
			{ name: `${createEmbedNameString(voteResults, '\uD83D\uDC80')}`, value: `${createEmbedValueString(voteResults, '\uD83D\uDC80')}`, inline: true },
			{ name: 'Total Votes', value: `${voteResults.size}` }
		)
		.setTimestamp()
		.setFooter({ text: 'So Bad It\'s Good' });

	return currentResultsEmbed;
}

function createEmbedValueString(voteResults: Map<string, Array<string>>, vote: string): string {
	const voters = voteResults.get(vote);
	if (voters) {
		return `${voters.map((id) => `<@${id}>`).join(', ')}`;
	}
	else {
		return 'No votes';
	}
}

function createEmbedNameString(voteResults: Map<string, Array<string>>, vote: string): string {
	const voters = voteResults.get(vote);
	if (voters) {
		return `${vote} - ${voters.length}`;
	}
	else {
		return vote;
	}
}
