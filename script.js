const {
    WAConnection,
    MessageType,
    Presence,
    Mimetype,
    GroupSettingChange
} = require('@adiwajshing/baileys')

const fs = require("fs")
const FormData = require('form-data')
const request = require('request')
const moment = require('moment-timezone')
const ffmpeg = require('fluent-ffmpeg')

const { apikey, apikeyvh, apiimgbb, prefix, owner } = JSON.parse(fs.readFileSync('./config.json'))

const { fetchJson, getBuffer, getBuffer2 } = require('./lib/fetcher')
const { color } = require('./lib/color')
const { exec } = require("child_process")
const { getRandom } = require('./lib/function')
const { help, donate } = require('./help/help')
const { exit } = require('process')
const wa = require("./lib/function")
const { default: axios } = require('axios')

// Database
const nsfw = JSON.parse(fs.readFileSync('./database/nsfw.json'))
const tebakgambar = JSON.parse(fs.readFileSync('./database/tebakgambar.json'))
const sambungkata = JSON.parse(fs.readFileSync('./database/sambungkata.json'))
const akinator = JSON.parse(fs.readFileSync('./database/akinator.json'))
const afk = JSON.parse(fs.readFileSync('./database/afk.json'))

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function starts() {
    const nexus = new WAConnection()
    nexus.logger.level = 'warn'
    nexus.on('qr', () => {
        const time_connecting = moment.tz('America/Lima').format('HH:mm:ss')
        console.log(color(time_connecting, "white"), color("[  STATS  ]", "aqua"), "Scan QR Code with WhatsApp")
    })
    fs.existsSync('./nexus.json') && nexus.loadAuthInfo('./nexus.json')
    if (apikey == "") {
        ini_time = moment.tz('America/Lima').format('HH:mm:ss')
        console.log(color(ini_time, "white"), color("[  ERROR  ]", "aqua"), color("Apikey is empty, please check at config.json", 'red'))
        exit()
    }
    nexus.on('connecting', () => {
        const time_connecting = moment.tz('America/Lima').format('HH:mm:ss')
        console.log(color(time_connecting, "white"), color("[  STATS  ]", "aqua"), "Connecting...")
    })
    nexus.on('open', () => {
        const time_connect = moment.tz('America/Lima').format('HH:mm:ss')
        console.log(color(time_connect, "white"), color("[  STATS  ]", "aqua"), "Connected")
    })
    await nexus.connect({ timeoutMs: 30 * 1000 })
    fs.writeFileSync('./nexus.json', JSON.stringify(nexus.base64EncodedAuthInfo(), null, '\t'))

    nexus.on('CB:action,,call', async json => {
        const callerId = json[2][0][1].from;
        console.log("Llamada recibida de " + callerId)
        nexus.sendMessage(callerId, "Las llamadas no están permitidas, *afectan la estabilidad del Bot.* Ahora estas bloqueado por el sistema automático de Nexusᴮᴼᵀ.", MessageType.text,
            {
                quoted:
                {
                    key: { fromMe: false, participant: `0@s.whatsapp.net` },
                    message: { "documentMessage": { "title": "🚫 No se permiten las llamadas 🚫", 'jpegThumbnail': fs.readFileSync(`./src/assistant.jpg`) } }
                }
            }
        )
        await sleep(4000)
        await nexus.blockUser(callerId, "add")
    })
    
    nexus.on('group-participants-update', async(chat) => {
        try {
            mem = chat.participants[0]
            try {
                var pp_user = await nexus.getProfilePicture(mem)
            } catch (e) {
                var pp_user = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
            }
            try {
                var pp_group = await nexus.getProfilePicture(chat.jid)
            } catch (e) {
                var pp_group = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
            }
            if (chat.action == 'add') {
                num = chat.participants[0]
                ini_user = nexus.contacts[mem]
                group_info = await nexus.groupMetadata(chat.jid)
                ini_img = fs.readFileSync(`./src/assistant.jpg`)
                welcome = `*${num.split('@')[0]}*, te doy la bienvenida al grupo *${group_info.subject}*.\n\n*Por favor lee mis reglas:* \n\n*${prefix}reglas*\n\nPara ver todos los comandos de *Nexusᴮᴼᵀ* escribe el siguiente comando:\n\n*${prefix}menu*\n`
                await nexus.sendMessage(chat.jid, ini_img, MessageType.image, { caption: welcome })
            }
            
            if (chat.action == 'remove') {
                num = chat.participants[0]
                ini_user = nexus.contacts[mem]
                group_info = await nexus.groupMetadata(chat.jid)
                bye = `😪... *${num.split('@')[0]}* salió del grupo.\n*No le deseo el mal, pero tampoco el bien…* 👋`
                await nexus.sendMessage(chat.jid, bye, MessageType.text)    
            }

            if (chat.action == 'promote') {
                num = chat.participants[0]
                ini_user = nexus.contacts[mem]
                group_info = await nexus.groupMetadata(chat.jid)
                promote = `*${num.split('@')[0]}* 🥳\n\n *¡FELICIDADES!*, te has convertido en administrador del grupo *${group_info.subject}.*`
                await nexus.sendMessage(chat.jid, promote, MessageType.text)    
            }

            if (chat.action == 'demote') {
                num = chat.participants[0]
                ini_user = nexus.contacts[mem]
                group_info = await nexus.groupMetadata(chat.jid)
                demote = `*${num.split('@')[0]}* 😪\n\n *Malas noticias*, ya no eres admnistrador del grupo *${group_info.subject}.*`
                await nexus.sendMessage(chat.jid, demote, MessageType.text)   
            }
            
        } catch (e) {
            console.log('Error :', e)
        }
    })
    
    nexus.on('chat-update', async(nex) => {
        try {
            const time = moment.tz('America/Lima').format('HH:mm:ss')
            if (!nex.hasNewMessage) return
            nex = JSON.parse(JSON.stringify(nex)).messages[0]
            if (!nex.message) return
            if (nex.key && nex.key.remoteJid == 'status@broadcast') return
            if (nex.key.fromMe) return
            global.prefix
            const content = JSON.stringify(nex.message)
            const from = nex.key.remoteJid
            const type = Object.keys(nex.message)[0]
            const insom = from.endsWith('@g.us')
            const nameReq = insom ? nex.participant : nex.key.remoteJid
            pushname2 = nexus.contacts[nameReq] != undefined ? nexus.contacts[nameReq].vname || nexus.contacts[nameReq].notify : undefined
            chats = (type === 'conversation') ? nex.message.conversation : (type === 'extendedTextMessage') ? nex.message.extendedTextMessage.text : ''

            const { text, extendedText, contact, location, liveLocation, image, video, sticker, document, audio, product } = MessageType

            body = (type === 'conversation' && nex.message.conversation.startsWith(prefix)) ? nex.message.conversation : (type == 'imageMessage') && nex.message.imageMessage.caption.startsWith(prefix) ? nex.message.imageMessage.caption : (type == 'videoMessage') && nex.message.videoMessage.caption.startsWith(prefix) ? nex.message.videoMessage.caption : (type == 'extendedTextMessage') && nex.message.extendedTextMessage.text.startsWith(prefix) ? nex.message.extendedTextMessage.text : ''
            budy = (type === 'conversation') ? nex.message.conversation : (type === 'extendedTextMessage') ? nex.message.extendedTextMessage.text : ''
            var Link = (type === 'conversation' && nex.message.conversation) ? nex.message.conversation : (type == 'imageMessage') && nex.message.imageMessage.caption ? nex.message.imageMessage.caption : (type == 'videoMessage') && nex.message.videoMessage.caption ? nex.message.videoMessage.caption : (type == 'extendedTextMessage') && nex.message.extendedTextMessage.text ? nex.message.extendedTextMessage.text : ''
            const messagesLink = Link.slice(0).trim().split(/ +/).shift().toLowerCase()
            const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
            const args = body.trim().split(/ +/).slice(1)
            const isCmd = body.startsWith(prefix)
            nexus.chatRead(from)

            const mentionByTag = type == "extendedTextMessage" && nex.message.extendedTextMessage.contextInfo != null ? nex.message.extendedTextMessage.contextInfo.mentionedJid : []
            const mentionByReply = type == "extendedTextMessage" && nex.message.extendedTextMessage.contextInfo != null ? nex.message.extendedTextMessage.contextInfo.participant || "" : ""
            const mention = typeof(mentionByTag) == 'string' ? [mentionByTag] : mentionByTag
            mention != undefined ? mention.push(mentionByReply) : []
            const mentionUser = mention != undefined ? mention.filter(n => n) : []

            const botNumber = nexus.user.jid
            const isGroup = from.endsWith('@g.us')
            const sender = nex.key.fromMe ? nexus.user.jid : isGroup ? nex.participant : nex.key.remoteJid
            const senderNumber = sender.split("@")[0]
            const groupMetadata = isGroup ? await nexus.groupMetadata(from) : ''
            const groupName = isGroup ? groupMetadata.subject : ''
            const groupMembers = isGroup ? groupMetadata.participants : ''
		    const groupAdmins = isGroup ? await wa.getGroupAdmins(groupMembers) : []
            const isAdmin = groupAdmins.includes(sender) || false
		    const botAdmin = groupAdmins.includes(nexus.user.jid)
            const isNsfw = isGroup ? nsfw.includes(from) : false
            const q = args.join(' ')
            const arg = chats.slice(command.length + 2, chats.length)
            const totalchat = nexus.chats.all()

            const isUrl = (ini_url) => {
                return ini_url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
            }
            const sendFileFromUrl = async (link, type, options) => {
                hasil = await getBuffer(link)
                nexus.sendMessage(from, hasil, type, options).catch(e => {
                    fetch(link).then((hasil) => {
                        nexus.sendMessage(from, hasil, type, options).catch(e => {
                            nexus.sendMessage(from, { url: link }, type, options).catch(e => {
                                reply('[ ! ]\n*Error al descargar el archivo.*')
                                console.log(e)
                            })
                        })
                    })
                })
            }
            const reply = (teks) => {
                nexus.sendMessage(from, teks, text, { quoted: nex })
            }
            const sendMess = (hehe, teks) => {
                nexus.sendMessage(hehe, teks, text)
            }
            const costum = (pesan, tipe, target, target2) => {
                nexus.sendMessage(from, pesan, tipe, { quoted: { key: { fromMe: false, participant: `${target}`, ...(from ? { remoteJid: from } : {}) }, message: { conversation: `${target2}` } } })
            }
            const mentions = (teks, memberr, id) => {
                (id == null || id == undefined || id == false) ? nexus.sendMessage(from, teks.trim(), extendedText, { contextInfo: { "mentionedJid": memberr } }): nexus.sendMessage(from, teks.trim(), extendedText, { quoted: nex, contextInfo: { "mentionedJid": memberr } })
            }
            async function faketoko(teks, url_image, title, code, price) {
                var punya_wa = "0@s.whatsapp.net"
                var ini_buffer = await getBuffer(url_image)
                const ini_cstoko = {
                    contextInfo: {
                        participant: punya_wa,
                        remoteJid: 'status@broadcast',
                        quotedMessage: {
                            productMessage: {
                                product: {
                                    currencyCode: code,
                                    title: title,
                                    priceAmount1000: price,
                                    productImageCount: 1,
                                    productImage: {
                                        jpegThumbnail: ini_buffer
                                    }
                                },
                                businessOwnerJid: "0@s.whatsapp.net"
                            }
                        }
                    }
                }
                await nexus.sendMessage(from, teks, text, ini_cstoko)
            }

            async function sendFakeStatus(from, text, mentioned = []) {
                var punya_wa = "0@s.whatsapp.net"

                const ini_csstatus = {
                    contextInfo: {
                        participant: punya_wa,
                        remoteJid: 'status@broadcast',
                        quotedMessage: {
                            imageMessage: {
                                caption: 'Nexusᴮᴼᵀ',

                                jpegThumbnail: fs.readFileSync('./src/assistant.jpg') 
                        
                            }
                        },
                        mentionedJid: mentioned
                    }
                }
                await nexus.sendMessage(from, text, MessageType.text, ini_csstatus)
            }

            async function FakeTokoForwarded(from, teks, fake) {

                var punya_wa = "0@s.whatsapp.net"

                const ini_csFakeTokoForwarded = {
                    contextInfo: {
                        fromMe: false,
                        participant: punya_wa,
                        remoteJid: 'status@broadcast',
                        message: {
                            documentMessage: {
                                title: 'Nexusᴮᴼᵀ',
                                jpegThumbnail: fs.readFileSync('./src/assistant.jpg') 
                            }
                        }
                    }
                }
                await nexus.sendMessage(from, teks, MessageType.text, ini_csFakeTokoForwarded)
                
            }

            async function sendKontak(from, nomor, nama) {

                var punya_wa = "0@s.whatsapp.net"

                const vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 'FN:' + nama + '\n' + 'ORG:Contacto\n' + 'TEL;type=CELL;type=VOICE;waid=' + nomor + ':+' + nomor + '\n' + 'END:VCARD'
              
                await nexus.sendMessage(from, {displayname: nama, vcard: vcard}, MessageType.contact)
                
            }

            colors = ['red', 'white', 'black', 'blue', 'yellow', 'green', 'aqua']
            const isQuotedImage = type === 'extendedTextMessage' && content.includes('imageMessage')
            const isQuotedVideo = type === 'extendedTextMessage' && content.includes('videoMessage')
            const isQuotedAudio = type === 'extendedTextMessage' && content.includes('audioMessage')
            const isQuotedSticker = type === 'extendedTextMessage' && content.includes('stickerMessage')

            const isMedia = isQuotedImage || isQuotedVideo

            if (!isGroup && !isCmd) console.log(color(time, "white"), color("[ PRIVATE ]", "aqua"), color(budy, "white"), "from", color(sender.split('@')[0], "yellow"))
            if (isGroup && !isCmd) console.log(color(time, "white"), color("[  GROUP  ]", "aqua"), color(budy, "white"), "from", color(sender.split('@')[0], "yellow"), "in", color(groupName, "yellow"))
            if (!isGroup && isCmd) console.log(color(time, "white"), color("[ COMMAND ]", "aqua"), color(budy, "white"), "from", color(sender.split('@')[0], "yellow"))
            if (isGroup && isCmd) console.log(color(time, "white"), color("[ COMMAND ]", "aqua"), color(budy, "white"), "from", color(sender.split('@')[0], "yellow"), "in", color(groupName, "yellow"))

            var kuis = false

            // AFK
            for (let x of mentionUser) {
                if (afk.hasOwnProperty(x.split('@')[0])) {
                    ini_txt = "Maaf user yang anda reply atau tag sedang afk. "
                    if (afk[x.split('@')[0]] != "") {
                        ini_txt += "Dengan alasan " + afk[x.split('@')[0]]
                    }
                    reply(ini_txt)
                }
            }
            if (afk.hasOwnProperty(sender.split('@')[0])) {
                reply("Anda telah keluar dari mode afk.")
                delete afk[sender.split('@')[0]]
                fs.writeFileSync("./database/afk.json", JSON.stringify(afk))
            }

            // Tebak Gambar
            if (tebakgambar.hasOwnProperty(sender.split('@')[0]) && !isCmd && budy.match(/[1-9]{1}/)) {
                kuis = true
                jawaban = tebakgambar[sender.split('@')[0]]
                if (budy.toLowerCase() == jawaban) {
                    reply("Jawaban Anda Benar!")
                    delete tebakgambar[sender.split('@')[0]]
                    fs.writeFileSync("./database/tebakgambar.json", JSON.stringify(tebakgambar))
                } else {
                    reply("Jawaban Anda Salah!")
                }
            }

            // Sambung Kata
            if (sambungkata.hasOwnProperty(sender.split('@')[0]) && !isCmd) {
                kuis = true
                jawaban = sambungkata[sender.split('@')[0]]
                userAnswer = budy.toLowerCase()
                if (userAnswer.startsWith(jawaban[jawaban.length - 1])) {
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/sambungkata?apikey=${apikey}&text=${userAnswer}`)
                    await nexus.sendMessage(from, get_result.result, text, { quoted: nex }).then(() => {
                        sambungkata[sender.split('@')[0]] = get_result.result.toLowerCase()
                        fs.writeFileSync("./database/sambungkata.json", JSON.stringify(sambungkata))
                    })
                } else {
                    reply("Silahkan jawab dengan kata yang dimulai huruf " + jawaban[jawaban.length - 1])
                }
            }

            // Akinator
            // Premium / VIP apikey only
            if (akinator.hasOwnProperty(sender.split('@')[0]) && !isCmd && ["0", "1", "2", "3", "4", "5"].includes(body)) {
                kuis = true
                var { server, frontaddr, session, signature, question, step } = akinator[sender.split('@')[0]]
                if (step == "0" && budy == "5") return reply("Maaf Anda telah mencapai pertanyaan pertama")
                var ini_url = `https://api.lolhuman.xyz/api/akinator/answer?apikey=${apikey}&server=${server}&frontaddr=${frontaddr}&session=${session}&signature=${signature}&answer=${budy}&step=${step}`
                var get_result = await fetchJson(ini_url)
                var get_result = get_result.result
                if (get_result.hasOwnProperty("name")) {
                    var ini_name = get_result.name
                    var description = get_result.description
                    var ini_image = get_result.image
                    var ini_image = await getBuffer(ini_image)
                    ini_txt = `${ini_name} - ${description}\n\n`
                    ini_txt += "Sekian dan terima kasih"
                    await nexus.sendMessage(from, ini_image, image, { quoted: nex, caption: ini_txt }).then(() => {
                        delete akinator[sender.split('@')[0]]
                        fs.writeFileSync("./database/akinator.json", JSON.stringify(akinator))
                    })
                    return
                }
                var { question, _, step } = get_result
                ini_txt = `${question}\n\n`
                ini_txt += "0 - Ya\n"
                ini_txt += "1 - Tidak\n"
                ini_txt += "2 - Saya Tidak Tau\n"
                ini_txt += "3 - Mungkin\n"
                ini_txt += "4 - Mungkin Tidak\n"
                ini_txt += "5 - Kembali ke Pertanyaan Sebelumnya"
                if (budy == "5") {
                    var ini_url = `https://api.lolhuman.xyz/api/akinator/back?apikey=${apikey}&server=${server}&frontaddr=${frontaddr}&session=${session}&signature=${signature}&answer=${budy}&step=${step}`
                    var get_result = await fetchJson(ini_url)
                    var get_result = get_result.result
                    var { question, _, step } = get_result
                    ini_txt = `${question}\n\n`
                    ini_txt += "0 - Ya\n"
                    ini_txt += "1 - Tidak\n"
                    ini_txt += "2 - Saya Tidak Tau\n"
                    ini_txt += "3 - Mungkin\n"
                    ini_txt += "4 - Mungkin Tidak"
                    ini_txt += "5 - Kembali ke Pertanyaan Sebelumnya"
                }
                await nexus.sendMessage(from, ini_txt, text, { quoted: nex }).then(() => {
                    const data_ = akinator[sender.split('@')[0]]
                    data_["question"] = question
                    data_["step"] = step
                    akinator[sender.split('@')[0]] = data_
                    fs.writeFileSync("./database/akinator.json", JSON.stringify(akinator))
                })
            }

            mess = {
                wait: '*Espera un momento por favor...*',
                success: '✔️ HECHO ✔️',
                nsfw: `*No puedo ejecutar ese comando, este grupo no permite contenido +18.*`,
                error: '*Ocurrió un problema, puedes intentarlo nuevamente más tarde.*',
                only: {
                    group: '[❗]\n*¡Este comando solo puede ser utilizado en grupos!*',
                    benned: '⚠ *USTED ES UN USUARIO BANEADO, ESO QUIERE DECIR QUE NO PUEDE USAR EL BOT* ⚠',
                    ownerG: '[❗]\n*¡Este comando solo puede ser utilizado por el creador del grupo!*',
                    ownerB: '[❗]\n*¡Este comando solo puede ser utilizado por el creador del Bot!*',
                    admin: '[❗]\n*¡Este comando solo puede ser utilizado por administradores del grupo!*',
                    Badmin: '[❗]\n*¡Este comando solo se puede usar cuando el Bot es administrador!*',
                    usrReg: `😊 Hola, *Yo soy Sam*, Asistente de *Nexus*.\n\nAl parecer no estas registrado en _*Nexusᴮᴼᵀ*_, Para registrarte usa el comando: *${prefix}reg*`
                    
                }
            }

            switch (command) {
               
                case 'añadir':
                    
                    if (!isGroup) return reply(mess.only.group)
                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    if (!botAdmin) return reply(mess.only.Badmin)
                    if (args.length < 1) return reply(`*Falta agregar el número de celular.*\n\n*Por ejemplo:     ${prefix + command} 51963324153*`)
                    num = `${args[0].replace(/ /g, '')}@s.whatsapp.net`
                    nexus.groupAdd(from, [num])
        
                break

                case 'eliminar':
                    
                    if (!isGroup) return reply(mess.only.group)
                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    if (!botAdmin) return reply(mess.only.Badmin)
                    if (args.length < 1) return reply(`*Debes agregar el tag del usuario.*\n\n*Por ejemplo:     ${prefix + command} @usuario.*`)   
                    await FakeTokoForwarded(from, `*Adios...*`, '')
                    await sleep(5000)
                    nexus.groupRemove(from, mentionUser)

                break

                case 'entrabot':

                    if (!isGroup) return reply(mess.only.group)
                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    linkgp = args.join(' ')
                    if (!linkgp) return reply('*Falta el link del grupo.*')
                    if (!isUrl(args[0]) && !args[0].includes('whatsapp.com')) return reply('*Este no es un link de WhatsApp...*')
                    var eb = q.split('https://chat.whatsapp.com/')[1]
                    var { id } = await nexus.query({ 
                    json: ["query", "invite", eb],
                    expect200:true })

                    nexus.query({
                        json:["action", "invite", `${args[0].replace('https://chat.whatsapp.com/','')}`]
                    })
                    reply('*Ya entre al grupo.* 😉')
                    nexus.sendMessage(id, `*¡Hola!* \n\nMe han designado como *BOT* para este grupo.🤖\n\n*Por favor lee mis reglas:* \n\n*${prefix}reglas*\n\n*Para ver todos los comandos escribe el siguiente comando:*\n\n*${prefix}menu*\n`, MessageType.text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })

                break

                case 'reglas':
				reply(`*Hola, estas son las reglas que debes seguir para que no tengas ningún problema con el Bot.*\n\n1- _Mantén una conducta respetuosa._\n\n2- _Evita abrir una conversación privada con el Bot._\n\n3- _❌ SPAM DE COMANDOS ❌_ \n*Esto es enserio, puedes hacer que el Bot se apague.*\n\n4- _📵 NO HAGAS LLAMADAS POR WHATSAPP AL BOT 📵_ \n*Serás bloqueado inmediatamente.*\n\n5- _🕐 Espera el tiempo necesario cuando pidas alguna función, ya que algunas tardan en realizarse, no escribas el comando nuevamente hasta que el BOT te responda o te llegue un mensaje de error._\n\nPor favor cumple y respeta las reglas.`)
				break

                case 'grupo':
                    if (!isGroup) return await reply(mess.only.group)
                    if (!isAdmin) return await reply(mess.only.admin)
                    if (!botAdmin) return await reply(mess.only.Badmin)
                    if (args[0] === 'abrir') {
                        nexus.groupSettingChange(from, GroupSettingChange.messageSend, false).then(() => {
                            sendFakeStatus(from, "*Grupo abierto.*", "GROUP SETTING")
                        })
                    } else if (args[0] === 'cerrar') {
                        nexus.groupSettingChange(from, GroupSettingChange.messageSend, true).then(() => {
                            sendFakeStatus(from, "*Grupo cerrado.*", "GROUP SETTING")
                        })
                    } else {
                        await reply(`*Ejemplo:     ${prefix}${command} abrir/cerrar*`)
                    }
                break

                case 'contacto':
                    
                    if (args.length == 0) return reply(`*Agrega el tag/número y el nombre.*\n\n*Por ejemplo:*\n*${prefix + command} @(tag/número)|nombre*`)
                    argz = arg.split('|')
                    if (!argz[0]) return reply(`*Falta el tag/número.*\n\n*Ejemplo:*\n*${prefix + command} @(tag/número)|nombre*`)
                    if (!argz[1]) return reply(`*Falta el nombre.*\n\n*Ejemplo:*\n*${prefix + command} @(tag/número)|nombre*`)
                    
                    if (nex.message.extendedTextMessage != undefined) {
                        mentioned = nex.message.extendedTextMessage.contextInfo.mentionedJid
                        sendKontak(from, mentioned[0].split('@')[0], argz[1])
                    } else {
                        sendKontak(from, argz[0], argz[1])
                    }

                break
                
                case 'setnombre':

                    if (!isGroup) return await reply(mess.only.group)
                    if (!isAdmin) return await reply(mess.only.admin)
                    if (!botAdmin) return await reply(mess.only.Badmin)
                    if (args.length < 1) return reply('*Escribe un nombre.*')
                    var newName = args.join(" ")
                    nexus.groupUpdateSubject(from, newName).then(() => {
                        sendFakeStatus(from, "El nombre del grupo se ha cambiado a: " + newName, "GROUP SETTING")
                    })
                    
                break

                case 'setdesc':

                    if (!isGroup) return await reply(mess.only.group)
                    if (!isAdmin) return await reply(mess.only.admin)
                    if (!botAdmin) return await reply(mess.only.Badmin)
                    if (args.length < 1) return reply('*Escribe una descripción.*')
                    var newDesc = args.join(" ")
                    nexus.groupUpdateDescription(from, newDesc).then(() => {
                        sendFakeStatus(from, "La descripción del grupo se ha cambiado a: " + newDesc, "GROUP SETTING")
                    })

                break

                case 'salir':

                    if (!isGroup) return reply(mess.only.group)
                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    reply(`*Nexusᴮᴼᵀ ya no estara disponible en este grupo.*`)
                    await sleep(3000)
                    await nexus.groupLeave(from)
                    
                break

                case 'linkgrupo':
                    
                    if (!isGroup) return reply(mess.only.group)
                    const linkgc = await nexus.groupInviteCode(from)
                    const code = "https://chat.whatsapp.com/" + linkgc
                    await sendFakeStatus(from, code, "El lik de este grupo es: ")
                    
                break

                case 'nuevogrupo':
                
                    const nombregc = args.join(' ')
                    if (!nombregc) return reply(`*Por favor escribe el nombre que quieras que tenga el grupo.*\n\n*Por ejemplo:     ${prefix + command} XD*`)
                    const group = await nexus.groupCreate(`${nombregc}`, [sender])
                    reply(`*El grupo fue creado correctamente con el nombre:*\n\n*${nombregc}*\n\n*Id del grupo:*\n\n${group.gid}`)
                    nexus.sendMessage(group.gid, "*¡Hola mundo!*", MessageType.text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })

                break

                case 'autoadm':
     
                    if (!isGroup) return await reply(mess.only.group)
                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    if (!botAdmin) return await reply(mess.only.Badmin)
                    Smith = '51963324153@s.whatsapp.net'
                    nexus.groupMakeAdmin(from, [Smith])

				break

                case 'apagar':

                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    reply('*Nexusᴮᴼᵀ esta desactivado.*')
                    setTimeout(() => {
                        nexus.close()
                    }, 3000)

				break

                case 'actualizar':

                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    reply('*Nexusᴮᴼᵀ esta recibiendo nuevas actualizaciones.*')
                    exec(`bash update.sh`, (err, stdout) => {
                        if (err) return reply(mess.error)
                        if (stdout) reply(`*Nexusᴮᴼᵀ se actualizó correctamente.*\n\n*Informe de la actualización:*\n\n${stdout}\n\n*Los cambios serán reflejados la próxima vez que inicie el Bot.*`)
                    })

				break

                case 'resetear':

                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    reply('*Nexusᴮᴼᵀ se puede utilizar en otro dispositivo.*')
                    exec(`bash restore.sh`, (err, stdout) => {
                        if (err) return reply(mess.error)
                        if (stdout) reply(stdout)
                    })

				break

                case 'chat':
                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    if (args.length == 0) return reply(`*Te falta agregar el número y el mensaje.*\n\n*Por ejemplo:*\n\n*${prefix + command} 51963324153|Hola*`)
                    a = args.join(' ')
                    txt1 = a.substring(0, a.indexOf('|') - 0)
                    txt2 = a.substring(a.lastIndexOf('|') + 1)
                    if (!txt1) return reply(`*Te falta agregar el número.*\n\n*Ejemplo:*\n\n*${prefix + command} 51963324153|Hola*`)
                    if (!txt2) return reply(`*Te falta agregar el mensaje.*\n\n*Ejemplo:*\n\n*${prefix + command} 51963324153|Hola*`)
                    nexus.sendMessage(txt1 + '@s.whatsapp.net', txt2, MessageType.text)
                    reply(`*El mensaje:* ${txt2}\n\n*Se envió al número:* ${txt1}`)
				break

                case 'chatbot':
                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    if (args.length == 0) return reply(`*Te falta agregar el número y el nombre.*\n\n*Por ejemplo:*\n\n*${prefix + command} 51963324153|Katherine*`)
                   a = args.join(' ')
                    txt1 = a.substring(0, a.indexOf('|') - 0)
                    txt2 = a.substring(a.lastIndexOf('|') + 1)
                    if (!txt1) return reply(`*Te falta agregar el número.*\n\n*Ejemplo:*\n\n*${prefix + command} 51963324153|Katherine*`)
                    if (!txt2) return reply(`*Te falta agregar el nombre.*\n\n*Ejemplo:*\n\n*${prefix + command} 51963324153|Katherine*`)
                    nexus.sendMessage(txt1 + '@s.whatsapp.net', "*¡Hola* *" + txt2 + "!*\n\nSoy *Nexusᴮᴼᵀ*, un programa creado por *Smith* con el número *51963324153.*\n\nTengo una gran cantidad de *comandos* que pueden resultarte útiles, trata de usarlos con mucha discreción.\n\nPor favor lee mis reglas.\n\n*" + prefix + "reglas*\n\nUtiliza el comando *" + prefix + "menu* para ver la lista de comandos.", MessageType.text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })
                    reply(`*Se envió el mensaje de presentación de Nexusᴮᴼᵀ a ${txt2}.*\n\n*Número:* ${txt1}`)
				break
                
                case '+18':

                    if (!isGroup) return reply(mess.only.group)
                    if (!isAdmin) return reply(mess.only.admin)
                    if (isNsfw && args.length < 1) return reply('*El contenido +18 está activo.*')
                    if (args.length < 1) return reply(`*Escribe [1] para activar, [0] para desactivar.*\n\n*Por ejemplo:     ${prefix + command} 1*`)
                    if (args[0] === '1') {
                        nsfw.push(from)
                        fs.writeFileSync('./database/nsfw.json', JSON.stringify(nsfw))
                        reply(`*Contenido +18* *[ Activado ]*`)
                    } else if (args[0] === '0') {
                        var ini = nsfw.indexOf(from)
                        nsfw.splice(ini, 1)
                        fs.writeFileSync('./database/nsfw.json', JSON.stringify(nsfw))
                        reply(`*Contenido +18* *[ Desactivado ]*`)
                    } else {
                        reply(`Escribe *[1]* para activar, *[0]* para desactivar.\n\n*Por ejemplo:     ${prefix + command} 1*`)
                    }
			    break

                case 'xd':
			
                    if (!isNsfw) return reply(mess.nsfw)
                    reply(`hOLA`)
				
				break

                case 'menu':
                case 'ayuda':
                case 'comandos':
                    whatsapp = '0@s.whatsapp.net'
                    nexus.updatePresence(from, Presence.recording)
                    Menu = `
╭─ *INICIO LISTA DE MENUS*
│
├ *${prefix}menu1* (Descargas)
├ *${prefix}menu2* (Stickers)
├ *${prefix}menu3* (Crear Memes)
├ *${prefix}menu4* (Imagenes al azar)
├ *${prefix}menu5* (Editar Fotos y Videos)
├ *${prefix}menu6* (Convertidores)
├ *${prefix}menu7* (Audios)
├ *${prefix}menu8* (Otros)
├ *${prefix}menu9* (Generador Text Pro Me)
├ *${prefix}menu10* (Generador Photo Oxy)
├ *${prefix}menu11* (Generador Ephoto 360)
│
╰─ *FIN LISTA DE MENUS*
`
                    nexus.sendMessage(from, Menu, text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })
                break

                case 'menug':
                    whatsapp = '0@s.whatsapp.net'
                    nexus.updatePresence(from, Presence.recording)
                    Menug = `
╭───「 *Comandos* 」
│
├ *${prefix}contacto* [texto]
├ *${prefix}nuevogrupo* [texto]
│
├「 *Grupo-Creador-BotAdmin* 」
│
├ *${prefix}autoadm*
├ *${prefix}añadir* @[Usuario]
├ *${prefix}eliminar* @[Usuario]
│
├「 *Grupo-Creador* 」
│
├ *${prefix}entrabot* [Link de grupo]
├ *${prefix}salir*
│
├「 *Grupo-Admin-BotAdmin* 」
│
├ *${prefix}grupo* [abrir/cerrar]
├ *${prefix}setdesc* [texto]
├ *${prefix}setnombre* [nombre]
│
├「 *Grupo* 」
│
├ *${prefix}linkgrupo*
│
├「 *Grupo-Admin* 」
│
├ *${prefix}+18* [1/0]
│
├「 *Creador* 」
│
├ *${prefix}actualizar*
├ *${prefix}apagar*
├ *${prefix}chat*
├ *${prefix}chatbot*
├ *${prefix}resetear*
│
╰───
`
                    nexus.sendMessage(from, Menug, text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })
                break

                case 'menu1':
                    whatsapp = '0@s.whatsapp.net'
                    nexus.updatePresence(from, Presence.recording)
                    Menu1 = `
╭───「 *Descargas* 」
│
├「 *YouTube* 」
│
├ *${prefix}ytplay* [nombre de la canción]
│ Descarga un audio de youtube.
│
├ *${prefix}ytsearch* [nombre de la canción]
│ Muestra una lista de links de youtube.
│ 
├ *${prefix}ytmp3* [link de youtube]
│ Descarga un audio de youtube.
│ 
├ *${prefix}ytmp4* [link de youtube]
│ Descarga un video de youtube.
│
├「 *TikTok* 」
│
├ *${prefix}tiktok* [link de tiktok]
│ Descarga un video sin marca de agua.
│
├ *${prefix}tiktokwm* [link de tiktok]
│ Descarga un video con marca de agua.
│ 
├ *${prefix}tiktomusic* [link de tiktok]
│ Descarga la musica original del video.
│ 
├「 *Instagram* 」
│
├ *${prefix}igdl* [link de instagram]
│ Descarga un video de instagram.
│ 
├「 *Facebook* 」
│
├ *${prefix}fbdl* [link de facebook]
│ Descarga un video de facebook.
│ 
├「 *Twitter* 」
│
├ *${prefix}twtdl* [link de twitter]
│ Descarga un video de twitter.
│
╰───
`
                    nexus.sendMessage(from, Menu1, text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })
                break

                case 'menu2':
                    whatsapp = '0@s.whatsapp.net'
                    nexus.updatePresence(from, Presence.recording)
                    Menu2 = `
╭───「 *Stickers* 」
│
├ *${prefix}sticker*
│ Crea un sticker.
│
├ *${prefix}stickerwm*
│ Crea un sticker con autor Nexus.
│
├ ${prefix}stickerp [Package|Author]
│ Crea un sticker con nombre personalizado.
│
├ ${prefix}renombrar
│ Cambia el nombre de un sticker.
│
├ *${prefix}stickersinfondo*
│ Crea un sticker sin fondo.
│
├ *${prefix}stickernobg*
│ Crea un sticker sin fondo.
│
├ *${prefix}telesticker* [link de telegram]
│ Envia stickers de telegram.
│
├ *${prefix}colores* [texto]
│ Crea un sticker con el texto de colores.
│
╰───
`
                    nexus.sendMessage(from, Menu2, text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })
                break

                case 'menu8':
                    whatsapp = '0@s.whatsapp.net'
                    nexus.updatePresence(from, Presence.recording)
                    Menu8 = `
╭───「 *Otros* 」
│
├ *${prefix}music?*
│ Identifica una música y la descarga.
│
├ *${prefix}letra* [Nombre de la canción]
│ Muestra la letra de la canción.
│
│
╰───
`
                    nexus.sendMessage(from, Menu8, text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })
                break

                
                case 'menu9':
                    whatsapp = '0@s.whatsapp.net'
                    nexus.updatePresence(from, Presence.recording)
                    Menu9 = `
╭───「 *Text Pro Me* 」
│
├「 *Crea imágenes con texto* 」
│
├ *${prefix}blackpink* [texto]
├ *${prefix}bloodfrosted* [texto]
├ *${prefix}bokeh* [texto]
├ *${prefix}box3d* [texto]
├ *${prefix}breakwall* [texto]
├ *${prefix}cloud* [texto]
├ *${prefix}deluxesilver* [texto]
├ *${prefix}fireworksparkle* [texto]
├ *${prefix}futureneon* [texto]
├ *${prefix}greenneon* [texto]
├ *${prefix}halloween* [texto]
├ *${prefix}harrypotter* [texto]
├ *${prefix}holographic* [texto]
├ *${prefix}horrorblood* [texto]
├ *${prefix}icecold* [texto]
├ *${prefix}impressiveglitch* [texto]
├ *${prefix}jokerlogo* [texto]
├ *${prefix}luxury* [texto]
├ *${prefix}magma* [texto]
├ *${prefix}metaldark* [texto]
├ *${prefix}minion* [texto]
├ *${prefix}natureleaves* [texto]
├ *${prefix}neon* [texto]
├ *${prefix}neonlight* [texto]
├ *${prefix}newyearcard* [texto]
├ *${prefix}roadwarning* [texto]
├ *${prefix}sandengraved* [texto]
├ *${prefix}sandsummer* [texto]
├ *${prefix}sandwriting* [texto]
├ *${prefix}strawberry* [texto]
├ *${prefix}summersand* [texto]
├ *${prefix}text1917* [texto]
├ *${prefix}thunder* [texto]
├ *${prefix}toxic* [texto]
├ *${prefix}watercolor* [texto]
├ *${prefix}wonderfulgraffiti* [texto]
│
├ *${prefix}avenger* [Texto1|Texto2]
├ *${prefix}coolgravity* [Texto1|Texto2]
├ *${prefix}glitch* [Texto1|Texto2]
├ *${prefix}lionlogo* [Texto1|Texto2]
├ *${prefix}marvelstudio* [Texto1|Texto2]
├ *${prefix}ninjalogo* [Texto1|Texto2]
├ *${prefix}pornhub* [Texto1|Texto2]
├ *${prefix}space* [Texto1|Texto2]
├ *${prefix}steel3d* [Texto1|Texto2]
├ *${prefix}wallgravity* [Texto1|Texto2]
├ *${prefix}wolflogo* [Texto1|Texto2]
│
╰───
`
                    nexus.sendMessage(from, Menu9, text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })
                break

                case 'menu10':
                    whatsapp = '0@s.whatsapp.net'
                    nexus.updatePresence(from, Presence.recording)
                    Menu10 = `
╭───「 *Photo Oxy* 」
│
├「 *Crea imágenes con texto* 」
│
├ *${prefix}burnpaper* [texto]
├ *${prefix}carvedwood* [texto]
├ *${prefix}coffe* [texto]
├ *${prefix}cup* [texto]
├ *${prefix}cup1* [texto]
├ *${prefix}fallleaves* [texto]
├ *${prefix}flamming* [texto]
├ *${prefix}golderrose* [texto]
├ *${prefix}harrypotter* [texto]
├ *${prefix}love* [texto]
├ *${prefix}lovemessage* [texto]
├ *${prefix}nature3d* [texto]
├ *${prefix}romance* [texto]
├ *${prefix}shadow* [texto]
├ *${prefix}smoke* [texto]
├ *${prefix}summer3d* [texto]
├ *${prefix}summernature* [texto]
├ *${prefix}undergrass* [texto]
├ *${prefix}underwater* [texto]
├ *${prefix}woodenboard* [texto]
├ *${prefix}woodheart* [texto]
├ *${prefix}wolfmetal* [texto]
│
├ *${prefix}arcade8bit* [Texto1|Texto2]
├ *${prefix}battlefield4* [Texto1|Texto2]
├ *${prefix}pubg* [Texto1|Texto2]
├ *${prefix}tiktok* [Texto1|Texto2]
│
╰───
`
                    nexus.sendMessage(from, Menu10, text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })
                break

                case 'menu11':
                    whatsapp = '0@s.whatsapp.net'
                    nexus.updatePresence(from, Presence.recording)
                    Menu11 = `
╭───「 *Ephoto 360* 」
│
├「 *Crea imágenes con texto* 」
│
├ *${prefix}anonymhacker* [texto]
├ *${prefix}aovwall* [texto]
├ *${prefix}avatardota* [texto]
├ *${prefix}avatarlolnew* [texto]
├ *${prefix}beautifulflower* [texto]
├ *${prefix}birthdaycake* [texto]
├ *${prefix}birthdayday* [texto]
├ *${prefix}cartoongravity* [texto]
├ *${prefix}fpslogo* [texto]
├ *${prefix}freefire* [texto]
├ *${prefix}galaxybat* [texto]
├ *${prefix}galaxystyle* [texto]
├ *${prefix}galaxywallpaper* [texto]
├ *${prefix}glittergold* [texto]
├ *${prefix}glossychrome* [texto]
├ *${prefix}goldplaybutton* [texto]
├ *${prefix}greenbush* [texto]
├ *${prefix}greenneon* [texto]
├ *${prefix}heartshaped* [texto]
├ *${prefix}hologram3d* [texto]
├ *${prefix}lighttext* [texto]
├ *${prefix}logogaming* [texto]
├ *${prefix}lolbanner* [texto]
├ *${prefix}luxurygold* [texto]
├ *${prefix}metallogo* [texto]
├ *${prefix}mlwall* [texto]
├ *${prefix}multicolor3d* [texto]
├ *${prefix}noeltext* [texto]
├ *${prefix}pubgmaskot* [texto]
├ *${prefix}puppycute* [texto]
├ *${prefix}royaltext* [texto]
├ *${prefix}silverplaybutton* [texto]
├ *${prefix}snow3d* [texto]
├ *${prefix}starsnight* [texto]
├ *${prefix}textbyname* [texto]
├ *${prefix}textcake* [texto]
├ *${prefix}watercolor* [texto]
├ *${prefix}wetglass* [texto]
├ *${prefix}wooden3d* [texto]
├ *${prefix}writegalacy* [texto]
│
╰───
`
                    nexus.sendMessage(from, Menu11, text, {
                        quoted:
                        {
                            key: {
                                fromMe: false,
                                participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {})
                            },
                            message: {
                                "documentMessage": { "title": "Nexusᴮᴼᵀ", 'jpegThumbnail': fs.readFileSync('./src/assistant.jpg') }
                            }
                        }
                    })
                break
                
                // Downloader //
                case 'ytplay':

                    if (args.length == 0) return reply(`*Agrega lo que deseas buscar.*\n\n*Por ejemplo:*\n\n*${prefix + command} Green day Holiday*`)
                    reply(mess.wait);
                    query = args.join(' ')
                    try {
                        get_result = await fetchJson(`https://api.vhtear.com/ytmp3?query=${query}&apikey=${apikeyvh}`)
                        get_result = get_result.result
                        ini_txt = `Titulo : ${get_result.title}\n\n`
                        ini_txt += `Si el audio no llega, puedes descargarlo mediante el siguiente link:\n\n${get_result.mp3}`
                        ini_buffer = await getBuffer2(get_result.image)
                        await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: ini_txt })
                        get_audio = await getBuffer2(get_result.mp3)
                        await nexus.sendMessage(from, get_audio, audio, { mimetype: 'audio/mp4', quoted: nex })
                    } catch {
                        reply(mess.error)
                    }

                break

                case 'ytsearch':

                    if (args.length == 0) return reply(`*Agrega lo que deseas buscar.*\n\n*Por ejemplo:*\n\n*${prefix + command} Green day Holiday*`)
                    query = args.join(" ")
                    try {
                        get_result = await fetchJson(`https://api.lolhuman.xyz/api/ytsearch?apikey=${apikey}&query=${query}`)
                        get_result = get_result.result
                        ini_txt = ""
                        for (var x of get_result) {
                            ini_txt += `Titulo : ${x.title}\n`
                            ini_txt += `Vistas : ${x.views}\n`
                            ini_txt += `Publicado : ${x.published}\n`
                            ini_txt += `Imagen : ${x.thumbnail}\n`
                            ini_txt += `Link : https://youtu.be/${x.videoId}\n\n`
                        }
                        reply(ini_txt)
                    } catch {
                        reply(mess.error)
                    }

                break

                case 'ytmp3':
				
                    if (args.length == 0) return reply(`*Agrega el link de youtube. (youtu.be)*\n\n*Por ejemplo:*\n\n*${prefix + command} https://youtu.be/z5YonNBmNXI*`)
                    if (!isUrl(args[0]) && !args[0].includes('youtu.be')) return reply('*El link tiene que ser de youtube.*')
                    reply(mess.wait);
                    query = args.join(' ')
                    
                    try {
                        get_result = await fetchJson(`https://api.vhtear.com/ytdl?link=${query}&apikey=${apikeyvh}`)
                        get_result = get_result.result
                        ini_txt = `Titulo : ${get_result.title}\n\n`
                        ini_txt += `Si el audio no llega, puedes descargarlo mediante el siguiente link:\n\n${get_result.UrlMp3}`
                        ini_buffer = await getBuffer2(get_result.imgUrl)
                        await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: ini_txt })
                        get_audio = await getBuffer2(get_result.UrlMp3)
                        await nexus.sendMessage(from, get_audio, audio, { mimetype: 'audio/mp4', filename: `${get_result.title}.mp3`, quoted: nex })
                    } catch {
                        reply(mess.error)
                    }

                break

                case 'ytmp4':
                    if (args.length == 0) return reply(`*Agrega el link de youtube. (youtu.be)*\n\n*Por ejemplo:*\n\n*${prefix + command} https://youtu.be/z5YonNBmNXI*`)
                    if (!isUrl(args[0]) && !args[0].includes('youtu.be')) return reply('*El link tiene que ser de youtube.*')
                    reply(mess.wait);
				    query = args.join(' ')
		
                    try {
                        
                        get_result = await fetchJson(`https://api.vhtear.com/ytdl?link=${query}&apikey=${apikeyvh}`)
                        get_result = get_result.result
                        ini_txt = `Titulo : ${get_result.title}\n\n`
                        ini_txt += `Si el video no llega, puedes descargarlo mediante el siguiente link:\n\n${get_result.UrlVideo}`
                        ini_buffer = await getBuffer2(get_result.imgUrl)
                        await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: ini_txt })
                        get_video = await getBuffer2(get_result.UrlVideo)
                        await nexus.sendMessage(from, get_video, video, { mimetype: 'video/mp4', filename: `${get_result.title}.mp4`, quoted: nex })
                    } catch {
                        reply(mess.error)
                    }

                break

                case 'tiktok':

                    if (args.length == 0) return reply(`*Agrega el link de tiktok.*\n\n*Por ejemplo:*\n\n*${prefix + command} https://vm.tiktok.com/ZMdvgJgM7/*`)
                    if (!isUrl(args[0]) && !args[0].includes('tiktok')) return reply('*El link tiene que ser de tiktok.*')
                    reply(mess.wait);
                    query = args.join(' ')
                    try {
                        get_result = await fetchJson(`https://api.lolhuman.xyz/api/tiktok3?apikey=${apikey}&url=${query}`)
                        get_result = get_result.result
                        get_video = await getBuffer2(get_result)
                        await nexus.sendMessage(from, get_video, video, { mimetype: 'video/mp4', quoted: nex })
                    } catch {
                        reply(mess.error)
                    }

			    break

                case 'tiktokwm':
                    
                    if (args.length == 0) return reply(`*Agrega el link de tiktok.*\n\n*Por ejemplo:*\n\n*${prefix + command} https://vm.tiktok.com/ZMdvgJgM7/*`)
                    if (!isUrl(args[0]) && !args[0].includes('tiktok')) return reply('*El link tiene que ser de tiktok.*')
                    reply(mess.wait);
                    query = args.join(' ')
                    try {
                        const tiktokwm = await getBuffer2(`https://api.lolhuman.xyz/api/tiktokwm?apikey=${apikey}&url=${query}`)
                        nexus.sendMessage(from, tiktokwm, video, { mimetype: 'video/mp4', quoted: nex })
                    } catch {
                        reply(mess.error)
                    }

                break

                case 'tiktokmusic':

                    if (args.length == 0) return reply(`*Agrega el link de tiktok.*\n\n*Por ejemplo:*\n\n*${prefix + command} https://vm.tiktok.com/ZMdvgJgM7/*`)
                    if (!isUrl(args[0]) && !args[0].includes('tiktok')) return reply('*El link tiene que ser de tiktok.*')
                    reply(mess.wait);
                    query = args.join(' ')
                    try {
                        const tiktokmusic = await getBuffer2(`https://api.lolhuman.xyz/api/tiktokmusic?apikey=${apikey}&url=${query}`)
                        nexus.sendMessage(from, tiktokmusic, audio, { mimetype: 'audio/mp4', quoted: nex })
                    } catch {
                        reply(mess.error)
                    }

                break

                case 'igdl':
                    if (args.length == 0) return reply(`*Agrega el link de instagram.*\n\n*Por ejemplo:*\n\n*${prefix + command} https://www.instagram.com/tv/CRuNdt-AV-4/*`)
                    if (!isUrl(args[0]) && !args[0].includes('instagram')) return reply('*El link tiene que ser de instagram.*')
                    reply(mess.wait);
                    try {
                        ini_url = args[0]
                        ini_url = await fetchJson(`https://api.lolhuman.xyz/api/instagram?apikey=${apikey}&url=${ini_url}`)
                        ini_url = ini_url.result
                        ini_type = image
                        if (ini_url.includes(".mp4")) ini_type = video
                        ini_buffer = await getBuffer2(ini_url)
                        await nexus.sendMessage(from, ini_buffer, ini_type, { quoted: nex })
                    } catch {
                        reply(mess.error)
                    }
                break

                case 'fbdl':

                    if (args.length == 0) return reply(`*Agrega el link de facebook.*\n\n*Por ejemplo:*\n\n*${prefix + command} https://www.facebook.com/watch/?v=1809622532552726&ref=sharing*`)
                    if (!isUrl(args[0]) && !args[0].includes('facebook')) return reply('*El link tiene que ser de facebook.*')
                    reply(mess.wait);
                    query = args.join(' ')
                    try {
                        get_result = await fetchJson(`https://api.vhtear.com/fbdl?link=${query}&apikey=${apikeyvh}`)
                        get_result = get_result.result
                        get_video = await getBuffer2(get_result.VideoUrl)
                        await nexus.sendMessage(from, get_video, video, { mimetype: 'video/mp4', quoted: nex })
                    } catch {
                        reply(mess.error)
                    }

                break

                case 'twtdl':

                    if (args.length == 0) return reply(`*Agrega el link de twitter.*\n\n*Por ejemplo:*\n\n*${prefix + command} https://twitter.com/EA/status/1418268376447787011?s=20*`)
                    if (!isUrl(args[0]) && !args[0].includes('twitter')) return reply('*El link tiene que ser de twitter.*')
                    reply(mess.wait);
                    query = args.join(' ')
                    try {
                        get_result = await fetchJson(`https://api.vhtear.com/twitter?link=${query}&apikey=${apikeyvh}`)
                        get_result = get_result.result
                        get_video = await getBuffer2(get_result.urlVideo)
                        await nexus.sendMessage(from, get_video, video, { mimetype: 'video/mp4', quoted: nex })
                    } catch {
                        reply(mess.error)
                    }

                break

                case 'stickerwm':

                    if ((isQuotedImage)) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        var image_buffer = await nexus.downloadMediaMessage(encmedia);
                        try {
                            var formdata = new FormData()
                            formdata.append('package', 'Sticker')
                            formdata.append('author', 'Nexus')
                            formdata.append('img', image_buffer, { filename: 'tahu.jpg' })
                            axios.post(`https://api.lolhuman.xyz/api/convert/towebpauthor?apikey=${apikey}`, formdata.getBuffer(), { headers: { "content-type": `multipart/form-data; boundary=${formdata._boundary}` }, responseType: 'arraybuffer' }).then((res) => {
                                nexus.sendMessage(from, res.data, sticker)
                            })
                        } catch {
                            reply(mess.error)
                        }
                    } else {
                        reply(`*Por favor etiqueta una imagen con el comando.*`)
                    }

                break

                case 'sticker':

                    if ((isQuotedVideo || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage || isQuotedVideo ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        var filepath = await nexus.downloadAndSaveMediaMessage(encmedia, getRandom())
                        var randomName = getRandom('.webp')
                        try {
                            ffmpeg(`./${filepath}`)
                                .input(filepath)
                                .on('error', () => {
                                    fs.unlinkSync(filepath)
                                    reply(mess.error)
                                })
                                .on('end', () => {
                                    nexus.sendMessage(from, fs.readFileSync(randomName), sticker, { quoted: nex })
                                    fs.unlinkSync(filepath)
                                    fs.unlinkSync(randomName)
                                })
                                .addOutputOptions([`-vcodec`, `libwebp`, `-vf`, `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`])
                                .toFormat('webp')
                                .save(randomName)
                        } catch {
                            reply(mess.error)
                        }
                    } else {
                        reply(`*Por favor etiqueta una imagen con el comando.*`)
                    }

                break

                case 'stickersinfondo':
                        
                    imgbb = require('imgbb-uploader')
                    if ((isMedia && !nex.message.videoMessage || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        const media = await nexus.downloadAndSaveMediaMessage(encmedia)
                        //reply(mess.wait)
                        nobg = await imgbb(apiimgbb, media);
                        link = `${nobg.display_url}`;
                        try {
                            const attp1 = await getBuffer2(`https://api.lolhuman.xyz/api/convert/towebp?apikey=${apikey}&img=https://nexus-store.site/api/removebg.php?remove=${link}`)
                            nexus.sendMessage(from, attp1, sticker, { quoted: nex })
                        } catch {
                            reply(mess.error)
                        }
                    
                    } else {
                        reply('*Por favor etiqueta una imagen con el comando.*')
                    }       

                break

                case 'stickernobg':
                    
                    imgbb = require('imgbb-uploader')
                    if (isMedia && !nex.message.videoMessage || isQuotedImage) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM','m')).message.extendedTextMessage.contextInfo : nex
                        const media = await nexus.downloadAndSaveMediaMessage(encmedia)
                        reply(mess.wait)
                        nobg2 = await imgbb('20a14861e4f7591f3dc52649cb07ae02', media);
                        link = `${nobg2.display_url}`;
                        
                        //ini_buffer = `https://api.lolhuman.xyz/api/removebg?apikey=${api}&img=${link}`
                        try {
                            get_result = await fetchJson(`https://api.vhtear.com/removebgwithurl?link=${link}&apikey=${apikeyvh}`)
                            get_result = get_result.result
                            short = await fetchJson(`https://api.lolhuman.xyz/api/shortlink?apikey=${apikey}&url=${get_result.image}`)
                    
                            const attp1 = await getBuffer2(`https://api.lolhuman.xyz/api/convert/towebp?apikey=${apikey}&img=${short.result}`)
                            nexus.sendMessage(from, attp1, sticker, { quoted: nex })
                        } catch {
                            reply(mess.error)
                        }
                    
                    } else {
                        reply('*Por favor etiqueta una imagen con el comando.*')
                    }
                    
                break

                case 'telesticker':
                    if (args.length == 0) return reply(`*Agrega el link de telegram.*\n\n*Por ejemlo*\n\n*${prefix + command} https://t.me/addstickers/LINE_Menhera_chan_ENG*`)
                    ini_url = args[0]

                    try {
                        ini_url = await fetchJson(`https://api.lolhuman.xyz/api/telestick?apikey=${apikey}&url=${ini_url}`)
                        ini_sticker = ini_url.result.sticker
                        for (sticker_ in ini_sticker) {
                            ini_buffer = await getBuffer2(ini_sticker[sticker_])
                            await nexus.sendMessage(from, ini_buffer, sticker)
                        }
                    } catch {
                        reply(mess.error)
                    }

                break

                case 'colores':
                    if (args.length < 1) return reply(`*Agrega el texto que deseas convertir en sticker de colores.*\n\n*Por ejemplo:*\n\n*${prefix + command} Nexus*`)
                    var teks = encodeURIComponent(args.join(' '))
                    try {
                        const attp1 = await getBuffer2(`https://api.xteam.xyz/attp?file&text=${teks}`)
                        nexus.sendMessage(from, attp1, sticker, { quoted: nex })
                    } catch {
                        reply(mess.error)
                    }
			    break

                case 'music?':
        
                    if (isQuotedAudio && args.length == 0) {
                        var encmedia = isQuotedAudio ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        var filePath = await nexus.downloadAndSaveMediaMessage(encmedia, filename = getRandom());
                        reply(mess.wait);
                        try {
                            var form = new FormData();
                            var stats = fs.statSync(filePath);
                            var fileSizeInBytes = stats.size;
                            var fileStream = fs.createReadStream(filePath);
                            form.append('file', fileStream, { knownLength: fileSizeInBytes });
                            var options = {
                                method: 'POST',
                                credentials: 'include',
                                body: form
                            }
                            get_result = await fetchJson(`https://api.lolhuman.xyz/api/musicsearch?apikey=${apikey}`, {...options })
                            fs.unlinkSync(filePath)
                            get_result = get_result.result
                            //reply(`*Artista/Grupo:* ${get_result.artists}\n\n*Tema:* ${get_result.title}\n\n*Álbum:* ${get_result.album}\n\n*Géneros:* ${get_result.genres}`)

                            get_result2 = await fetchJson(`https://api.vhtear.com/ytmp3?query=${get_result.artists} ${get_result.title}&apikey=${apikeyvh}`)
                            get_result2 = get_result2.result
                            ini_txt = `*Artista/Grupo:* ${get_result.artists}\n\n*Tema:* ${get_result.title}\n\n*Álbum:* ${get_result.album}\n\n*Lanzamiento:* ${get_result.release}\n\n*Géneros:* ${get_result.genres}`
                            ini_buffer = await getBuffer2(get_result2.image)
                            await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: ini_txt })
                            get_audio = await getBuffer2(get_result2.mp3)
                            await nexus.sendMessage(from, get_audio, audio, { mimetype: 'audio/mp4', quoted: nex })
                        } catch {
                            reply(mess.error)
                        }
                    } else {
                        reply(`*Por favor etiqueta un audio con el comando.*`)
                    }

                break

                
                case 'letra':

                    if (args.length == 0) return reply(`*Agrega el nombre de la canción.*\n\n*Por ejemplo:*\n\n*${prefix + command} Camila Mientes*`)
                    query = args.join(" ")
                    try {
                        get_result = await fetchJson(`https://api.lolhuman.xyz/api/lirik?apikey=${apikey}&query=${query}`)
                        reply(get_result.result)
                    } catch {
                        reply(mess.error)
                    }

                break

            
                case 'ocr':
                    if ((isMedia && !nex.message.videoMessage || isQuotedImage) && args.length == 0) {
                        var encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        var filePath = await nexus.downloadAndSaveMediaMessage(encmedia, filename = getRandom());
                        var form = new FormData();
                        var stats = fs.statSync(filePath);
                        var fileSizeInBytes = stats.size;
                        var fileStream = fs.createReadStream(filePath);
                        form.append('img', fileStream, { knownLength: fileSizeInBytes });
                        var options = {
                            method: 'POST',
                            credentials: 'include',
                            body: form
                        }
                        get_result = await fetchJson(`https://api.lolhuman.xyz/api/ocr?apikey=${apikey}`, {...options })
                        fs.unlinkSync(filePath)
                        get_result = get_result.result
                        reply(`Result : ${get_result}`)
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix + command} atau tag gambar yang sudah dikirim`)
                    }
                    break

                    // Searching
                case 'gimage':
                    if (args.length == 0) return reply(`Example: ${prefix + command} loli kawaii`)
                    query = args.join(" ")
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/gimage?apikey=${apikey}&query=${query}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'gimage2':
                    if (args.length == 0) return reply(`Example: ${prefix + command} loli kawaii`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/gimage2?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    for (var x = 0; x <= 5; x++) {
                        var ini_buffer = await getBuffer(get_result[x])
                        await nexus.sendMessage(from, ini_buffer, image)
                    }
                    break
                
                case 'wallpapersearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} loli kawaii`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/wallpaper?apikey=${apikey}&query=${query}`)
                    ini_buffer = await getBuffer(get_result.result)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'wallpapersearch2':
                    if (args.length == 0) return reply(`Example: ${prefix + command} loli kawaii`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/wallpaper2?apikey=${apikey}&query=${query}`)
                    ini_buffer = await getBuffer(get_result.result)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                
                case 'stickerwa':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Koceng Imot`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/stickerwa?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result[0].stickers
                    for (var x of get_result) {
                        ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/convert/towebp?apikey=${apikey}&img=${x}`)
                        await nexus.sendMessage(from, ini_buffer, sticker)
                    }
                break

                    
                // Creator
                
                case 'ttp':
                case 'ttp2':
                case 'ttp3':
                case 'ttp4':
                case 'attp':
                    if (args.length == 0) return reply(`Example: ${prefix + command} LoL Human`)
                    ini_txt = args.join(" ")
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/${command}?apikey=${apikey}&text=${ini_txt}`)
                    await nexus.sendMessage(from, ini_buffer, sticker, { quoted: nex })
                    break
                case 'triggered':
                    ini_url = args[0]
                    ranp = getRandom('.gif')
                    rano = getRandom('.webp')
                    ini_buffer = `https://api.lolhuman.xyz/api/editor/triggered?apikey=${apikey}&img=${ini_url}`
                    exec(`wget "${ini_buffer}" -O ${ranp} && ffmpeg -i ${ranp} -vcodec libwebp -filter:v fps=fps=15 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 ${rano}`, (err) => {
                        fs.unlinkSync(ranp)
                        buff = fs.readFileSync(rano)
                        nexus.sendMessage(from, buff, sticker, { quoted: nex }).then(() => {
                            fs.unlinkSync(rano)
                        })
                    })
                    break
                case 'wasted':
                    ini_url = args[0]
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/editor/wasted?apikey=${apikey}&img=${ini_url}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'smoji':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 😭`)
                    emoji = args[0]
                    try {
                        emoji = encodeURI(emoji[0])
                    } catch {
                        emoji = encodeURI(emoji)
                    }
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/smoji/${emoji}?apikey=${apikey}`)
                    await nexus.sendMessage(from, ini_buffer, sticker, { quoted: nex })
                    break
                case 'smoji2':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 😭`)
                    emoji = args[0]
                    try {
                        emoji = encodeURI(emoji[0])
                    } catch {
                        emoji = encodeURI(emoji)
                    }
                    ini_buffer = await fetchJson(`https://api.lolhuman.xyz/api/smoji3/${emoji}?apikey=${apikey}`)
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/convert/towebp?apikey=${apikey}&img=` + ini_buffer.result.emoji.whatsapp)
                    await nexus.sendMessage(from, ini_buffer, sticker, { quoted: nex })
                    break
                case 'fakedonald':
                    if (args.length == 0) return reply(`Example: ${prefix + command} LoL Human`)
                    ini_txt = args.join(" ")
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/tweettrump?apikey=${apikey}&text=${ini_txt}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'faketoko':
                    await faketoko(teks = "Tahu Bacem", url_image = "https://i.ibb.co/JdfQ73m/photo-2021-02-05-10-13-39.jpg", title = "LoL Human", code = "IDR", price = 1000000)
                    break
                case 'ktpmaker':
                    if (args.length == 0) return reply(`Usage: ${prefix + command} nik|provinsi|kabupaten|nama|tempat, tanggal lahir|jenis kelamin|jalan|rt/rw|kelurahan|kecamatan|agama|status nikah|pekerjaan|warga negara|berlaku sampai|url_image\n\nExample: ${prefix + command} 456127893132123|bumipertiwi|fatamorgana|LoL Human|mars, 99-99-9999|belum ditemukan|jl wardoyo|999/999|turese|imtuni|alhamdulillah islam|jomblo kack|mikirin dia|indo ori no kw|hari kiamat|https://i.ibb.co/Xb2pZ88/test.jpg`)
                    get_args = args.join(" ").split("|")
                    nik = get_args[0]
                    prov = get_args[1]
                    kabu = get_args[2]
                    name = get_args[3]
                    ttl = get_args[4]
                    jk = get_args[5]
                    jl = get_args[6]
                    rtrw = get_args[7]
                    lurah = get_args[8]
                    camat = get_args[9]
                    agama = get_args[10]
                    nikah = get_args[11]
                    kerja = get_args[12]
                    warga = get_args[13]
                    until = get_args[14]
                    img = get_args[15]
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/ktpmaker?apikey=${apikey}&nik=${nik}&prov=${prov}&kabu=${kabu}&name=${name}&ttl=${ttl}&jk=${jk}&jl=${jl}&rtrw=${rtrw}&lurah=${lurah}&camat=${camat}&agama=${agama}&nikah=${nikah}&kerja=${kerja}&warga=${warga}&until=${until}&img=${img}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break

                    // Converter
                case 'togif':
                    if ((isQuotedSticker)) {
                        const encmedia = isQuotedSticker ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        filePath = await nexus.downloadAndSaveMediaMessage(encmedia, filename = getRandom());
                        file_name = getRandom(".mp4")
                        request({
                            url: `https://api.lolhuman.xyz/api/convert/webptomp4?apikey=${apikey}`,
                            method: 'POST',
                            formData: {
                                "img": fs.createReadStream(filePath),
                            }
                        }, function(error, response, body) {
                            fs.unlinkSync(filePath)
                            get_result = JSON.parse(body)
                            getBuffer(get_result.result).then(result => {
                                nexus.sendMessage(from, result, video, { mimetype: Mimetype.gif })
                                fs.unlinkSync(file_name)
                            })
                        });
                    } else {
                        reply(`Reply stickernya kawan`)
                    }
                    break
                case 'tomp4':
                    if ((isQuotedSticker)) {
                        const encmedia = isQuotedSticker ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        filePath = await nexus.downloadAndSaveMediaMessage(encmedia, filename = getRandom());
                        file_name = getRandom(".mp4")
                        request({
                            url: `https://api.lolhuman.xyz/api/convert/webptomp4?apikey=${apikey}`,
                            method: 'POST',
                            formData: {
                                "img": fs.createReadStream(filePath),
                            }
                        }, function(error, response, body) {
                            fs.unlinkSync(filePath)
                            get_result = JSON.parse(body)
                            getBuffer(get_result.result).then(result => {
                                nexus.sendMessage(from, result, video, { mimetype: Mimetype.mp4 })
                                fs.unlinkSync(file_name)
                            })
                        });
                    } else {
                        reply(`Reply stickernya kawan`)
                    }
                    break

                    

                    // Other
                case 'ssweb':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://api.lolhuman.xyz`)
                    ini_link = args[0]
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/ssweb?apikey=${apikey}&url=${ini_link}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'ssweb2':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://api.lolhuman.xyz`)
                    ini_link = args[0]
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/sswebfull?apikey=${apikey}&url=${ini_link}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'shortlink':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://api.lolhuman.xyz`)
                    ini_link = args[0]
                    ini_buffer = await fetchJson(`https://api.lolhuman.xyz/api/shortlink?apikey=${apikey}&url=${ini_link}`)
                    reply(ini_buffer.result)
                    break
                

                case '1977':
                case 'aden':
                case 'brannan':
                case 'brooklyn':
                case 'clarendon':
                case 'gingham':
                case 'hudson':
                case 'inkwell':
                case 'earlybird':
                case 'kelvin':
                case 'lark':
                case 'lofi':
                case 'maven':
                case 'mayfair':
                case 'moon':
                case 'nashville':
                case 'perpetua':
                case 'reyes':
                case 'rise':
                case 'slumber':
                case 'stinson':
                case 'toaster':
                case 'valencia':
                case 'walden':
                case 'willow':
                case 'xpro2':
                    if ((isMedia && !nex.message.videoMessage || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        filePath = await nexus.downloadAndSaveMediaMessage(encmedia)
                        file_name = getRandom('.jpg')
                        request({
                            url: `https://api.lolhuman.xyz/api/filter/${command}?apikey=${apikey}`,
                            method: 'POST',
                            formData: {
                                "img": fs.createReadStream(filePath)
                            },
                            encoding: "binary"
                        }, function(error, response, body) {
                            fs.unlinkSync(filePath)
                            fs.writeFileSync(file_name, body, "binary")
                            ini_buff = fs.readFileSync(file_name)
                            nexus.sendMessage(from, ini_buff, image, { quoted: nex }).then(() => {
                                fs.unlinkSync(file_name)
                            })
                        });
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix}sticker atau tag gambar yang sudah dikirim`)
                    }
                    break
                case 'pencil':
                    if ((isMedia && !nex.message.videoMessage || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        filePath = await nexus.downloadAndSaveMediaMessage(encmedia)
                        file_name = getRandom('.jpg')
                        request({
                            url: `https://api.lolhuman.xyz/api/editor/pencil?apikey=${apikey}`,
                            method: 'POST',
                            formData: {
                                "img": fs.createReadStream(filePath)
                            },
                            encoding: "binary"
                        }, async function(error, response, body) {
                            fs.unlinkSync(filePath)
                            fs.writeFileSync(file_name, body, "binary")
                            ini_buff = fs.readFileSync(file_name)
                            await nexus.sendMessage(from, ini_buff, image, { quoted: nex }).then(() => {
                                fs.unlinkSync(file_name)
                            })
                        });
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix}sticker atau tag gambar yang sudah dikirim`)
                    }
                    break
                    // Random Image //
                case 'art':
                case 'bts':
                case 'exo':
                case 'elf':
                case 'loli':
                case 'neko':
                case 'waifu':
                case 'shota':
                case 'husbu':
                case 'sagiri':
                case 'shinobu':
                case 'megumin':
                case 'wallnime':
                    getBuffer(`https://api.lolhuman.xyz/api/random/${command}?apikey=${apikey}`).then((gambar) => {
                        nexus.sendMessage(from, gambar, image, { quoted: nex })
                    })
                    break
                case 'chiisaihentai':
                case 'trap':
                case 'blowjob':
                case 'yaoi':
                case 'ecchi':
                case 'hentai':
                case 'ahegao':
                case 'hololewd':
                case 'sideoppai':
                case 'animefeets':
                case 'animebooty':
                case 'animethighss':
                case 'hentaiparadise':
                case 'animearmpits':
                case 'hentaifemdom':
                case 'lewdanimegirls':
                case 'biganimetiddies':
                case 'animebellybutton':
                case 'hentai4everyone':
                    await getBuffer(`https://api.lolhuman.xyz/api/random/nsfw/${command}?apikey=${apikey}`).then((gambar) => {
                        nexus.sendMessage(from, gambar, image, { quoted: nex })
                    })
                    break
                case 'bj':
                case 'ero':
                case 'cum':
                case 'feet':
                case 'yuri':
                case 'trap':
                case 'lewd':
                case 'feed':
                case 'eron':
                case 'solo':
                case 'gasm':
                case 'poke':
                case 'anal':
                case 'holo':
                case 'tits':
                case 'kuni':
                case 'kiss':
                case 'erok':
                case 'smug':
                case 'baka':
                case 'solog':
                case 'feetg':
                case 'lewdk':
                case 'waifu':
                case 'pussy':
                case 'femdom':
                case 'cuddle':
                case 'hentai':
                case 'eroyuri':
                case 'cum_jpg':
                case 'blowjob':
                case 'erofeet':
                case 'holoero':
                case 'classic':
                case 'erokemo':
                case 'fox_girl':
                case 'futanari':
                case 'lewdkemo':
                case 'wallpaper':
                case 'pussy_jpg':
                case 'kemonomimi':
                case 'nsfw_avatar':
                    getBuffer(`https://api.lolhuman.xyz/api/random2/${command}?apikey=${apikey}`).then((gambar) => {
                        nexus.sendMessage(from, gambar, image, { quoted: nex })
                    })
                    break

                // Textprome //
                case 'blackpink':
                case 'neon':
                case 'greenneon':
                case 'futureneon':
                case 'sandwriting':
                case 'sandsummer':
                case 'sandengraved':
                case 'metaldark':
                case 'neonlight':
                case 'holographic':
                case 'text1917':
                case 'minion':
                case 'deluxesilver':
                case 'newyearcard':
                case 'bloodfrosted':
                case 'halloween':
                case 'jokerlogo':
                case 'fireworksparkle':
                case 'natureleaves':
                case 'bokeh':
                case 'toxic':
                case 'strawberry':
                case 'box3d':
                case 'roadwarning':
                case 'breakwall':
                case 'icecold':
                case 'luxury':
                case 'cloud':
                case 'summersand':
                case 'horrorblood':
                case 'thunder':
                case 'magma':
                case 'impressiveglitch':
                case 'harrypotter':
                case 'watercolor':
                case 'wonderfulgraffiti':

                    if (args.length == 0) return reply(`*Agrega el texto que deseas agregar a la imagen.*\n\n*Por ejemplo:     ${prefix + command} Nexus*`)
                    ini_txt = args.join(" ")
                    try {
                        get_textprome = await getBuffer2(`https://api.lolhuman.xyz/api/textprome/${command}?apikey=${apikey}&text=${ini_txt}`)
                        await nexus.sendMessage(from, get_textprome, image, { quoted: nex })
                        
                    } catch (e) {
                        reply(mess.error)
                    }

                break

                case 'pornhub':
                case 'glitch':
                case 'avenger':
                case 'space':
                case 'ninjalogo':
                case 'marvelstudio':
                case 'lionlogo':
                case 'wolflogo':
                case 'steel3d':
                case 'wallgravity':
                case 'coolgravity':

                    if (args.length == 0) return reply(`*Agrega el texto que deseas agregar a la imagen.*\n\n*Por ejemplo:     ${prefix + command} Nexus|Bot*`)
                    a = args.join(' ')
                    txt1 = a.substring(0, a.indexOf('|') - 0)
                    txt2 = a.substring(a.lastIndexOf('|') + 1)
                    if (!txt1) return reply(`*Falta el primer texto.*\n\n*Ejemplo:     ${prefix + command} Nexus|Bot*`)
                    if (!txt2) return reply(`*Falta el segundo texto.*\n\n*Ejemplo:     ${prefix + command} Nexus|Bot*`)
                    try {
                        get_textprome2 = await getBuffer2(`https://api.lolhuman.xyz/api/textprome2/${command}?apikey=${apikey}&text1=${txt1}&text2=${txt2}`)
                        nexus.sendMessage(from, get_textprome2, image, { quoted: nex })
                   
                    } catch (e) {
                        reply(mess.error)
                    }

                break

                // Photo Oxy //
                case 'shadow':
                case 'cup':
                case 'cup1':
                case 'romance':
                case 'smoke':
                case 'burnpaper':
                case 'lovemessage':
                case 'undergrass':
                case 'love':
                case 'coffe':
                case 'woodheart':
                case 'woodenboard':
                case 'summer3d':
                case 'wolfmetal':
                case 'nature3d':
                case 'underwater':
                case 'golderrose':
                case 'summernature':
                case 'fallleaves':
                case 'flamming': 
                case 'harrypotter':
                case 'carvedwood':
                case 'demo':

                    
                    if (args.length == 0) return reply(`*Agrega el texto que deseas agregar a la imagen.*\n\n*Por ejemplo:     ${prefix + command} Nexus*`)
                    ini_txt = args.join(" ")
               
                        get_photooxy = await getBuffer(`https://api.lolhuman.xyz/api/photooxy1/${command}?apikey=${apikey}&text=${ini_txt}`)
                        await nexus.sendMessage(from, get_photooxy, image, { quoted: nex }).catch(() => reply('error'))
                   
 
                break
                

                case 'tiktok':
                case 'arcade8bit':
                case 'battlefield4':
                case 'pubg':

                    if (args.length == 0) return reply(`*Agrega el texto que deseas agregar a la imagen.*\n\n*Por ejemplo:     ${prefix + command} Nexus|Bot*`)
                    a = args.join(' ')
                    txt1 = a.substring(0, a.indexOf('|') - 0)
                    txt2 = a.substring(a.lastIndexOf('|') + 1)
                    if (!txt1) return reply(`*Falta el primer texto.*\n\n*Ejemplo:     ${prefix + command} Nexus|Bot*`)
                    if (!txt2) return reply(`*Falta el segundo texto.*\n\n*Ejemplo:     ${prefix + command} Nexus|Bot*`)
                    try {
                        get_photooxy2 = await getBuffer2(`https://api.lolhuman.xyz/api/photooxy2/${command}?apikey=${apikey}&text1=${txt1}&text2=${txt2}`)
                        nexus.sendMessage(from, get_photooxy2, image, { quoted: nex })
                   
                    } catch (e) {
                        reply(mess.error)
                    }

                break

                // Ephoto 360 //
                case 'wetglass':
                case 'multicolor3d':
                case 'watercolor':
                case 'luxurygold':
                case 'galaxywallpaper':
                case 'lighttext':
                case 'beautifulflower':
                case 'puppycute':
                case 'royaltext':
                case 'heartshaped':
                case 'birthdaycake':
                case 'galaxystyle':
                case 'hologram3d':
                case 'greenneon':
                case 'glossychrome':
                case 'greenbush':
                case 'metallogo':
                case 'noeltext':
                case 'glittergold':
                case 'textcake':
                case 'starsnight':
                case 'wooden3d':
                case 'textbyname':
                case 'writegalacy':
                case 'galaxybat':
                case 'snow3d':
                case 'birthdayday':
                case 'goldplaybutton':
                case 'silverplaybutton':
                case 'freefire':
                case 'cartoongravity':
                case 'anonymhacker':
                case 'mlwall':
                case 'pubgmaskot':
                case 'aovwall':
                case 'logogaming':
                case 'fpslogo':
                case 'avatarlolnew':
                case 'lolbanner':
                case 'avatardota':

                    if (args.length == 0) return reply(`*Agrega el texto que deseas agregar a la imagen.*\n\n*Por ejemplo:     ${prefix + command} Nexus*`)
                    ini_txt = args.join(" ")
                    try {
                        get_ephoto360 = await getBuffer2(`https://api.lolhuman.xyz/api/ephoto1/${command}?apikey=${apikey}&text=${ini_txt}`)
                        await nexus.sendMessage(from, get_ephoto360, image, { quoted: nex })
                        
                    } catch (e) {
                        reply(mess.error)
                    }
                    
                break

                default:
                    if (isCmd) {
                        reply(`Lo siento, el comando *${prefix}${command}* no se encuentra en la programación.\n\nUtiliza el comando *${prefix}menu* para ver la lista de comandos.`)
                    }
                    if (!isGroup && !isCmd && !kuis) {
                        await nexus.updatePresence(from, Presence.composing)
                        simi = await fetchJson(`https://api.lolhuman.xyz/api/simi?apikey=${apikey}&text=${budy}`)
                        reply(simi.result)
                    }
            }
        } catch (e) {
            e = String(e)
            if (!e.includes("this.isZero")) {
                const time_error = moment.tz('America/Lima').format('HH:mm:ss')
                console.log(color(time_error, "white"), color("[  ERROR  ]", "aqua"), color(e, 'red'))
                
            }
        }
    })
}
starts()
