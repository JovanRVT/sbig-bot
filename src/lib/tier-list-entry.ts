import { DataTypes, Model } from 'sequelize';
import { Tier } from '../types';
import { sequelize } from './database';
import { OmdbData } from './omdb-data';

class TierListEntry<T> extends Model {
    declare id: number;
    declare tier: Tier;
    declare notes: string;
    declare submitter: string;
    declare voteResults: Map<string, string[]>;
    declare externalDataId: string | null;
    declare externalData: T | null;
    declare category: string;
    declare guildId: string;
    declare createdAt: Date;

    getFormattedDate(): string {
      return this.createdAt.toLocaleDateString();
    }

    hasExternalData(): boolean {
        return this.externalData !== null;
    }

    hasVoteResults(): boolean {
        return this.voteResults !== null;
    }

    formatNotesString(): string {
      if (this.notes !== '') {
        return `\n\n${'Notes:'} ${this.notes}`;
      }
      return this.notes;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isExternalDataOmdbData(data: any): data is OmdbData {
        return (data as OmdbData).title !== undefined;
    }

    generateOmdbData(): OmdbData | undefined {
      if (this.isExternalDataOmdbData(this.externalData)) {
        return new OmdbData(
            this.externalData.title,
            this.externalData.plot,
            this.externalData.image,
            this.externalData.imdbRating,
            this.externalData.genre,
            this.externalData.release,
            this.externalData.runtime,
            this.externalData.rating,
            this.externalData.year,
            this.externalData.otherRatings,
            this.externalData.director,
            this.externalData.actors,
            this.externalData.writers,
            this.externalData.boxOffice,
            this.externalData.imdbId
        );
      }
    }
  }

  TierListEntry.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tier: DataTypes.STRING,
    notes: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    submitter: DataTypes.STRING,
    voteResults: {
      type: DataTypes.JSON,
      get: function() {
        if (this.getDataValue('voteResults') !== undefined && this.getDataValue('voteResults') !== null) {
          return new Map(JSON.parse(this.getDataValue('voteResults')));
        }
      },
      set: function(val: Map<string, string[]>) {
        this.setDataValue('voteResults', JSON.stringify(Array.from(val.entries())));
      },
    },
    externalDataId: DataTypes.STRING,
    externalData: DataTypes.JSON,
    category: DataTypes.STRING,
    guildId: DataTypes.STRING,
  }, {
    sequelize,
    tableName: 'tierlists',
  });

  (async () => {
    await sequelize.sync();
  })();

  export { TierListEntry };