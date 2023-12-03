import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, User, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, hyperlink } from 'discord.js';
import { SubmitterStats, Tier } from '../types';
import { calculateAverageVote, calculateResults, convertVotingResultsToUserSelections, getTierByWeight } from '../services/vote-service';
import { TierListEntry } from '../lib/tier-list-entry';
import { OmdbData } from '../lib/omdb-data';
import { logToDevChannel } from './utils';

/* This file is meant for Discord components and formatting */

export async function createSaveModal<T>(interaction: ButtonInteraction, initialDetails: TierListEntry<T>): Promise<TierListEntry<T>> {
	try {
		// Create the modal
		const modal = new ModalBuilder()
			.setCustomId('addDetailsModal')
			.setTitle('Result to Save');

		// Create the text input components
		const categoryInput = new TextInputBuilder()
		.setCustomId('categoryInput')
		.setLabel('Category')
		.setValue('SBIGMovies')
		.setStyle(TextInputStyle.Short);

		// Create the text input components
		const editTierInput = new TextInputBuilder()
		.setCustomId('tierInput')
		.setLabel('Tier')
		.setValue(initialDetails.tier)
		.setStyle(TextInputStyle.Short);

		// Create the text input components
		const notesInput = new TextInputBuilder()
		.setCustomId('notesInput')
		.setLabel('Notes')
		.setValue(initialDetails.notes)
		.setRequired(false)
		.setStyle(TextInputStyle.Short);

		// Create the text input components
		const editInput = new TextInputBuilder()
			.setCustomId('detailsInput')
			.setLabel('Tier List Entry As JSON (Read-Only)')
			.setValue(JSON.stringify(initialDetails, null, '\n').replace(/\n\n/g, '\n'))
			.setStyle(TextInputStyle.Paragraph);

		const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput);
		const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(editTierInput);
		const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(notesInput);
		const fourthActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(editInput);
		modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

		await interaction.showModal(modal);
		const modalSubmitInteraction = await interaction.awaitModalSubmit({ time: 900000 });
		modalSubmitInteraction.reply({ content: `Result Saved by ${modalSubmitInteraction.user}` });
		initialDetails.tier = modalSubmitInteraction.fields.getTextInputValue('tierInput') as Tier;
		initialDetails.notes = modalSubmitInteraction.fields.getTextInputValue('notesInput');
		initialDetails.category = modalSubmitInteraction.fields.getTextInputValue('categoryInput');
		return initialDetails;
	} catch (error) {
		console.error(error);
		return initialDetails;
	}
}

export function createMovieDetailsEmbed(omdbData: OmdbData, submitter: User, notes: string): EmbedBuilder {
    const movieDetailsEmbed = new EmbedBuilder()
        .setColor(getColorForTier('default'))
        .setAuthor({ name: submitter.displayName, iconURL: submitter.avatarURL() || undefined })
        .setTitle(omdbData.title)
		.setURL(createImdbLink(omdbData.imdbId))
        .setDescription(omdbData.plot + notes)
        .addFields(
            { name: `IMDB Rating: ${omdbData.imdbRating}`, value: `${omdbData.printOtherRatings()}`, inline: true },
            { name: 'Year', value: `${omdbData.year}`, inline: true },
            { name: 'Runtime', value: `${omdbData.runtime}`, inline: true },
            { name: 'Genre', value: `${omdbData.genre}`, inline: true },
            { name: 'Rating', value: `${omdbData.rating}`, inline: true },
            { name: 'Box Office', value: `${omdbData.boxOffice}`, inline: true },
            { name: 'Actors', value: `${omdbData.actors}`, inline: true },
            { name: 'Director', value: `${omdbData.director}`, inline: true },
            { name: 'Writers', value: `${omdbData.writers}`, inline: true }
        );

    if (omdbData.image != 'N/A') {
        movieDetailsEmbed.setImage(omdbData.image);
    }
    return movieDetailsEmbed;
}

function createImdbLink(imdbId: string): string {
	return 'https://www.imdb.com/title/' + imdbId;
}

