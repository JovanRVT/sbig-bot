import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import fs from 'fs';
import { MovieData } from '../types';

export function upsertMovie(movie: MovieData, filePath:string) {
    const data = fs.readFileSync(filePath, 'utf-8');
    const movies: MovieData[] = JSON.parse(data);

	// Check if movie with the same imdbId already exists
	const duplicate = findDuplicateMovie(filePath, movie.imdbId);
	if (duplicate) {
		console.log('Movie with the same imdbId already exists, calling update');
		updateMovie(movie.imdbId, movie, filePath);
		return;
	}

    movies.push(movie);
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
}

// Read
export function readMovies(filePath: string): MovieData[] {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

export function findDuplicateMovie(filePath: string, search:string) : MovieData | undefined {
	const data = fs.readFileSync(filePath, 'utf-8');
    const movies: MovieData[] = JSON.parse(data);

	return (movies.find(m => m.imdbId === search || m.title === search));
}

// Update
export function updateMovie(id: string, updatedMovie: MovieData, filePath:string) {
    const movies: MovieData[] = readMovies(filePath);
    const index = movies.findIndex(movie => movie.imdbId === id);
    if (index !== -1) {
        movies[index] = updatedMovie;
        fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
    }
}

// Delete
export function deleteMovie(id: string, filePath:string) {
    let movies: MovieData[] = readMovies(filePath);
    movies = movies.filter(movie => movie.imdbId !== id);
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
}

export async function createSaveModal(interaction: ButtonInteraction, initialDetails: string): Promise<string> {
	try {
		// Create the modal
		const modal = new ModalBuilder()
		.setCustomId('addDetailsModal')
		.setTitle('Result to Save');

		// Create the text input components
		const editInput = new TextInputBuilder()
			.setCustomId('detailsInput')
			// The label is the prompt the user sees for this input
			.setLabel('Any Corrections?')
			.setValue(initialDetails)
			.setStyle(TextInputStyle.Paragraph);

		const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(editInput);
		modal.addComponents(firstActionRow);
		await interaction.showModal(modal);
		const modalSubmitInteraction = await interaction.awaitModalSubmit({ time: 120000 });
		const detailsInput = modalSubmitInteraction.fields.getTextInputValue('detailsInput');
		modalSubmitInteraction.reply({ content: 'Result Saved!', ephemeral:true });
		return detailsInput;
	} catch (error) {
		console.error(error);
		return '';
	}
}
