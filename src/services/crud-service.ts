import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import fs from 'fs';
import { MovieData } from '../types';

// File path
const filePath = 'sbigMovies.json';

// Create
export function createMovie(movie: MovieData) {
    const data = fs.readFileSync(filePath, 'utf-8');
    const movies: MovieData[] = JSON.parse(data);

	// Check if movie with the same imdbId already exists
	const duplicate = movies.find(m => m.imdbId === movie.imdbId);
	if (duplicate) {
		throw new Error('Movie with the same imdbId already exists');
	}

    movies.push(movie);
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
}

// Read
export function readMovies(): MovieData[] {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

// Update
export function updateMovie(id: string, updatedMovie: MovieData) {
    const movies: MovieData[] = readMovies();
    const index = movies.findIndex(movie => movie.imdbId === id);
    if (index !== -1) {
        movies[index] = updatedMovie;
        fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
    }
}

// Delete
export function deleteMovie(id: string) {
    let movies: MovieData[] = readMovies();
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
