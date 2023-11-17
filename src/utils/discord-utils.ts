import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, User, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, bold } from 'discord.js';
import { MovieData, SubmitterScores } from '../types';
import { calculateAverageVote, calculateResults, getKeyByWeight } from '../services/vote-service';

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
		.setRequired(false)
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
		const modalSubmitInteraction = await interaction.awaitModalSubmit({ time: 900000 });
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
        .setColor(getColorForRank(movieData.sbigRank))
        .setAuthor({ name: submitter.displayName, iconURL: submitter.avatarURL() || undefined })
        .setTitle(movieData.title)
        .setDescription(movieData.plot + addSbigNotes(movieData.sbigNotes))
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

export function createMovieSummaryEmbed(movieData: MovieData, submitter: User): EmbedBuilder {
    const movieDetailsEmbed = new EmbedBuilder()
        .setColor(getColorForRank(movieData.sbigRank))
        .setAuthor({ name: submitter.displayName, iconURL: submitter.avatarURL() || undefined })
        .setTitle(movieData.title)
        .setDescription(movieData.plot + addSbigNotes(movieData.sbigNotes))
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
        )
		.setFooter({ text: `Rank: ${movieData.sbigRank}` });

    if (movieData.image != 'N/A') {
        movieDetailsEmbed.setThumbnail(movieData.image);
    }
    return movieDetailsEmbed;
}

