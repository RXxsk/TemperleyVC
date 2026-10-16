const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { color, creator, botName } = require('../config');
const state = require('../state');
const { embed, ok, error } = require('../utils/embeds');
const { getRoom } = require('../utils/rooms');

const commands = [
 new SlashCommandBuilder().setName('configurar').setDescription('Configura los canales de TemperleyVC').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(o=>o.setName('crear_vc').setDescription('Canal de voz al que entran para crear un VC').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
  .addChannelOption(o=>o.setName('categoria').setDescription('Categoría donde aparecerán los VC temporales').addChannelTypes(ChannelType.GuildCategory).setRequired(false))
  .addChannelOption(o=>o.setName('panel').setDescription('Canal de texto donde publicar el panel de controles').addChannelTypes(ChannelType.GuildText).setRequired(false)),
 new SlashCommandBuilder().setName('panel').setDescription('Publica el panel de controles de canales temporales').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
 new SlashCommandBuilder().setName('ayuda').setDescription('Muestra los comandos y funciones de TemperleyVC'),
 new SlashCommandBuilder().setName('reclamar').setDescription('Reclama un VC temporal cuyo propietario ya salió'),
 new SlashCommandBuilder().setName('familia').setDescription('Añade o quita a alguien de confianza de tu VC')
  .addSubcommand(s=>s.setName('agregar').setDescription('Permite a una persona de confianza entrar').addUserOption(o=>o.setName('usuario').setDescription('Persona de confianza').setRequired(true)))
  .addSubcommand(s=>s.setName('quitar').setDescription('Quita el acceso de confianza').addUserOption(o=>o.setName('usuario').setDescription('Persona a quitar').setRequired(true))),
 new SlashCommandBuilder().setName('nombre').setDescription('Cambia el nombre de tu VC').addStringOption(o=>o.setName('nombre').setDescription('Nuevo nombre').setMaxLength(90).setRequired(true)),
 new SlashCommandBuilder().setName('limite').setDescription('Establece el límite de usuarios (0 = sin límite)').addIntegerOption(o=>o.setName('cantidad').setDescription('De 0 a 99').setMinValue(0).setMaxValue(99).setRequired(true)),
 new SlashCommandBuilder().setName('bloquear').setDescription('Bloquea o desbloquea el acceso general a tu VC').addBooleanOption(o=>o.setName('activar').setDescription('Sí para bloquear, no para desbloquear').setRequired(true)),
 new SlashCommandBuilder().setName('ocultar').setDescription('Oculta o muestra tu VC').addBooleanOption(o=>o.setName('activar').setDescription('Sí para ocultar, no para mostrar').setRequired(true)),
 new SlashCommandBuilder().setName('transferir').setDescription('Transfiere la propiedad del VC').addUserOption(o=>o.setName('usuario').setDescription('Nuevo propietario que esté en el VC').setRequired(true)),
 new SlashCommandBuilder().setName('bitrate').setDescription('Cambia la calidad de audio del VC').addIntegerOption(o=>o.setName('kbps').setDescription('Calidad en kbps').setMinValue(8).setMaxValue(384).setRequired(true)),
 new SlashCommandBuilder().setName('expulsar').setDescription('Expulsa a una persona de tu VC').addUserOption(o=>o.setName('usuario').setDescription('Persona que expulsar').setRequired(true)),
 new SlashCommandBuilder().setName('permitir').setDescription('Permite a una persona entrar a tu VC').addUserOption(o=>o.setName('usuario').setDescription('Persona a permitir').setRequired(true)),
 new SlashCommandBuilder().setName('denegar').setDescription('Deniega a una persona entrar a tu VC').addUserOption(o=>o.setName('usuario').setDescription('Persona a bloquear').setRequired(true))
].map(c=>c.toJSON());

function panelPayload() {
 const e = new EmbedBuilder().setColor(color).setTitle('🎙️ TemperleyVC • Centro de control')
  .setDescription('Administra tu canal de voz temporal con los botones.\n\n🔒 **Bloquear** · 🔓 **Desbloquear** · 🙈 **Ocultar** · 👁️ **Mostrar**\n👥 **Límite** · ➕ **Invitar** · ⛔ **Expulsar** · ✅ **Permitir**\n✏️ **Renombrar** · 🎧 **Bitrate** · 👑 **Reclamar** · 🔁 **Transferir**\n\nUsa `/familia` para gestionar personas de confianza. Los botones funcionan mientras estés en tu VC temporal.')
  .setFooter({text:`${botName} • Creado por ${creator}`});
 const rows = [
  new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('vc:lock').setLabel('Bloquear').setEmoji('🔒').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('vc:unlock').setLabel('Desbloquear').setEmoji('🔓').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('vc:hide').setLabel('Ocultar').setEmoji('🙈').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('vc:unhide').setLabel('Mostrar').setEmoji('👁️').setStyle(ButtonStyle.Secondary)),
  new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('vc:limit').setLabel('Límite').setEmoji('👥').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('vc:invite').setLabel('Invitar').setEmoji('➕').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('vc:kick').setLabel('Expulsar').setEmoji('⛔').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('vc:permit').setLabel('Permitir').setEmoji('✅').setStyle(ButtonStyle.Secondary)),
  new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('vc:rename').setLabel('Renombrar').setEmoji('✏️').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('vc:bitrate').setLabel('Bitrate').setEmoji('🎧').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('vc:claim').setLabel('Reclamar').setEmoji('👑').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('vc:transfer').setLabel('Transferir').setEmoji('🔁').setStyle(ButtonStyle.Secondary))
 ];
 return { embeds:[e], components:rows };
}
async function runCommand(interaction, client) {
 const { commandName, guild, member } = interaction;
 if (commandName === 'configurar') {
  const create = interaction.options.getChannel('crear_vc'), category = interaction.options.getChannel('categoria'), panel = interaction.options.getChannel('panel');
  state.settings.set(guild.id,{createChannelId:create.id,categoryId:category?.id || null,panelChannelId:panel?.id || null});
  await interaction.reply({embeds:[ok(`Canal de creación: ${create}\nCategoría: ${category || 'No configurada'}\nPanel: ${panel || 'Publícalo con /panel'}\n\n**Aviso:** la configuración vive en memoria y se reinicia al reiniciar el proceso.`)],ephemeral:true}); return;
 }
 if (commandName === 'panel') {
  const settings=state.settings.get(guild.id);
  const target=(settings?.panelChannelId ? guild.channels.cache.get(settings.panelChannelId):null) || interaction.channel;
  await target.send(panelPayload()); await interaction.reply({embeds:[ok(`Panel publicado en ${target}.`)],ephemeral:true}); return;
 }
 if (commandName === 'ayuda') {
  await interaction.reply({embeds:[embed('📚 TemperleyVC • Ayuda','**Configuración:** `/configurar`, `/panel`\n**Propiedad:** `/reclamar`, `/transferir`\n**Acceso:** `/familia`, `/permitir`, `/denegar`, `/expulsar`\n**Personalización:** `/nombre`, `/limite`, `/bitrate`, `/bloquear`, `/ocultar`\n\nEntra al canal configurado para crear un VC temporal. Al quedar vacío, se elimina el canal y sus roles temporales. No se utiliza base de datos.')],ephemeral:true}); return;
 }
 if (commandName === 'reclamar') {
  const channel=member.voice?.channel, room=channel && state.rooms.get(channel.id);
  if (!room) return interaction.reply({embeds:[error('Debes estar en un VC temporal.')],ephemeral:true});
  const previous=await guild.members.fetch(room.ownerId).catch(()=>null);
  if (previous?.voice?.channelId===channel.id) return interaction.reply({embeds:[error('El propietario actual sigue dentro del canal.')],ephemeral:true});
  const oldOwnerId=room.ownerId; room.ownerId=member.id; state.owners.delete(oldOwnerId); state.owners.set(member.id,channel.id);
  const oldRole=guild.roles.cache.get(room.ownerRoleId); if(oldRole) await oldRole.delete('Transferencia por reclamación').catch(()=>{});
  const newRole=await guild.roles.create({name:`VC・${member.user.username}`.slice(0,100),color:0xB84DFF,reason:'Nuevo propietario temporal'});
  room.ownerRoleId=newRole.id; await member.roles.add(newRole).catch(()=>{});
  await channel.permissionOverwrites.edit(newRole,{ViewChannel:true,Connect:true,Speak:true,Stream:true,UseVAD:true});
  await interaction.reply({embeds:[ok(`Ahora eres propietario de ${channel}.`)],ephemeral:true}); return;
 }
 if (commandName === 'familia') {
  const result=getRoom(member); if(result.error) return interaction.reply({embeds:[error(result.error)],ephemeral:true});
  const target=interaction.options.getUser('usuario'), sub=interaction.options.getSubcommand(), room=result.room;
  if(target.id===member.id) return interaction.reply({embeds:[error('No puedes agregarte a ti mismo.')],ephemeral:true});
  const role=guild.roles.cache.get(room.familyRoleId); const targetMember=await guild.members.fetch(target.id).catch(()=>null);
  if(!targetMember) return interaction.reply({embeds:[error('No encontré a esa persona en el servidor.')],ephemeral:true});
  if(sub==='agregar'){room.trusted.add(target.id); await targetMember.roles.add(role).catch(()=>{}); await result.channel.permissionOverwrites.edit(target.id,{ViewChannel:true,Connect:true,Speak:true,UseVAD:true});}
  else {room.trusted.delete(target.id); await targetMember.roles.remove(role).catch(()=>{}); await result.channel.permissionOverwrites.delete(target.id).catch(()=>{});}
  await interaction.reply({embeds:[ok(sub==='agregar'?`${target} ahora forma parte de tu familia y puede entrar a tu VC.`:`Se quitó el acceso de ${target}.`)],ephemeral:true}); return;
 }
 const result=getRoom(member); if(result.error) return interaction.reply({embeds:[error(result.error)],ephemeral:true});
 const {room,channel}=result;
 if(commandName==='nombre'){await channel.setName(interaction.options.getString('nombre'));}
 else if(commandName==='limite'){room.limit=interaction.options.getInteger('cantidad');await channel.setUserLimit(room.limit);}
 else if(commandName==='bloquear'){room.locked=interaction.options.getBoolean('activar');await channel.permissionOverwrites.edit(guild.roles.everyone,{Connect:room.locked?false:null,ViewChannel:room.hidden?false:true});}
 else if(commandName==='ocultar'){room.hidden=interaction.options.getBoolean('activar');await channel.permissionOverwrites.edit(guild.roles.everyone,{ViewChannel:room.hidden?false:true,Connect:room.locked?false:null});}
 else if(commandName==='bitrate'){const kbps=interaction.options.getInteger('kbps');const cap=guild.maximumBitrate||96000;await channel.setBitrate(Math.min(kbps*1000,cap));}
 else if(commandName==='permitir'||commandName==='denegar') {const u=interaction.options.getUser('usuario');await channel.permissionOverwrites.edit(u.id,commandName==='permitir'?{ViewChannel:true,Connect:true,Speak:true}:{ViewChannel:true,Connect:false});}
 else if(commandName==='expulsar'){const u=interaction.options.getUser('usuario');const m=await guild.members.fetch(u.id).catch(()=>null);if(!m?.voice?.channelId || m.voice.channelId!==channel.id)return interaction.reply({embeds:[error('Esa persona no está en tu VC.')],ephemeral:true});await m.voice.disconnect('Expulsado por propietario de VC');}
 else if(commandName==='transferir') {const u=interaction.options.getUser('usuario');const m=await guild.members.fetch(u.id).catch(()=>null);if(!m || m.voice.channelId!==channel.id)return interaction.reply({embeds:[error('El nuevo propietario debe estar dentro de tu VC.')],ephemeral:true});
   const oldRole=guild.roles.cache.get(room.ownerRoleId);if(oldRole){await member.roles.remove(oldRole).catch(()=>{});await oldRole.delete('Transferencia de propietario').catch(()=>{});}const role=await guild.roles.create({name:`VC・${m.user.username}`.slice(0,100),color:0xB84DFF,reason:'Transferencia de VC'});room.ownerId=m.id;room.ownerRoleId=role.id;state.owners.delete(member.id);state.owners.set(m.id,channel.id);await m.roles.add(role).catch(()=>{});await channel.permissionOverwrites.edit(role,{ViewChannel:true,Connect:true,Speak:true,Stream:true,UseVAD:true});await channel.permissionOverwrites.edit(m.id,{ViewChannel:true,Connect:true,Speak:true,Stream:true,UseVAD:true,ManageChannels:true});}
 await interaction.reply({embeds:[ok('El ajuste de tu canal se aplicó correctamente.')],ephemeral:true});
}
module.exports={commands,runCommand,panelPayload};
