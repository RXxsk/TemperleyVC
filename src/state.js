// Estado únicamente en RAM. No se escribe en disco ni se usa una base de datos.
module.exports = {
  settings: new Map(), // guildId -> { createChannelId, categoryId, panelChannelId }
  rooms: new Map(), // voiceChannelId -> { guildId, ownerId, ownerRoleId, familyRoleId, trusted:Set, locked, hidden, limit, bitrate }
  owners: new Map() // ownerId -> voiceChannelId
};