function getColorForRank(rank: string) {
	switch (rank) {
		case ('👑'): return 'Red';
		case ('A'): return 'Orange';
		case ('B'): return 'Yellow';
		case ('C'): return 'Green';
		case ('D'): return 'Blue';
		case ('F'): return 'Fuchsia';
		case ('\uD83D\uDC80'): return 'DarkButNotBlack';
		default: return 9662683;
		}
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

function addSbigNotes(sbigNotes : string) : string {
	if (sbigNotes !== '') {
		return `\n\n${bold('SBIG Notes:')} ${sbigNotes}`;
	}
	return sbigNotes;
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
		.setColor(getColorForRank(calculateResults(voteResults)))
		.setTitle(`Result: ${calculateResults(voteResults)}`)
		.setDescription(description)
		.addFields(
			{ name: `${createVoteResultsEmbedNameString(voteResults, '👑')}`, value: `${createVoteResultsEmbedValueString(voteResults, '👑')}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, 'A')}`, value: `${createVoteResultsEmbedValueString(voteResults, 'A')}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, 'B')}`, value: `${createVoteResultsEmbedValueString(voteResults, 'B')}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, 'C')}`, value: `${createVoteResultsEmbedValueString(voteResults, 'C')}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, 'D')}`, value: `${createVoteResultsEmbedValueString(voteResults, 'D')}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, 'F')}`, value: `${createVoteResultsEmbedValueString(voteResults, 'F')}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, '\uD83D\uDC80')}`, value: `${createVoteResultsEmbedValueString(voteResults, '\uD83D\uDC80')}`, inline: true },
			{ name: 'Total Votes', value: `${voteResults.size}` }
		)
		.setTimestamp()
		.setFooter({ text: 'So Bad It\'s Good' });

	return currentResultsEmbed;
}

function createVoteResultsEmbedValueString(voteResults: Map<string, Array<string>>, vote: string): string {
	const voters = voteResults.get(vote);
	if (voters) {
		return `${voters.map((id) => `<@${id}>`).join(', ')}`;
	}
	else {
		return 'No votes';
	}
}

function createVoteResultsEmbedNameString(voteResults: Map<string, Array<string>>, vote: string): string {
	const voters = voteResults.get(vote);
	if (voters) {
		return `${vote} - ${voters.length}`;
	}
	else {
		return vote;
	}
}

export function createSbigSummaryEmbed(sbigMovieData: MovieData[], title: string): EmbedBuilder {
    const sbigSummaryEmbed = new EmbedBuilder()
        .setColor(9662683)
        .setTitle(title)
		.setDescription(`Total Movies: ${sbigMovieData.length}\nAverage: ${calculateAverageVote(sbigMovieData)}`)
        .addFields(
            { name: createSbigSummaryEmbedNameString(sbigMovieData, '👑'), value: createSbigSummaryEmbedValueString(sbigMovieData, '👑') },
            { name: createSbigSummaryEmbedNameString(sbigMovieData, 'A'), value: createSbigSummaryEmbedValueString(sbigMovieData, 'A') },
            { name: createSbigSummaryEmbedNameString(sbigMovieData, 'B'), value: createSbigSummaryEmbedValueString(sbigMovieData, 'B') },
            { name: createSbigSummaryEmbedNameString(sbigMovieData, 'C'), value: createSbigSummaryEmbedValueString(sbigMovieData, 'C') },
            { name: createSbigSummaryEmbedNameString(sbigMovieData, 'D'), value: createSbigSummaryEmbedValueString(sbigMovieData, 'D') },
            { name: createSbigSummaryEmbedNameString(sbigMovieData, 'F'), value: createSbigSummaryEmbedValueString(sbigMovieData, 'F') },
            { name: createSbigSummaryEmbedNameString(sbigMovieData, '\uD83D\uDC80'), value: createSbigSummaryEmbedValueString(sbigMovieData, '\uD83D\uDC80') },
        );

    return sbigSummaryEmbed;
}

export function createSbigPlayerSummaryEmbed(submitterScores: SubmitterScores[]): EmbedBuilder {
    const sbigSummaryEmbed = new EmbedBuilder()
        .setColor(9662683)
        .setTitle('SBIG Player Rankings');

	return generatePlayerRankings(submitterScores, sbigSummaryEmbed);
}

function createSbigSummaryEmbedValueString(sbigMovieData: MovieData[], rank: string): string {
	const moviesOfThisRank = sbigMovieData.filter(movie => movie.sbigRank === rank);
	if (moviesOfThisRank.length > 0) {
		return `${moviesOfThisRank.map((movieData) => `${movieData.title} - <@${movieData.sbigSubmitter}>`).join('\n')}`;
	}
	else {
		return 'No Movies';
	}
}

function createSbigSummaryEmbedNameString(sbigMovieData: MovieData[], rank: string): string {
	const moviesOfThisRank = sbigMovieData.filter(movie => movie.sbigRank === rank);
	if (moviesOfThisRank) {
		return `${rank} - ${moviesOfThisRank.length}`;
	}
	else {
		return rank;
	}
}

function generatePlayerRankings(submitterScores: SubmitterScores[], sbigSummaryEmbed: EmbedBuilder): EmbedBuilder {
	submitterScores.forEach((submitterScore) => {
		sbigSummaryEmbed.addFields({ name:` Score: ${submitterScore.totalScore}`, value:`<@${submitterScore.sbigSubmitter}>\nTotal Submissions: ${submitterScore.totalSubmissions}\nAverage Rank: ${submitterScore.averageRank} (${getKeyByWeight(Math.round(Number(submitterScore.averageRank)))})` });
	});
    return sbigSummaryEmbed;
}

export function createPaginationButtonActionRow(): ActionRowBuilder<ButtonBuilder> {
	const nextButton = new ButtonBuilder()
		.setCustomId('Next')
		.setStyle(ButtonStyle.Primary)
		.setLabel('Next');

	const prevButton = new ButtonBuilder()
		.setCustomId('Prev')
		.setStyle(ButtonStyle.Primary)
		.setLabel('Prev');

	const firstButton = new ButtonBuilder()
		.setCustomId('First')
		.setStyle(ButtonStyle.Primary)
		.setLabel('First');

	const lastButton = new ButtonBuilder()
		.setCustomId('Last')
		.setStyle(ButtonStyle.Primary)
		.setLabel('Last');

	const stopButton = new ButtonBuilder()
		.setCustomId('Stop')
		.setStyle(ButtonStyle.Danger)
		.setLabel('Stop');

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(firstButton, prevButton, stopButton, nextButton, lastButton);

	return row;
}

export function createSelectMenus() {
	const rankFilter = new StringSelectMenuBuilder()
			.setCustomId('Rank')
			.setPlaceholder('Filter by Rank')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('👑')
					.setValue('👑'),
				new StringSelectMenuOptionBuilder()
					.setLabel('A')
					.setValue('A'),
				new StringSelectMenuOptionBuilder()
					.setLabel('B')
					.setValue('B'),
				new StringSelectMenuOptionBuilder()
					.setLabel('C')
					.setValue('C'),
				new StringSelectMenuOptionBuilder()
					.setLabel('D')
					.setValue('D'),
				new StringSelectMenuOptionBuilder()
					.setLabel('F')
					.setValue('F'),
				new StringSelectMenuOptionBuilder()
					.setLabel('\uD83D\uDC80')
					.setValue('\uD83D\uDC80'),
			)
			.setMinValues(1)
			.setMaxValues(7);

	const playerFilter = new UserSelectMenuBuilder()
					.setCustomId('sbigSubmitter')
					.setPlaceholder('Filter by Submitter')
					.setMinValues(1)
					.setMaxValues(10);

	const numberOfResultsSelector = new StringSelectMenuBuilder()
			.setCustomId('numberOfResults')
			.setPlaceholder('Number of results')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('1')
					.setValue('1'),
				new StringSelectMenuOptionBuilder()
					.setLabel('2')
					.setValue('2'),
				new StringSelectMenuOptionBuilder()
					.setLabel('3')
					.setValue('3'),
				new StringSelectMenuOptionBuilder()
					.setLabel('4')
					.setValue('4'),
				new StringSelectMenuOptionBuilder()
					.setLabel('5')
					.setValue('5'),
				new StringSelectMenuOptionBuilder()
					.setLabel('6')
					.setValue('6'),
				new StringSelectMenuOptionBuilder()
					.setLabel('7')
					.setValue('7'),
				new StringSelectMenuOptionBuilder()
					.setLabel('8')
					.setValue('8'),
				new StringSelectMenuOptionBuilder()
					.setLabel('9')
					.setValue('9'),
				new StringSelectMenuOptionBuilder()
					.setLabel('10')
					.setValue('10'),
			);
	const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(rankFilter);
	const row2 = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(playerFilter);
	const row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(numberOfResultsSelector);
	return [row1, row2, row3];
}