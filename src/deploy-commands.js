const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config');
const { commands } = require('./commands/commands');
if(!token || !clientId || !guildId){console.error('Faltan DISCORD_TOKEN, CLIENT_ID o GUILD_ID en .env');process.exit(1);}
const rest=new REST({version:'10'}).setToken(token);
(async()=>{try{await rest.put(Routes.applicationGuildCommands(clientId,guildId),{body:commands});console.log(`Registrados ${commands.length} comandos en el servidor ${guildId}.`);}catch(e){console.error(e);process.exit(1);}})();
