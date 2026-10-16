const { ChannelType, PermissionFlagsBits } = require('discord.js');
const state = require('../state');
const { embed } = require('./embeds');

async function makeRoom(member, guild, settings) {
  const existing = state.owners.get(member.id);
  if (existing && guild.channels.cache.has(existing)) {
    await member.voice.setChannel(existing).catch(() => {});
    return null;
  }
  const safeName = member.user.username.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 20) || 'Usuario';
  const ownerRole = await guild.roles.create({ name: `VC・${safeName}`.slice(0, 100), color: 0xB84DFF, mentionable: false, reason: 'Rol temporal de propietario TemperleyVC' });
  const familyRole = await guild.roles.create({ name: `Familia・${safeName}`.slice(0, 100), color: 0xD946EF, mentionable: false, reason: 'Rol temporal de confianza TemperleyVC' });
  const channel = await guild.channels.create({
    name: `🎙️・${safeName}`.slice(0, 100), type: ChannelType.GuildVoice,
    parent: settings.categoryId || undefined,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.Connect], allow: [PermissionFlagsBits.ViewChannel] },
      { id: ownerRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseVAD] },
      { id: familyRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.UseVAD] },
      { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseVAD, PermissionFlagsBits.ManageChannels] }
    ], reason: 'Canal de voz temporal TemperleyVC'
  });
  await member.roles.add(ownerRole).catch(() => {});
  state.rooms.set(channel.id, { guildId: guild.id, ownerId: member.id, ownerRoleId: ownerRole.id, familyRoleId: familyRole.id, trusted: new Set(), locked: false, hidden: false, limit: 0, bitrate: channel.bitrate });
  state.owners.set(member.id, channel.id);
  await member.voice.setChannel(channel).catch(() => {});
  return channel;
}
async function cleanupRoom(channelId, client) {
  const room = state.rooms.get(channelId);
  if (!room) return;
  const guild = client.guilds.cache.get(room.guildId);
  if (guild) {
    const channel = guild.channels.cache.get(channelId);
    if (channel) await channel.delete('Canal temporal vacío').catch(() => {});
    for (const roleId of [room.ownerRoleId, room.familyRoleId]) {
      const role = guild.roles.cache.get(roleId);
      if (role) await role.delete('Limpieza de roles de canal temporal').catch(() => {});
    }
    const owner = await guild.members.fetch(room.ownerId).catch(() => null);
    if (owner && room.ownerRoleId) await owner.roles.remove(room.ownerRoleId).catch(() => {});
  }
  state.owners.delete(room.ownerId);
  state.rooms.delete(channelId);
}
function getRoom(member) {
  const id = member.voice?.channelId;
  const room = id ? state.rooms.get(id) : null;
  if (!room) return { error: 'Debes estar dentro de tu canal de voz temporal para usar este control.' };
  if (room.ownerId !== member.id) return { error: 'Solo el propietario del canal puede usar este control. Si el propietario salió, usa **/reclamar**.' };
  return { room, channelId: id, channel: member.voice.channel };
}
module.exports = { makeRoom, cleanupRoom, getRoom };
