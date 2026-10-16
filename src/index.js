const { Client, GatewayIntentBits, Events, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { token, initialCreateChannelId, initialCategoryId, initialPanelChannelId } = require('./config');
const state=require('./state');
const {commands,runCommand,panelPayload}=require('./commands/commands');
const {embed,ok,error}=require('./utils/embeds');
const {makeRoom,cleanupRoom,getRoom}=require('./utils/rooms');

// Endpoint HTTP mínimo para que Render Web Service detecte el puerto activo.
const http = require('node:http');
const port = Number(process.env.PORT || 3000);
http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('TemperleyVC está activo.');
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('No encontrado');
}).listen(port, '0.0.0.0', () => console.log(`Servidor de salud HTTP activo en el puerto ${port}.`));
if(!token){console.error('Falta DISCORD_TOKEN en .env');process.exit(1);}
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildVoiceStates]});
client.once(Events.ClientReady,async c=>{
 console.log(`🤖 ${c.user.tag} está en línea. Estado efímero: RAM únicamente.`);
 for(const guild of c.guilds.cache.values()){
  if(initialCreateChannelId) state.settings.set(guild.id,{createChannelId:initialCreateChannelId,categoryId:initialCategoryId,panelChannelId:initialPanelChannelId});
  const s=state.settings.get(guild.id); if(s?.panelChannelId){const ch=guild.channels.cache.get(s.panelChannelId);if(ch) await ch.send(panelPayload()).catch(()=>{});}
 }
});
client.on(Events.InteractionCreate,async interaction=>{
 try{
  if(interaction.isChatInputCommand()) return await runCommand(interaction,client);
  if(interaction.isButton()){
   const action=interaction.customId.split(':')[1];
   if(action==='claim'){
    const member=interaction.member, channel=member.voice?.channel, room=channel&&state.rooms.get(channel.id);
    if(!room)return interaction.reply({embeds:[error('Entra a un VC temporal para reclamarlo.')],ephemeral:true});
    if(room.ownerId===member.id)return interaction.reply({embeds:[error('Ya eres el propietario de este canal.')],ephemeral:true});
    const previous=await interaction.guild.members.fetch(room.ownerId).catch(()=>null);
    if(previous?.voice?.channelId===channel.id)return interaction.reply({embeds:[error('El propietario actual sigue dentro del canal.')],ephemeral:true});
    const old=interaction.guild.roles.cache.get(room.ownerRoleId);if(old)await old.delete('Rol anterior al reclamar').catch(()=>{});
    const role=await interaction.guild.roles.create({name:`VC・${member.user.username}`.slice(0,100),color:0xB84DFF,reason:'Reclamación de VC'});room.ownerId=member.id;room.ownerRoleId=role.id;state.owners.delete(previous?.id);state.owners.set(member.id,channel.id);await member.roles.add(role).catch(()=>{});await channel.permissionOverwrites.edit(role,{ViewChannel:true,Connect:true,Speak:true,Stream:true,UseVAD:true});return interaction.reply({embeds:[ok('¡Has reclamado el canal y recibido tu rol de propietario!')],ephemeral:true});
   }
   const member=interaction.member;const r=getRoom(member);if(r.error)return interaction.reply({embeds:[error(r.error)],ephemeral:true});
   const {room,channel}=r;
   if(action==='lock'||action==='unlock'){room.locked=action==='lock';await channel.permissionOverwrites.edit(interaction.guild.roles.everyone,{Connect:room.locked?false:null,ViewChannel:room.hidden?false:true});}
   else if(action==='hide'||action==='unhide'){room.hidden=action==='hide';await channel.permissionOverwrites.edit(interaction.guild.roles.everyone,{ViewChannel:room.hidden?false:true,Connect:room.locked?false:null});}
   else if(['rename','limit','invite','kick','permit','bitrate','transfer'].includes(action)){
    const modal=new ModalBuilder().setCustomId(`vcmodal:${action}:${channel.id}`).setTitle(({rename:'Renombrar canal',limit:'Límite de usuarios',invite:'Invitar usuario',kick:'Expulsar usuario',permit:'Permitir usuario',bitrate:'Calidad de audio',transfer:'Transferir propiedad'})[action]);
    const input=new TextInputBuilder().setCustomId('value').setLabel(({rename:'Nuevo nombre',limit:'Cantidad (0-99)',invite:'ID de usuario',kick:'ID de usuario',permit:'ID de usuario',bitrate:'Bitrate en kbps',transfer:'ID de usuario nuevo propietario'})[action]).setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(action==='rename'?90:20);
    modal.addComponents(new ActionRowBuilder().addComponents(input));return interaction.showModal(modal);
   }
   return interaction.reply({embeds:[ok('Control aplicado correctamente.')],ephemeral:true});
  }
  if(interaction.isModalSubmit()&&interaction.customId.startsWith('vcmodal:')){
   const [,action,channelId]=interaction.customId.split(':');const channel=interaction.guild.channels.cache.get(channelId);const room=state.rooms.get(channelId);if(!room||!channel)return interaction.reply({embeds:[error('Este canal temporal ya no existe.')],ephemeral:true});if(room.ownerId!==interaction.user.id)return interaction.reply({embeds:[error('Solo el propietario puede hacer eso.')],ephemeral:true});
   const value=interaction.fields.getTextInputValue('value').trim();
   if(action==='rename')await channel.setName(value);
   if(action==='limit'){const n=Number(value);if(!Number.isInteger(n)||n<0||n>99)return interaction.reply({embeds:[error('Escribe un número entero entre 0 y 99.')],ephemeral:true});room.limit=n;await channel.setUserLimit(n);}
   if(action==='bitrate'){const n=Number(value);if(!Number.isInteger(n)||n<8||n>384)return interaction.reply({embeds:[error('Escribe un bitrate entre 8 y 384 kbps.')],ephemeral:true});await channel.setBitrate(Math.min(n*1000,interaction.guild.maximumBitrate||96000));}
   if(['invite','kick','permit','transfer'].includes(action)){const m=await interaction.guild.members.fetch(value).catch(()=>null);if(!m)return interaction.reply({embeds:[error('No encontré ese ID de usuario en este servidor.')],ephemeral:true});
    if(action==='invite'||action==='permit'){await channel.permissionOverwrites.edit(m.id,{ViewChannel:true,Connect:true,Speak:true,UseVAD:true});if(action==='invite'){room.trusted.add(m.id);const fr=interaction.guild.roles.cache.get(room.familyRoleId);if(fr)await m.roles.add(fr).catch(()=>{});}}
    if(action==='kick'){if(m.voice.channelId!==channel.id)return interaction.reply({embeds:[error('Esa persona no está en tu canal.')],ephemeral:true});await m.voice.disconnect('Expulsado por propietario');}
    if(action==='transfer'){if(m.voice.channelId!==channel.id)return interaction.reply({embeds:[error('El nuevo propietario debe estar en el VC.')],ephemeral:true});const old=interaction.guild.roles.cache.get(room.ownerRoleId);if(old){const owner=await interaction.guild.members.fetch(room.ownerId).catch(()=>null);if(owner)await owner.roles.remove(old).catch(()=>{});await old.delete().catch(()=>{});}const role=await interaction.guild.roles.create({name:`VC・${m.user.username}`.slice(0,100),color:0xB84DFF});room.ownerId=m.id;room.ownerRoleId=role.id;state.owners.delete(interaction.user.id);state.owners.set(m.id,channel.id);await m.roles.add(role).catch(()=>{});await channel.permissionOverwrites.edit(role,{ViewChannel:true,Connect:true,Speak:true,Stream:true,UseVAD:true});await channel.permissionOverwrites.edit(m.id,{ViewChannel:true,Connect:true,Speak:true,Stream:true,UseVAD:true,ManageChannels:true});}
   }
   return interaction.reply({embeds:[ok('Hecho. Se aplicaron los cambios al canal temporal.')],ephemeral:true});
  }
 }catch(err){console.error('Error de interacción:',err);const payload={embeds:[error('Ocurrió un error. Revisa los permisos del bot y vuelve a intentarlo.')],ephemeral:true};if(interaction.isRepliable()){if(interaction.replied||interaction.deferred)await interaction.followUp(payload).catch(()=>{});else await interaction.reply(payload).catch(()=>{});}}
});
client.on(Events.VoiceStateUpdate,async(oldState,newState)=>{
 try{
  const guild=newState.guild;const settings=state.settings.get(guild.id);
  if(newState.channelId&&settings&&newState.channelId===settings.createChannelId){const member=newState.member;if(member)await makeRoom(member,guild,settings);}
  if(oldState.channelId&&state.rooms.has(oldState.channelId)){const ch=guild.channels.cache.get(oldState.channelId);if(ch&&ch.members.size===0)await cleanupRoom(oldState.channelId,client);}
 }catch(e){console.error('VoiceStateUpdate:',e);}
});
client.login(token);
