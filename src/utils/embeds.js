const { EmbedBuilder } = require('discord.js');
const { color, creator, botName } = require('../config');
function embed(title, description) {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description)
    .setFooter({ text: `${botName} • Creado por ${creator}`, iconURL: undefined }).setTimestamp();
}
function ok(text) { return embed('✅ Listo', text); }
function error(text) { return embed('⚠️ No se pudo completar', text); }
module.exports = { embed, ok, error };