export function createTierListEntrySummaryEmbed<T>(tierListEntry: TierListEntry<T>, submitter: User): EmbedBuilder {
    const tierListEntrySummaryEmbed = new EmbedBuilder()
        .setColor(getColorForTier(tierListEntry.tier))
        .setAuthor({ name: submitter.displayName, iconURL: submitter.avatarURL() || undefined })
		.setFooter({ text: `${tierListEntry.category} - ${tierListEntry.tier} tier` });


	if (tierListEntry.isExternalDataOmdbData(tierListEntry.externalData)) {
		const movieData = tierListEntry.generateOmdbData();
		if (movieData) {
			tierListEntrySummaryEmbed.setTitle(movieData.title)
			.setURL(createImdbLink(movieData.imdbId))
			.setDescription(movieData.plot + tierListEntry.formatNotesString())
			.addFields(
				{ name: `IMDB Rating: ${movieData.imdbRating}`, value: movieData.printOtherRatings(), inline: true },
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
				tierListEntrySummaryEmbed.setThumbnail(movieData.image);
			}
		}
	}

    return tierListEntrySummaryEmbed;
}

function getColorForTier(rank: string) {
	switch (rank) {
		case (Tier.S): return 'Red';
		case (Tier.A): return 'Orange';
		case (Tier.B): return 'Yellow';
		case (Tier.C): return 'Green';
		case (Tier.D): return 'Blue';
		case (Tier.F): return 'Fuchsia';
		case (Tier.Skull): return 'DarkButNotBlack';
		default: return 9662683;
		}
}

