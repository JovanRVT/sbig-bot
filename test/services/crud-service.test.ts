import { jest } from '@jest/globals';
import { upsertMovie } from '../../src/services/crud-service';
import fs from 'fs';
import { MovieData } from '../../src/types';

jest.mock('fs');

describe('crud-service', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    jest.clearAllMocks();
  });

  it('should upsert a movie', () => {
    const movieData:MovieData = {
        imdbId: 'tt1234567',
        title: 'Test Movie',
        year: 2023,
        runtime: '120 min',
        genre: 'Test',
        director: 'Test Director',
        sbigRank: 'A',
        sbigNotes: 'Test Note',
        sbigWatchedDate: '11/6/2023',
        sbigSubmitter: '1234567890',
        sbigVoteResults: '{\n\n"D": [\n\n\n"251801286788251649"\n\n]\n}',
        plot: 'A test plot for a Test Movie',
        image: 'test image',
        imdbRating: 4.2,
        release: '26 Jun 2007',
        rating: 'PG-13',
        otherRatings: [{
            Source: 'Internet Movie Database',
            Value: '1.7/10',
          }],
        actors: 'Test testerton',
        writers: 'test test',
        boxOffice: '7357',
    };

    const readFileSyncMock = jest.spyOn(fs, 'readFileSync');
    readFileSyncMock.mockReturnValue(JSON.stringify([]));

    const writeFileSyncMock = jest.spyOn(fs, 'writeFileSync');
    writeFileSyncMock.mockImplementation(() => {
        // do nothing.
    });

    upsertMovie(movieData, 'test.json');

    expect(readFileSyncMock).toHaveBeenCalledWith('test.json', 'utf-8');
    expect(writeFileSyncMock).toHaveBeenCalledWith('test.json', JSON.stringify([movieData], null, 2));
  });
});