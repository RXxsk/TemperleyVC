require('dotenv').config();
module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  color: Number.parseInt((process.env.BOT_COLOR || '#B84DFF').replace('#', ''), 16),
  initialCreateChannelId: process.env.CREATE_VC_CHANNEL_ID || null,
  initialCategoryId: process.env.VOICE_CATEGORY_ID || null,
  initialPanelChannelId: process.env.CONTROL_PANEL_CHANNEL_ID || null,
  creator: 'AstridVMD',
  botName: 'TemperleyVC'
};
