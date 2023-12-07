import { DataTypes, Model } from 'sequelize';
import { sequelize } from './database';
import { TurnOrderItem } from '../types';

class CustomConfig extends Model {
    declare id: number;
    declare turnOrder: TurnOrderItem[];
    // declare countDownTarget: Date;
    // declare countDownVoiceChannelId: string;
    declare guildId: string;
    declare createdAt: Date;

    getFormattedDate(): string {
      return this.createdAt.toLocaleDateString();
    }

  }

  CustomConfig.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    turnOrder: DataTypes.JSON,
    guildId: DataTypes.STRING,
  }, {
    sequelize,
    tableName: 'customconfigs',
  });

  (async () => {
    await sequelize.sync();
  })();

  export { CustomConfig };