export function createVoteButtonActionRows(): ActionRowBuilder<ButtonBuilder>[] {
	const sButton = new ButtonBuilder()
		.setCustomId(Tier.S)
		.setStyle(ButtonStyle.Primary)
		.setEmoji(Tier.S);

	const aButton = new ButtonBuilder()
		.setCustomId(Tier.A)
		.setStyle(ButtonStyle.Primary)
		.setLabel(Tier.A);

	const bButton = new ButtonBuilder()
		.setCustomId(Tier.B)
		.setStyle(ButtonStyle.Primary)
		.setLabel(Tier.B);

	const cButton = new ButtonBuilder()
		.setCustomId(Tier.C)
		.setStyle(ButtonStyle.Primary)
		.setLabel(Tier.C);

	const dButton = new ButtonBuilder()
		.setCustomId(Tier.D)
		.setStyle(ButtonStyle.Primary)
		.setLabel(Tier.D);

	const fButton = new ButtonBuilder()
		.setCustomId(Tier.F)
		.setStyle(ButtonStyle.Primary)
		.setLabel(Tier.F);

	const skullButton = new ButtonBuilder()
		.setCustomId(Tier.Skull)
		.setStyle(ButtonStyle.Danger)
		.setEmoji(Tier.Skull);

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
		.setColor(getColorForTier(calculateResults(voteResults)))
		.setTitle(`Result: ${calculateResults(voteResults)}`)
		.setDescription(description)
		.addFields(
			{ name: `${createVoteResultsEmbedNameString(voteResults, Tier.S)}`, value: `${createVoteResultsEmbedValueString(voteResults, Tier.S)}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, Tier.A)}`, value: `${createVoteResultsEmbedValueString(voteResults, Tier.A)}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, Tier.B)}`, value: `${createVoteResultsEmbedValueString(voteResults, Tier.B)}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, Tier.C)}`, value: `${createVoteResultsEmbedValueString(voteResults, Tier.C)}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, Tier.D)}`, value: `${createVoteResultsEmbedValueString(voteResults, Tier.D)}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, Tier.F)}`, value: `${createVoteResultsEmbedValueString(voteResults, Tier.F)}`, inline: true },
			{ name: `${createVoteResultsEmbedNameString(voteResults, Tier.Skull)}`, value: `${createVoteResultsEmbedValueString(voteResults, Tier.Skull)}`, inline: true },
			{ name: 'Total Votes', value: `${convertVotingResultsToUserSelections(voteResults).size}` }
		);

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

export function createTierListSummaryEmbed<T>(tierListEntries: TierListEntry<T>[], title: string): EmbedBuilder {
    const tierListSummaryEmbed = new EmbedBuilder()
        .setColor(9662683)
        .setTitle(title)
		.setDescription(`Total: ${tierListEntries.length}\nAverage: ${calculateAverageVote(tierListEntries)}`)
        .addFields(
            { name: createTierListSummaryEmbedNameString(tierListEntries, Tier.S), value: createTierListSummaryEmbedValueString(tierListEntries, Tier.S) },
            { name: createTierListSummaryEmbedNameString(tierListEntries, Tier.A), value: createTierListSummaryEmbedValueString(tierListEntries, Tier.A) },
            { name: createTierListSummaryEmbedNameString(tierListEntries, Tier.B), value: createTierListSummaryEmbedValueString(tierListEntries, Tier.B) },
            { name: createTierListSummaryEmbedNameString(tierListEntries, Tier.C), value: createTierListSummaryEmbedValueString(tierListEntries, Tier.C) },
            { name: createTierListSummaryEmbedNameString(tierListEntries, Tier.D), value: createTierListSummaryEmbedValueString(tierListEntries, Tier.D) },
            { name: createTierListSummaryEmbedNameString(tierListEntries, Tier.F), value: createTierListSummaryEmbedValueString(tierListEntries, Tier.F) },
            { name: createTierListSummaryEmbedNameString(tierListEntries, Tier.Skull), value: createTierListSummaryEmbedValueString(tierListEntries, Tier.Skull) },
        );

    return tierListSummaryEmbed;
}

export function createPlayerSummaryEmbed(submitterScores: SubmitterStats[]): EmbedBuilder {
    const summaryEmbed = new EmbedBuilder()
        .setColor(9662683)
        .setTitle('Player Stats');

	return generatePlayerRankings(submitterScores, summaryEmbed);
}

function createTierListSummaryEmbedValueString<T>(tierListEntries: TierListEntry<T>[], tier: string): string {
	const entriesOfThisRank = tierListEntries.filter(entry => entry.tier === tier);
	if (entriesOfThisRank.length > 0) {
		return `${entriesOfThisRank.map((entryData) => `${hyperlink((entryData.externalData as OmdbData).title, createImdbLink(entryData.externalDataId as string))} - <@${entryData.submitter}>`).join('\n')}`;
	}
	else {
		return 'No Entries';
	}
}

function createTierListSummaryEmbedNameString<T>(tierListEntries: TierListEntry<T>[], tier: string): string {
	const entriesOfThisRank = tierListEntries.filter(entry => entry.tier === tier);
	if (entriesOfThisRank) {
		return `${tier} - ${entriesOfThisRank.length}`;
	}
	else {
		return tier;
	}
}

function generatePlayerRankings(submitterStats: SubmitterStats[], summaryEmbed: EmbedBuilder): EmbedBuilder {
	submitterStats.forEach((submitterStat) => {
		summaryEmbed.addFields({
			name:` Average: ${submitterStat.averageSubmissionScore} (${getTierByWeight(Math.round(Number(submitterStat.averageSubmissionScore)))})`,
			value:`<@${submitterStat.submitter}>\nTotal Submissions: ${submitterStat.totalSubmissions}\nScore: ${submitterStat.totalScore}` });
	});
    return summaryEmbed;
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
			.setCustomId('Tier')
			.setPlaceholder('Filter by Tier')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(Tier.S)
					.setValue(Tier.S),
				new StringSelectMenuOptionBuilder()
					.setLabel(Tier.A)
					.setValue(Tier.A),
				new StringSelectMenuOptionBuilder()
					.setLabel(Tier.B)
					.setValue(Tier.B),
				new StringSelectMenuOptionBuilder()
					.setLabel(Tier.C)
					.setValue(Tier.C),
				new StringSelectMenuOptionBuilder()
					.setLabel(Tier.D)
					.setValue(Tier.D),
				new StringSelectMenuOptionBuilder()
					.setLabel(Tier.F)
					.setValue(Tier.F),
				new StringSelectMenuOptionBuilder()
					.setLabel(Tier.Skull)
					.setValue(Tier.Skull),
			)
			.setMinValues(1)
			.setMaxValues(7);

	const playerFilter = new UserSelectMenuBuilder()
					.setCustomId('submitter')
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