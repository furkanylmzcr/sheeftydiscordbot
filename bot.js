const Discord = require('discord.js');
const client = new Discord.Client();
const ayarlar = require('./ayarlar.json');
const chalk = require('chalk');
const fs = require('fs');
const moment = require('moment');
require('./util/eventLoader')(client);

var prefix = ayarlar.prefix;

const log = message => {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};


// Oynuyor KISMI
client.on("ready", () => {
    client.user.setActivity("www.Sheefty.net", { 
      type: "STREAMING", 
      url: "https://twitch.tv/sheeftynet" }
    )
})

client.elevation = message => {
  if(!message.guild) {
	return; }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on('warn', e => {
  console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});

client.on('error', e => {
  console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});



client.on("message", (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  if (message.content.toLowerCase().startsWith(prefix + `sipariş`)) {
    const reason = message.content.split(" ").slice(1).join(" ");
    if (!message.guild.roles.exists("name", "Destek Yetkilisi")) return message.channel.send(`(**Destek Yetkilisi**) Rolünü oluştur.`);
    if (message.guild.channels.exists("name", "sipariş" + message.author.id)) return message.channel.send(`Açık sipariş kanalın mevcut.`);
    message.guild.createChannel(`sipariş${message.author.id}`, "text").then(c => {
      let role = message.guild.roles.find("name", "Destek Yetkilisi");
      let role2 = message.guild.roles.find("name", "@everyone");
      c.overwritePermissions(role, {
        SEND_MESSAGES: true,
        READ_MESSAGES: true
      });
      c.overwritePermissions(role2, {
        SEND_MESSAGES: false,
        READ_MESSAGES: false
      });
      c.overwritePermissions(message.author, {
        SEND_MESSAGES: true,
        READ_MESSAGES: true
      });
      message.channel.send(`Sipariş kanalın oluşturuldu. (** #${c.name} **)`);
      const embed = new Discord.RichEmbed()
        .setColor(0xCF40FA)
        .addField(`Merhaba, ${message.author.username}!`, `Lütfen destek ekibini bekleyin\n\nDestek Talebini Kapatmak için: (**!kapat**)`)
        .setTimestamp();
      c.send({ embed: embed });
      message.delete();
    }).catch(console.error);
  }
  if (message.content.toLowerCase().startsWith(prefix + `kapat`)) {
    if (!message.channel.name.startsWith(`sipariş`)) return message.channel.send(`Komutu kullanmak için (**Sipariş**) kanalında olmanız gerekmekte.`);

    message.channel.send(`Sipariş kanalını kapatmak için (**Onayla**) yaz.`)
      .then((m) => {
        message.channel.awaitMessages(response => response.content === 'onayla', {
          max: 1,
          time: 10000,
          errors: ['time'],
        })
          .then((collected) => {
            message.channel.delete();
          })
          .catch(() => {
            m.edit('Lütfen hızlı ol.').then(m2 => {
              m2.delete();
            }, 3000);
          });
      });
  }

});

// SUNUCUYA GİRİŞ
client.on('guildMemberAdd', member => {
  let Sunucu = member.guild;
  let GirişRolü = member.guild.roles.find('name', 'Üye');
  member.addRole(GirişRolü);
  const GirişKanalı = member.guild.channels.find('name', 'giriş');
  if (!GirişKanalı) return;
  const GirişMesaj = new Discord.RichEmbed()
  .setColor('GREEN')
  .setAuthor(member.user.username, member.user.avatarURL)
  .setThumbnail(member.user.avatarURL)
  .setTitle('📥 | Sunucuya katıldı')
  .setTimestamp()
  GirişKanalı.sendEmbed(GirişMesaj);
});
  


  
client.on('message', async msg => {
  if (msg.content.toLowerCase() === 'sa') {
    await msg.react('🇦');
    msg.react('🇸');
  msg.reply('**Aleyküm selam, hoşgeldin**');  
}
});
  
  


client.login(ayarlar.token);
