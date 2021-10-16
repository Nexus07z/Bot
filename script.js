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
                welcome = `*${num.split('@')[0]}*, te doy la bienvenida al grupo *${group_info.subject}*.\n\nPara ver todos los comandos de *Nexusᴮᴼᵀ* escribe el siguiente comando:     *${prefix}menu*`
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
                    nexus.sendMessage(id, `*¡Hola!* \nMe han designado como *BOT* para este grupo.🤖\n\n*Por favor lee mis reglas:* \n${prefix}reglas\n\nPor favor síguelas o atente a las consecuencias. ⚠\n*Quedo a su disposición.*`, MessageType.text, {
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
				reply(`*Hola, estas son las reglas que debes seguir para que no tengas ningún problema con el Bot.*\n\n1- _Mantén una conducta respetuosa._\n\n2- _Evita abrir una conversación privada con el Bot._\n\n3- _❌ SPAM DE COMANDOS ❌_ \n*Esto es enserio, puedes hacer que el Bot se apague.*\n\n4- _📵 NO HAGAS LLAMADAS POR WHATSAPP AL BOT 📵_ \n*Serás bloqueado inmediatamente*\n\n5- _🕐 Espera el tiempo necesario cuando pidas alguna función, ya que algunas tardan en realizarse, no escribas el comando nuevamente hasta que el BOT te responda o te llegue un mensaje de error._\n\nPor favor cumple y respeta las reglas.`)
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
                    
                    if (args.length == 0) return reply(`*Agrega el tag/número y el nombre.*\n\n*Por ejemplo:\n${prefix + command} @(tag/número)|nombre*`)
                    argz = arg.split('|')
                    if (!argz[0]) return reply(`*Falta el tag/número.*\n\n*Ejemplo:\n${prefix + command} @(tag/número)|nombre*`)
                    if (!argz[1]) return reply(`*Falta el nombre.*\n\n*Ejemplo:\n${prefix + command} @(tag/número)|nombre*`)
                    
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
                    reply(`*Nexusᴮᴼᵀ* ya no estara disponible en este grupo.`)
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
                    reply('*Nexusᴮᴼᵀ esta desactivado*')
                    setTimeout(() => {
                        nexus.close()
                    }, 3000)

				break

                case 'actualizar':

                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    reply('*Nexusᴮᴼᵀ esta recibiendo nuevas actualizaciones.*')
                    exec(`bash update.sh`, (err, stdout) => {
                        if (err) return reply(mess.error)
                        if (stdout) reply(`*Nexusᴮᴼᵀ se actualizó correctamente.*\n\n*Informe de la actualización:*\n\n${stdout}\n\nLos cambios serán reflejados la próxima vez que inicie el bot.`)
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
                    var pc = budy.slice(6)
                    var nomor = pc.split("|")[0];
                    var org = pc.split("|")[1];
                    if (!nomor) return reply(`*Te falta agregar el número.*\n\n*Ejemplo:*\n\n*${prefix + command} 51963324153|Hola*`)
                    if (!org) return reply(`*Te falta agregar el mensaje.*\n\n*Ejemplo:*\n\n*${prefix + command} 51963324153|Hola*`)
                    nexus.sendMessage(nomor + '@s.whatsapp.net', org, MessageType.text)
                    reply(`*El mensaje:* ${org} *Se envio al número:* ${nomor}`)
				break

                case 'chatbot':
                    if (sender.split("@")[0] != owner) return reply(mess.only.ownerB)
                    if (args.length == 0) return reply(`*Te falta agregar el número y el nombre.*\n\n*Por ejemplo:*\n\n*${prefix + command} 51963324153|Katherine*`)
                    var pc = budy.slice(6)
                    var nomor = pc.split("|")[0];
                    var org = pc.split("|")[1];
                    if (!nomor) return reply(`*Te falta agregar el número.*\n\n*Ejemplo:*\n\n*${prefix + command} 51963324153|Katherine*`)
                    if (!org) return reply(`*Te falta agregar el nombre.*\n\n*Ejemplo:*\n\n*${prefix + command} 51963324153|Katherine*`)
                    //const chatbotmsg = "*¡Hola!*\n\nSoy *Nexusᴮᴼᵀ*, creado por *Smith* con el número *51963324153.*\n\nTengo una gran cantidad de comandos que pueden resultarte útiles.\n\nPor favor lee mis reglas:\n\n*${prefix}reglas*\n\nUtiliza el comando *${prefix}menu* para ver la lista de comandos."
                    nexus.sendMessage(nomor + '@s.whatsapp.net', org, MessageType.text)
                    reply(`*El mensaje ChatBot se envio al número:* ${nomor}`)
				break
                
                case '+18':

                    if (!isGroup) return reply(mess.only.group)
                    if (!isAdmin) return reply(mess.only.admin)
                    if (isNsfw && args.length < 1) return reply('*El contenido +18 está activo.*')
                    if (args.length < 1) return reply(`Escribe *[1]* para activar, *[0]* para desactivar.\n\n*Por ejemplo:     ${prefix + command} 1*`)
                    if (args[0] === '1') {
                        nsfw.push(from)
                        fs.writeFileSync('./database/nsfw.json', JSON.stringify(nsfw))
                        reply(`Contenido +18 *[ Activado ]*`)
                    } else if (args[0] === '0') {
                        var ini = nsfw.indexOf(from)
                        nsfw.splice(ini, 1)
                        fs.writeFileSync('./database/nsfw.json', JSON.stringify(nsfw))
                        reply(`Contenido +18 *[ Desactivado ]*`)
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
                
                case 'stickersinfondo':
                        
                        imgbb = require('imgbb-uploader')
                        if ((isMedia && !nex.message.videoMessage || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        const media = await nexus.downloadAndSaveMediaMessage(encmedia)
                        //reply(mess.wait)
                        nobg = await imgbb(apiimgbb, media);
                        link = `${nobg.display_url}`;
                
                        const attp1 = await getBuffer(`https://api.lolhuman.xyz/api/convert/towebp?apikey=${apikey}&img=https://nexus-store.site/api/removebg.php?remove=${link}`)
                        nexus.sendMessage(from, attp1, sticker, { quoted: nex })
                        
                        } else {
                            reply('*Por favor etiqueta una imagen con el comando.*')
                        }         
                break

                case 'afk':
                    alasan = args.join(" ")
                    afk[sender.split('@')[0]] = alasan.toLowerCase()
                    fs.writeFileSync("./database/afk.json", JSON.stringify(afk))
                    ini_txt = "Anda telah afk. "
                    if (alasan != "") {
                        ini_txt += "Dengan alasan " + alasan
                    }
                    reply(ini_txt)
                    break

                    // Islami //
                case 'listsurah':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/quran?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = 'List Surah:\n'
                    for (var x in get_result) {
                        ini_txt += `${x}. ${get_result[x]}\n`
                    }
                    reply(ini_txt)
                    break
                case 'alquran':
                    if (args.length < 1) return reply(`Example: ${prefix + command} 18 or ${prefix + command} 18/10 or ${prefix + command} 18/1-10`)
                    urls = `https://api.lolhuman.xyz/api/quran/${args[0]}?apikey=${apikey}`
                    quran = await fetchJson(urls)
                    result = quran.result
                    ayat = result.ayat
                    ini_txt = `QS. ${result.surah} : 1-${ayat.length}\n\n`
                    for (var x of ayat) {
                        arab = x.arab
                        nomor = x.ayat
                        latin = x.latin
                        indo = x.indonesia
                        ini_txt += `${arab}\n${nomor}. ${latin}\n${indo}\n\n`
                    }
                    ini_txt = ini_txt.replace(/<u>/g, "").replace(/<\/u>/g, "")
                    ini_txt = ini_txt.replace(/<strong>/g, "").replace(/<\/strong>/g, "")
                    ini_txt = ini_txt.replace(/<u>/g, "").replace(/<\/u>/g, "")
                    reply(ini_txt)
                    break
                case 'alquranaudio':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 18 or ${prefix + command} 18/10`)
                    surah = args[0]
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/quran/audio/${surah}?apikey=${apikey}`)
                    await nexus.sendMessage(from, ini_buffer, audio, { quoted: nex, mimetype: Mimetype.mp4Audio })
                    break
                case 'asmaulhusna':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/asmaulhusna?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `No : ${get_result.index}\n`
                    ini_txt += `Latin: ${get_result.latin}\n`
                    ini_txt += `Arab : ${get_result.ar}\n`
                    ini_txt += `Indonesia : ${get_result.id}\n`
                    ini_txt += `English : ${get_result.en}`
                    reply(ini_txt)
                    break
                case 'kisahnabi':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Muhammad`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/kisahnabi/${query}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Name : ${get_result.name}\n`
                    ini_txt += `Lahir : ${get_result.thn_kelahiran}\n`
                    ini_txt += `Umur : ${get_result.age}\n`
                    ini_txt += `Tempat : ${get_result.place}\n`
                    ini_txt += `Story : \n${get_result.story}`
                    reply(ini_txt)
                    break
                case 'jadwalsholat':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Yogyakarta`)
                    daerah = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/sholat/${daerah}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Wilayah : ${get_result.wilayah}\n`
                    ini_txt += `Tanggal : ${get_result.tanggal}\n`
                    ini_txt += `Sahur : ${get_result.sahur}\n`
                    ini_txt += `Imsak : ${get_result.imsak}\n`
                    ini_txt += `Subuh : ${get_result.subuh}\n`
                    ini_txt += `Terbit : ${get_result.terbit}\n`
                    ini_txt += `Dhuha : ${get_result.dhuha}\n`
                    ini_txt += `Dzuhur : ${get_result.dzuhur}\n`
                    ini_txt += `Ashar : ${get_result.ashar}\n`
                    ini_txt += `Maghrib : ${get_result.imsak}\n`
                    ini_txt += `Isya : ${get_result.isya}`
                    reply(ini_txt)
                    break

                    // Downloader //
                case 'ytplay':
                    if (args.length == 0) return await reply(`Example: ${prefix + command} melukis senja`)
                    await fetchJson(`https://api.lolhuman.xyz/api/ytsearch?apikey=${apikey}&query=${args.join(" ")}`)
                        .then(async(result) => {
                            await fetchJson(`https://api.lolhuman.xyz/api/ytaudio2?apikey=${apikey}&url=https://www.youtube.com/watch?v=${result.result[0].videoId}`)
                                .then(async(result) => {
                                    result = result.result
                                    caption = `❖ Title    : *${result.title}*\n`
                                    caption += `❖ Size     : *${result.size}*`
                                    ini_buffer = await getBuffer(result.thumbnail)
                                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: caption })
                                    get_audio = await getBuffer(result.link)
                                    await nexus.sendMessage(from, get_audio, audio, { mimetype: 'audio/mp4', filename: `${result.title}.mp3`, quoted: nex })
                                })
                        })
                    break
                case 'ytsearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Melukis Senja`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/ytsearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = ""
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Views : ${x.views}\n`
                        ini_txt += `Published : ${x.published}\n`
                        ini_txt += `Thumbnail : ${x.thumbnail}\n`
                        ini_txt += `Link : https://www.youtube.com/watch?v=${x.videoId}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'ytmp3':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://www.youtube.com/watch?v=qZIQAk-BUEc`)
                    ini_link = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/ytaudio2?apikey=${apikey}&url=${ini_link}`)
                    get_result = get_result.result
                    caption = `❖ Title    : *${result.title}*\n`
                    caption += `❖ Size     : *${result.size}*`
                    ini_buffer = await getBuffer(get_result.thumbnail)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: ini_txt })
                    get_audio = await getBuffer(get_result.link)
                    await nexus.sendMessage(from, get_audio, audio, { mimetype: 'audio/mp4', filename: `${get_result.title}.mp3`, quoted: nex })
                    break
                case 'ytmp4':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://www.youtube.com/watch?v=qZIQAk-BUEc`)
                    ini_link = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/ytvideo2?apikey=${apikey}&url=${ini_link}`)
                    get_result = get_result.result
                    ini_txt = `${get_result.title} - ${get_result.size}`
                    ini_buffer = await getBuffer(get_result.thumbnail)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: ini_txt })
                    get_audio = await getBuffer(get_result.link)
                    await nexus.sendMessage(from, get_audio, video, { mimetype: 'video/mp4', filename: `${get_result.title}.mp4`, quoted: nex })
                    break
                case 'telesticker':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://t.me/addstickers/LINE_Menhera_chan_ENG`)
                    ini_url = args[0]
                    ini_url = await fetchJson(`https://api.lolhuman.xyz/api/telestick?apikey=${apikey}&url=${ini_url}`)
                    ini_sticker = ini_url.result.sticker
                    for (sticker_ in ini_sticker) {
                        ini_buffer = await getBuffer(ini_sticker[sticker_])
                        await nexus.sendMessage(from, ini_buffer, sticker)
                    }
                    break
                case 'tiktoknowm':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://vt.tiktok.com/ZSwWCk5o/`)
                    ini_url = args[0]
                    ini_url = `https://api.lolhuman.xyz/api/tiktok?apikey=${apikey}&url=${ini_url}`
                    get_result = await fetchJson(ini_url)
                    ini_buffer = await getBuffer(get_result.result.link)
                    await nexus.sendMessage(from, ini_buffer, video, { quoted: nex })
                    break
                case 'tiktokmusic':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://vt.tiktok.com/ZSwWCk5o/`)
                    ini_link = args[0]
                    get_audio = await getBuffer(`https://api.lolhuman.xyz/api/tiktokmusic?apikey=${apikey}&url=${ini_link}`)
                    await nexus.sendMessage(from, get_audio, audio, { mimetype: Mimetype.mp4Audio, quoted: nex })
                    break
                case 'spotify':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://open.spotify.com/track/0ZEYRVISCaqz5yamWZWzaA`)
                    url = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/spotify?apikey=${apikey}&url=${url}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Artists : ${get_result.artists}\n`
                    ini_txt += `Duration : ${get_result.duration}\n`
                    ini_txt += `Popularity : ${get_result.popularity}\n`
                    ini_txt += `Preview : ${get_result.preview_url}\n`
                    thumbnail = await getBuffer(get_result.thumbnail)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    get_audio = await getBuffer(get_result.link)
                    await nexus.sendMessage(from, get_audio, audio, { mimetype: 'audio/mp4', filename: `${get_result.title}.mp3`, quoted: nex })
                    break
                case 'spotifysearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Melukis Senja`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/spotifysearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = ""
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Artists : ${x.artists}\n`
                        ini_txt += `Duration : ${x.duration}\n`
                        ini_txt += `Link : ${x.link}\n`
                        ini_txt += `Preview : ${x.preview_url}\n\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'jooxplay':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Melukis Senja`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/jooxplay?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.info.song}\n`
                    ini_txt += `Artists : ${get_result.info.singer}\n`
                    ini_txt += `Duration : ${get_result.info.duration}\n`
                    ini_txt += `Album : ${get_result.info.album}\n`
                    ini_txt += `Uploaded : ${get_result.info.date}\n`
                    ini_txt += `Lirik :\n ${get_result.lirik}\n`
                    thumbnail = await getBuffer(get_result.image)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    get_audio = await getBuffer(get_result.audio[0].link)
                    await nexus.sendMessage(from, get_audio, audio, { mimetype: 'audio/mp4', filename: `${get_result.info.song}.mp3`, quoted: nex })
                    break
                case 'igdl':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://www.instagram.com/p/CJ8XKFmJ4al/?igshid=1acpcqo44kgkn`)
                    ini_url = args[0]
                    ini_url = await fetchJson(`https://api.lolhuman.xyz/api/instagram?apikey=${apikey}&url=${ini_url}`)
                    ini_url = ini_url.result
                    ini_type = image
                    if (ini_url.includes(".mp4")) ini_type = video
                    ini_buffer = await getBuffer(ini_url)
                    await nexus.sendMessage(from, ini_buffer, ini_type, { quoted: nex })
                    break
                case 'igdl2':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://www.instagram.com/p/CJ8XKFmJ4al/?igshid=1acpcqo44kgkn`)
                    ini_url = args[0]
                    ini_url = await fetchJson(`https://api.lolhuman.xyz/api/instagram2?apikey=${apikey}&url=${ini_url}`)
                    ini_result = ini_url.result.media
                    for (var x of ini_result) {
                        ini_type = image
                        if (x.includes(".mp4")) ini_type = video
                        ini_buffer = await getBuffer(x)
                        await nexus.sendMessage(from, ini_buffer, ini_type, { quoted: nex })
                    }
                    break
                case 'twtdl':
                    if (args.length == 0) return reply(`Exampele: ${prefix + command} https://twitter.com/gofoodindonesia/status/1229369819511709697`)
                    ini_url = args[0]
                    ini_url = await fetchJson(`https://api.lolhuman.xyz/api/twitter?apikey=${apikey}&url=${ini_url}`)
                    ini_url = ini_url.result
                    ini_url = ini_url[ini_url.length - 1].link
                    ini_buffer = await getBuffer(ini_url)
                    await nexus.sendMessage(from, ini_buffer, video, { quoted: nex })
                    break
                case 'fbdl':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://id-id.facebook.com/SamsungGulf/videos/video-bokeh/561108457758458/`)
                    ini_url = args[0]
                    ini_url = await fetchJson(`https://api.lolhuman.xyz/api/facebook?apikey=${apikey}&url=${ini_url}`)
                    ini_url = ini_url.result[0].link
                    ini_buffer = await getBuffer(ini_url)
                    await nexus.sendMessage(from, ini_buffer, video, { quoted: nex })
                    break
                case 'zippyshare':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://www51.zippyshare.com/v/5W0TOBz1/file.html`)
                    ini_url = args[0]
                    ini_url = await fetchJson(`https://api.lolhuman.xyz/api/zippyshare?apikey=${apikey}&url=${ini_url}`)
                    ini_url = ini_url.result
                    ini_txt = `File Name : ${ini_url.name_file}\n`
                    ini_txt += `Size : ${ini_url.size}\n`
                    ini_txt += `Date Upload : ${ini_url.date_upload}\n`
                    ini_txt += `Download Url : ${ini_url.download_url}`
                    reply(ini_txt)
                    break
                case 'pinterest':
                    if (args.length == 0) return reply(`Example: ${prefix + command} loli kawaii`)
                    query = args.join(" ")
                    ini_url = await fetchJson(`https://api.lolhuman.xyz/api/pinterest?apikey=${apikey}&query=${query}`)
                    ini_url = ini_url.result
                    ini_buffer = await getBuffer(ini_url)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'pinterest2':
                    if (args.length == 0) return reply(`Example: ${prefix + command} loli kawaii`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/pinterest2?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    for (var x = 0; x <= 5; x++) {
                        var ini_buffer = await getBuffer(get_result[x])
                        await nexus.sendMessage(from, ini_buffer, image)
                    }
                    break
                case 'pinterestdl':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://id.pinterest.com/pin/696580267364426905/`)
                    ini_url = args[0]
                    ini_url = await fetchJson(`https://api.lolhuman.xyz/api/pinterestdl?apikey=${apikey}&url=${ini_url}`)
                    ini_url = ini_url.result[0]
                    ini_buffer = await getBuffer(ini_url)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'pixiv':
                    if (args.length == 0) return reply(`Example: ${prefix + command} loli kawaii`)
                    query = args.join(" ")
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/pixiv?apikey=${apikey}&query=${query}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'pixivdl':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 63456028`)
                    query = args[0]
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/pixivdl/${pixivid}?apikey=${apikey}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'xhamstersearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Japanese`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/xhamstersearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = ""
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Views : ${x.views}\n`
                        ini_txt += `Duration : ${x.duration}\n`
                        ini_txt += `Link : ${x.link}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'xhamster':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://xhamster.com/videos/party-with-friends-end-in-awesome-fucking-5798407`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/xhamster?apikey=${apikey}&url=${query}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Duration : ${get_result.duration}\n`
                    ini_txt += `Uploader : ${get_result.author}\n`
                    ini_txt += `Upload : ${get_result.upload}\n`
                    ini_txt += `View : ${get_result.views}\n`
                    ini_txt += `Rating : ${get_result.rating}\n`
                    ini_txt += `Like : ${get_result.likes}\n`
                    ini_txt += `Dislike : ${get_result.dislikes}\n`
                    ini_txt += `Comment : ${get_result.comments}\n`
                    ini_txt += "Link : \n"
                    link = get_result.link
                    for (var x of link) {
                        ini_txt += `${x.type} - ${x.link}\n\n`
                    }
                    thumbnail = await getBuffer(get_result.thumbnail)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    break
                case 'xnxxsearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Japanese`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/xnxxsearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = ""
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Views : ${x.views}\n`
                        ini_txt += `Duration : ${x.duration}\n`
                        ini_txt += `Uploader : ${x.uploader}\n`
                        ini_txt += `Link : ${x.link}\n`
                        ini_txt += `Thumbnail : ${x.thumbnail}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'xnxx':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://www.xnxx.com/video-uy5a73b/mom_is_horny_-_brooklyn`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/xnxx?apikey=${apikey}&url=${query}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Duration : ${get_result.duration}\n`
                    ini_txt += `View : ${get_result.view}\n`
                    ini_txt += `Rating : ${get_result.rating}\n`
                    ini_txt += `Like : ${get_result.like}\n`
                    ini_txt += `Dislike : ${get_result.dislike}\n`
                    ini_txt += `Comment : ${get_result.comment}\n`
                    ini_txt += `Tag : ${get_result.tag.join(", ")}\n`
                    ini_txt += `Description : ${get_result.description}\n`
                    ini_txt += "Link : \n"
                    ini_link = get_result.link
                    for (var x of ini_link) {
                        ini_txt += `${x.type} - ${x.link}\n\n`
                    }
                    thumbnail = await getBuffer(get_result.thumbnail)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    break

                    // AniManga //
                case 'character':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Miku Nakano`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/character?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = `Id : ${get_result.id}\n`
                    ini_txt += `Name : ${get_result.name.full}\n`
                    ini_txt += `Native : ${get_result.name.native}\n`
                    ini_txt += `Favorites : ${get_result.favourites}\n`
                    ini_txt += `Media : \n`
                    ini_media = get_result.media.nodes
                    for (var x of ini_media) {
                        ini_txt += `- ${x.title.romaji} (${x.title.native})\n`
                    }
                    ini_txt += `\nDescription : \n${get_result.description.replace(/__/g, "_")}`
                    thumbnail = await getBuffer(get_result.image.large)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    break
                case 'manga':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Gotoubun No Hanayome`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/manga?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = `Id : ${get_result.id}\n`
                    ini_txt += `Id MAL : ${get_result.idMal}\n`
                    ini_txt += `Title : ${get_result.title.romaji}\n`
                    ini_txt += `English : ${get_result.title.english}\n`
                    ini_txt += `Native : ${get_result.title.native}\n`
                    ini_txt += `Format : ${get_result.format}\n`
                    ini_txt += `Chapters : ${get_result.chapters}\n`
                    ini_txt += `Volume : ${get_result.volumes}\n`
                    ini_txt += `Status : ${get_result.status}\n`
                    ini_txt += `Source : ${get_result.source}\n`
                    ini_txt += `Start Date : ${get_result.startDate.day} - ${get_result.startDate.month} - ${get_result.startDate.year}\n`
                    ini_txt += `End Date : ${get_result.endDate.day} - ${get_result.endDate.month} - ${get_result.endDate.year}\n`
                    ini_txt += `Genre : ${get_result.genres.join(", ")}\n`
                    ini_txt += `Synonyms : ${get_result.synonyms.join(", ")}\n`
                    ini_txt += `Score : ${get_result.averageScore}%\n`
                    ini_txt += `Characters : \n`
                    ini_character = get_result.characters.nodes
                    for (var x of ini_character) {
                        ini_txt += `- ${x.name.full} (${x.name.native})\n`
                    }
                    ini_txt += `\nDescription : ${get_result.description}`
                    thumbnail = await getBuffer(get_result.coverImage.large)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    break
                case 'anime':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Gotoubun No Hanayome`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/anime?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = `Id : ${get_result.id}\n`
                    ini_txt += `Id MAL : ${get_result.idMal}\n`
                    ini_txt += `Title : ${get_result.title.romaji}\n`
                    ini_txt += `English : ${get_result.title.english}\n`
                    ini_txt += `Native : ${get_result.title.native}\n`
                    ini_txt += `Format : ${get_result.format}\n`
                    ini_txt += `Episodes : ${get_result.episodes}\n`
                    ini_txt += `Duration : ${get_result.duration} mins.\n`
                    ini_txt += `Status : ${get_result.status}\n`
                    ini_txt += `Season : ${get_result.season}\n`
                    ini_txt += `Season Year : ${get_result.seasonYear}\n`
                    ini_txt += `Source : ${get_result.source}\n`
                    ini_txt += `Start Date : ${get_result.startDate.day} - ${get_result.startDate.month} - ${get_result.startDate.year}\n`
                    ini_txt += `End Date : ${get_result.endDate.day} - ${get_result.endDate.month} - ${get_result.endDate.year}\n`
                    ini_txt += `Genre : ${get_result.genres.join(", ")}\n`
                    ini_txt += `Synonyms : ${get_result.synonyms.join(", ")}\n`
                    ini_txt += `Score : ${get_result.averageScore}%\n`
                    ini_txt += `Characters : \n`
                    ini_character = get_result.characters.nodes
                    for (var x of ini_character) {
                        ini_txt += `- ${x.name.full} (${x.name.native})\n`
                    }
                    ini_txt += `\nDescription : ${get_result.description}`
                    thumbnail = await getBuffer(get_result.coverImage.large)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    break
                case 'wait':
                    if ((isMedia && !nex.message.videoMessage || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        const filePath = await nexus.downloadAndSaveMediaMessage(encmedia, filename = getRandom());
                        const form = new FormData();
                        const stats = fs.statSync(filePath);
                        const fileSizeInBytes = stats.size;
                        const fileStream = fs.createReadStream(filePath);
                        form.append('img', fileStream, { knownLength: fileSizeInBytes });
                        const options = {
                            method: 'POST',
                            credentials: 'include',
                            body: form
                        }
                        get_result = await fetchJson(`https://api.lolhuman.xyz/api/wait?apikey=${apikey}`, {...options })
                        fs.unlinkSync(filePath)
                        get_result = get_result.result
                        ini_video = await getBuffer(get_result.video)
                        ini_txt = `Anilist id : ${get_result.anilist_id}\n`
                        ini_txt += `MAL id : ${get_result.mal_id}\n`
                        ini_txt += `Title Romaji : ${get_result.title_romaji}\n`
                        ini_txt += `Title Native : ${get_result.title_native}\n`
                        ini_txt += `Title English : ${get_result.title_english}\n`
                        ini_txt += `at : ${get_result.at}\n`
                        ini_txt += `Episode : ${get_result.episode}\n`
                        ini_txt += `Similarity : ${get_result.similarity}`
                        await nexus.sendMessage(from, ini_video, video, { quoted: nex, caption: ini_txt })
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix + command} atau tag gambar yang sudah dikirim`)
                    }
                    break
                case 'kusonime':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://kusonime.com/nanatsu-no-taizai-bd-batch-subtitle-indonesia/`)
                    ini_url = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/kusonime?apikey=${apikey}&url=${ini_url}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Japanese : ${get_result.japanese}\n`
                    ini_txt += `Genre : ${get_result.genre}\n`
                    ini_txt += `Seasons : ${get_result.seasons}\n`
                    ini_txt += `Producers : ${get_result.producers}\n`
                    ini_txt += `Type : ${get_result.type}\n`
                    ini_txt += `Status : ${get_result.status}\n`
                    ini_txt += `Total Episode : ${get_result.total_episode}\n`
                    ini_txt += `Score : ${get_result.score}\n`
                    ini_txt += `Duration : ${get_result.duration}\n`
                    ini_txt += `Released On : ${get_result.released_on}\n`
                    ini_txt += `Desc : ${get_result.desc}\n`
                    link_dl = get_result.link_dl
                    for (var x in link_dl) {
                        ini_txt += `\n${x}\n`
                        for (var y in link_dl[x]) {
                            ini_txt += `${y} - ${link_dl[x][y]}\n`
                        }
                    }
                    ini_buffer = await getBuffer(get_result.thumbnail)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: ini_txt })
                    break
                case 'kusonimesearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Gotoubun No Hanayome`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/kusonimesearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Japanese : ${get_result.japanese}\n`
                    ini_txt += `Genre : ${get_result.genre}\n`
                    ini_txt += `Seasons : ${get_result.seasons}\n`
                    ini_txt += `Producers : ${get_result.producers}\n`
                    ini_txt += `Type : ${get_result.type}\n`
                    ini_txt += `Status : ${get_result.status}\n`
                    ini_txt += `Total Episode : ${get_result.total_episode}\n`
                    ini_txt += `Score : ${get_result.score}\n`
                    ini_txt += `Duration : ${get_result.duration}\n`
                    ini_txt += `Released On : ${get_result.released_on}\n`
                    ini_txt += `Desc : ${get_result.desc}\n`
                    link_dl = get_result.link_dl
                    for (var x in link_dl) {
                        ini_txt += `\n${x}\n`
                        for (var y in link_dl[x]) {
                            ini_txt += `${y} - ${link_dl[x][y]}\n`
                        }
                    }
                    ini_buffer = await getBuffer(get_result.thumbnail)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: ini_txt })
                    break
                case 'otakudesu':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://otakudesu.tv/lengkap/pslcns-sub-indo/`)
                    ini_url = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/otakudesu?apikey=${apikey}&url=${ini_url}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Japanese : ${get_result.japanese}\n`
                    ini_txt += `Judul : ${get_result.judul}\n`
                    ini_txt += `Type : ${get_result.type}\n`
                    ini_txt += `Episode : ${get_result.episodes}\n`
                    ini_txt += `Aired : ${get_result.aired}\n`
                    ini_txt += `Producers : ${get_result.producers}\n`
                    ini_txt += `Genre : ${get_result.genres}\n`
                    ini_txt += `Duration : ${get_result.duration}\n`
                    ini_txt += `Studios : ${get_result.status}\n`
                    ini_txt += `Rating : ${get_result.rating}\n`
                    ini_txt += `Credit : ${get_result.credit}\n`
                    get_link = get_result.link_dl
                    for (var x in get_link) {
                        ini_txt += `\n\n*${get_link[x].title}*\n`
                        for (var y in get_link[x].link_dl) {
                            ini_info = get_link[x].link_dl[y]
                            ini_txt += `\n\`\`\`Reso : \`\`\`${ini_info.reso}\n`
                            ini_txt += `\`\`\`Size : \`\`\`${ini_info.size}\n`
                            ini_txt += `\`\`\`Link : \`\`\`\n`
                            down_link = ini_info.link_dl
                            for (var z in down_link) {
                                ini_txt += `${z} - ${down_link[z]}\n`
                            }
                        }
                    }
                    reply(ini_txt)
                    break
                case 'otakudesusearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Gotoubun No Hanayome`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/otakudesusearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Japanese : ${get_result.japanese}\n`
                    ini_txt += `Judul : ${get_result.judul}\n`
                    ini_txt += `Type : ${get_result.type}\n`
                    ini_txt += `Episode : ${get_result.episodes}\n`
                    ini_txt += `Aired : ${get_result.aired}\n`
                    ini_txt += `Producers : ${get_result.producers}\n`
                    ini_txt += `Genre : ${get_result.genres}\n`
                    ini_txt += `Duration : ${get_result.duration}\n`
                    ini_txt += `Studios : ${get_result.status}\n`
                    ini_txt += `Rating : ${get_result.rating}\n`
                    ini_txt += `Credit : ${get_result.credit}\n`
                    get_link = get_result.link_dl
                    for (var x in get_link) {
                        ini_txt += `\n\n*${get_link[x].title}*\n`
                        for (var y in get_link[x].link_dl) {
                            ini_info = get_link[x].link_dl[y]
                            ini_txt += `\n\`\`\`Reso : \`\`\`${ini_info.reso}\n`
                            ini_txt += `\`\`\`Size : \`\`\`${ini_info.size}\n`
                            ini_txt += `\`\`\`Link : \`\`\`\n`
                            down_link = ini_info.link_dl
                            for (var z in down_link) {
                                ini_txt += `${z} - ${down_link[z]}\n`
                            }
                        }
                    }
                    reply(ini_txt)
                    break
                case 'nhentai':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 344253`)
                    henid = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/nhentai/${henid}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Title Romaji : ${get_result.title_romaji}\n`
                    ini_txt += `Title Native : ${get_result.title_native}\n`
                    ini_txt += `Read Online : ${get_result.read}\n`
                    get_info = get_result.info
                    ini_txt += `Parodies : ${get_info.parodies}\n`
                    ini_txt += `Character : ${get_info.characters.join(", ")}\n`
                    ini_txt += `Tags : ${get_info.tags.join(", ")}\n`
                    ini_txt += `Artist : ${get_info.artists}\n`
                    ini_txt += `Group : ${get_info.groups}\n`
                    ini_txt += `Languager : ${get_info.languages.join(", ")}\n`
                    ini_txt += `Categories : ${get_info.categories}\n`
                    ini_txt += `Pages : ${get_info.pages}\n`
                    ini_txt += `Uploaded : ${get_info.uploaded}\n`
                    reply(ini_txt)
                    break
                case 'nhentaipdf':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 344253`)
                    henid = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/nhentaipdf/${henid}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_buffer = await getBuffer(get_result)
                    await nexus.sendMessage(from, ini_buffer, document, { quoted: nex, mimetype: Mimetype.pdf, filename: `${henid}.pdf` })
                    break
                case 'nhentaisearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Gotoubun No Hanayome`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/nhentaisearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = "Result : \n"
                    for (var x of get_result) {
                        ini_txt += `Id : ${x.id}\n`
                        ini_txt += `Title English : ${x.title_english}\n`
                        ini_txt += `Title Japanese : ${x.title_japanese}\n`
                        ini_txt += `Native : ${x.title_native}\n`
                        ini_txt += `Upload : ${x.date_upload}\n`
                        ini_txt += `Page : ${x.page}\n`
                        ini_txt += `Favourite : ${x.favourite}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'nekopoi':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://nekopoi.care/isekai-harem-monogatari-episode-4-subtitle-indonesia/`)
                    ini_url = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/nekopoi?apikey=${apikey}&url=${ini_url}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.anime}\n`
                    ini_txt += `Porducers : ${get_result.producers}\n`
                    ini_txt += `Duration : ${get_result.duration}\n`
                    ini_txt += `Size : ${get_result.size}\n`
                    ini_txt += `Sinopsis : ${get_result.sinopsis}\n`
                    link = get_result.link
                    for (var x in link) {
                        ini_txt += `\n${link[x].name}\n`
                        link_dl = link[x].link
                        for (var y in link_dl) {
                            ini_txt += `${y} - ${link_dl[y]}\n`
                        }
                    }
                    ini_buffer = await getBuffer(get_result.thumb)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: ini_txt })
                    break
                case 'nekopoisearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Isekai Harem`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/nekopoisearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = ""
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Link : ${x.link}\n`
                        ini_txt += `Thumbnail : ${x.thumbnail}\n\n`
                    }
                    reply(ini_txt)
                    break

                    // Information //
                case 'kbbi':
                    if (args.length == 0) return reply(`Example: ${prefix + command} kursi`)
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/kbbi?apikey=${apikey}&query=${args.join(" ")}`)
                    lila = get_result.result
                    ini_txt = `\`\`\`Kata : ${lila[0].nama}\`\`\`\n`
                    ini_txt += `\`\`\`Kata Dasar : ${lila[0].kata_dasar}\`\`\`\n`
                    ini_txt += `\`\`\`Pelafalan : ${lila[0].pelafalan}\`\`\`\n`
                    ini_txt += `\`\`\`Bentuk Tidak Baku : ${lila[0].bentuk_tidak_baku}\`\`\`\n\n`
                    for (var x of lila) {
                        ini_txt += `\`\`\`Kode : ${x.makna[0].kelas[0].kode}\`\`\`\n`
                        ini_txt += `\`\`\`Kelas : ${x.makna[0].kelas[0].nama}\`\`\`\n`
                        ini_txt += `\`\`\`Artinya : \n${x.makna[0].kelas[0].deskripsi}\`\`\`\n\n`
                        ini_txt += `\`\`\`Makna Lain : \n${x.makna[0].submakna}\`\`\`\n `
                        ini_txt += `\`\`\`Contoh Kalimat : \n${x.makna[0].contoh}\`\`\`\n`
                    }
                    reply(ini_txt)
                    break
                case 'brainly2':
                    if (args.length == 0) return reply(`Example: ${prefix + command} siapakah sukarno`)
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/brainly2?apikey=${apikey}&query=${args.join(" ")}`)
                    lala = get_result.result
                    ini_txt = "Beberapa Pembahasan Dari Brainly :\n\n"
                    for (var x of lala) {
                        ini_txt += `==============================\n`
                        ini_txt += `\`\`\`Pertanyaan :\`\`\`\n${x.question.content}\n\n`
                        ini_txt += `\`\`\`Jawaban :\`\`\`\n${x.answer[0].content}\n`
                        ini_txt += `==============================\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'jarak':
                    if (args.length == 0) return reply(`Example: ${prefix + command} jakarta - yogyakarta`)
                    pauls = args.join(" ")
                    teks1 = pauls.split("-")[0].trim()
                    teks2 = pauls.split("-")[1].trim()
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/jaraktempuh?apikey=${apikey}&kota1=${teks1}&kota2=${teks2}`)
                    x = get_result.result
                    ini_txt = `Informasi Jarak dari ${teks1} ke ${teks2} :\n\n`
                    ini_txt += `\`\`\`◪ Asal :\`\`\` ${x.from.name}\n`
                    ini_txt += `\`\`\`◪ Garis Lintang :\`\`\` ${x.from.latitude}\n`
                    ini_txt += `\`\`\`◪ Garis Bujur :\`\`\` ${x.from.longitude}\n\n`
                    ini_txt += `\`\`\`◪ Tujuan :\`\`\` ${x.to.name}\n`
                    ini_txt += `\`\`\`◪ Garis Lintang :\`\`\` ${x.to.latitude}\n`
                    ini_txt += `\`\`\`◪ Garis Bujur :\`\`\` ${x.to.longitude}\n\n`
                    ini_txt += `\`\`\`◪ Jarak Tempuh :\`\`\` ${x.jarak}\n`
                    ini_txt += `\`\`\`◪ Waktu Tempuh :\`\`\`\n`
                    ini_txt += `   ╭───────────────❏\n`
                    ini_txt += `❍┤ Kereta Api : ${x.kereta_api}\n`
                    ini_txt += `❍┤ Pesawat : ${x.pesawat}\n`
                    ini_txt += `❍┤ Mobil : ${x.mobil}\n`
                    ini_txt += `❍┤ Motor : ${x.motor}\n`
                    ini_txt += `❍┤ Jalan Kaki : ${x.jalan_kaki}\n`
                    ini_txt += `   ╰───────────────❏\n`
                    reply(ini_txt)
                    break
                case 'urbandictionary':
                    urb = args.join(" ")
                    get_result = await fetchJson(`http://lolhuman.herokuapp.com/api/urdict?apikey=${apikey}&query=${urb}`)
                    lilu = get_result.result
                    for (var x of lilu) {
                        ini_txt = `\`\`\`Meaning :\n${x.definition}\`\`\`\n\n`
                        ini_txt += `\`\`\`Link : ${x.permalink}\`\`\`\n\n`
                        ini_txt += `\`\`\`Sounds Url : ${x.sound_urls[0]}\`\`\`\n\n`
                        ini_txt += `\`\`\`Like : ${x.thumbs_up}\`\`\`\n\n`
                        ini_txt += `\`\`\`Dislike : ${x.thumbs_down}\`\`\`\n\n`
                        ini_txt += `\`\`\`Created On : \n${x.written_on}\`\`\`\n\n`
                        ini_txt += `\`\`\`Author : ${x.author}\`\`\`\n\n`
                        ini_txt += `\`\`\`Word : ${x.word}\`\`\`\n\n`
                        ini_txt += `\`\`\`Defined Id : ${x.defid}\`\`\`\n\n`
                        ini_txt += `\`\`\`Example : ${x.example}\`\`\`\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'chord':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Melukis senja`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/chord?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Chord : \n${get_result.chord}`
                    reply(ini_txt)
                    break
                case 'heroml':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Fanny`)
                    hero = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/heroml/${hero}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Name : ${get_result.hero_name}\n`
                    ini_txt += `Entrance Quotes : ${get_result.ent_quotes}\n`
                    ini_txt += `Role : ${get_result.detail.role}\n`
                    ini_txt += `Specialty : ${get_result.detail.specialty}\n`
                    ini_txt += `Laning : ${get_result.detail.laning_recommendation}\n`
                    ini_txt += `Release : ${get_result.detail.release_date}\n`
                    ini_txt += `Movement speed : ${get_result.attr.movement_speed}\n`
                    ini_txt += `Physical attack : ${get_result.attr.physical_attack}\n`
                    ini_txt += `Magic power : ${get_result.attr.magic_power}\n`
                    ini_txt += `Physical defense : ${get_result.attr.physical_defense}\n`
                    ini_txt += `Magic defense : ${get_result.attr.magic_defense}\n`
                    ini_txt += `Critical rate : ${get_result.attr.basic_atk_crit_rate}\n`
                    ini_txt += `Hp : ${get_result.attr.hp}\n`
                    ini_txt += `Mana : ${get_result.attr.mana}\n`
                    ini_txt += `Mana regen : ${get_result.attr.mana_regen}\n`
                    ini_icon = await getBuffer(get_result.icon)
                    await nexus.sendMessage(from, ini_icon, image, { quoted: nex, caption: ini_txt })
                    break
                case 'mlstalk':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 84830127/2169`)
                    ml_id = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/mobilelegend/${ml_id}?apikey=${apikey}`)
                    reply(get_result.result)
                    break
                case 'genshin':
                    if (args.length == 0) return reply(`Example: ${prefix + command} jean`)
                    hero = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/genshin/${hero}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Name : ${get_result.title}\n`
                    ini_txt += `Intro : ${get_result.intro}\n`
                    ini_txt += `Icon : ${get_result.icon}\n`
                    ini_icon = await getBuffer(get_result.cover1)
                    await nexus.sendMessage(from, ini_icon, image, { quoted: nex, caption: ini_txt })
                    ini_voice = await getBuffer(get_result.cv[0].audio[0])
                    await nexus.sendMessage(from, ini_voice, audio, { quoted: nex, mimetype: Mimetype.mp4Audio })
                    break
                case 'qrreader':
                    if ((isMedia && !nex.message.videoMessage || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        const filePath = await nexus.downloadAndSaveMediaMessage(encmedia, filename = getRandom());
                        const form = new FormData();
                        const stats = fs.statSync(filePath);
                        const fileSizeInBytes = stats.size;
                        const fileStream = fs.createReadStream(filePath);
                        form.append('img', fileStream, { knownLength: fileSizeInBytes });
                        const options = {
                            method: 'POST',
                            credentials: 'include',
                            body: form
                        }
                        get_result = await fetchJson(`https://api.lolhuman.xyz/api/read-qr?apikey=${apikey}`, {...options })
                        fs.unlinkSync(filePath)
                        reply("Result: " + get_result.result)
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix + command} atau tag gambar yang sudah dikirim`)
                    }
                    break
                case 'wikipedia':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Tahu`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/wiki?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    reply(get_result)
                    break
                case 'translate':
                    if (args.length == 0) return reply(`Example: ${prefix + command} en Tahu Bacem`)
                    kode_negara = args[0]
                    args.shift()
                    ini_txt = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/translate/auto/${kode_negara}?apikey=${apikey}&text=${ini_txt}`)
                    get_result = get_result.result
                    init_txt = `From : ${get_result.from}\n`
                    init_txt += `To : ${get_result.to}\n`
                    init_txt += `Original : ${get_result.original}\n`
                    init_txt += `Translated : ${get_result.translated}\n`
                    init_txt += `Pronunciation : ${get_result.pronunciation}\n`
                    reply(init_txt)
                    break
                case 'brainly':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Soekarno adalah`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/brainly?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = "Result : \n"
                    for (var x of get_result) {
                        ini_txt += `${x.title}\n`
                        ini_txt += `${x.url}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'jadwaltv':
                    if (args.length == 0) return reply(`Example: ${prefix + command} RCTI`)
                    channel = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/jadwaltv/${channel}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Jadwal TV ${channel.toUpperCase()}\n`
                    for (var x in get_result) {
                        ini_txt += `${x} - ${get_result[x]}\n`
                    }
                    reply(ini_txt)
                    break
                case 'jadwaltvnow':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/jadwaltv/now?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Jadwal TV Now :\n`
                    for (var x in get_result) {
                        ini_txt += `${x.toUpperCase()}${get_result[x]}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'newsinfo':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/newsinfo?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = "Result :\n"
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Author : ${x.author}\n`
                        ini_txt += `Source : ${x.source.name}\n`
                        ini_txt += `Url : ${x.url}\n`
                        ini_txt += `Published : ${x.publishedAt}\n`
                        ini_txt += `Description : ${x.description}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'cnnindonesia':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/cnnindonesia?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = "Result :\n"
                    for (var x of get_result) {
                        ini_txt += `Judul : ${x.judul}\n`
                        ini_txt += `Link : ${x.link}\n`
                        ini_txt += `Tipe : ${x.tipe}\n`
                        ini_txt += `Published : ${x.waktu}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'cnnnasional':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/cnnindonesia/nasional?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = "Result :\n"
                    for (var x of get_result) {
                        ini_txt += `Judul : ${x.judul}\n`
                        ini_txt += `Link : ${x.link}\n`
                        ini_txt += `Tipe : ${x.tipe}\n`
                        ini_txt += `Published : ${x.waktu}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'cnninternasional':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/cnnindonesia/internasional?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = "Result :\n"
                    for (var x of get_result) {
                        ini_txt += `Judul : ${x.judul}\n`
                        ini_txt += `Link : ${x.link}\n`
                        ini_txt += `Tipe : ${x.tipe}\n`
                        ini_txt += `Published : ${x.waktu}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'infogempa':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/infogempa?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Lokasi : ${get_result.lokasi}\n`
                    ini_txt += `Waktu : ${get_result.waktu}\n`
                    ini_txt += `Potensi : ${get_result.potensi}\n`
                    ini_txt += `Magnitude : ${get_result.magnitude}\n`
                    ini_txt += `Kedalaman : ${get_result.kedalaman}\n`
                    ini_txt += `Koordinat : ${get_result.koordinat}`
                    get_buffer = await getBuffer(get_result.map)
                    await nexus.sendMessage(from, get_buffer, image, { quoted: nex, caption: ini_txt })
                    break
                case 'lirik':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Melukis Senja`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/lirik?apikey=${apikey}&query=${query}`)
                    reply(get_result.result)
                    break
                case 'cuaca':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Yogyakarta`)
                    daerah = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/cuaca/${daerah}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Tempat : ${get_result.tempat}\n`
                    ini_txt += `Cuaca : ${get_result.cuaca}\n`
                    ini_txt += `Angin : ${get_result.angin}\n`
                    ini_txt += `Description : ${get_result.description}\n`
                    ini_txt += `Kelembapan : ${get_result.kelembapan}\n`
                    ini_txt += `Suhu : ${get_result.suhu}\n`
                    ini_txt += `Udara : ${get_result.udara}\n`
                    ini_txt += `Permukaan laut : ${get_result.permukaan_laut}\n`
                    await nexus.sendMessage(from, { degreesLatitude: get_result.latitude, degreesLongitude: get_result.longitude }, location, { quoted: nex })
                    reply(ini_txt)
                    break
                case 'covidindo':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/corona/indonesia?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Positif : ${get_result.positif}\n`
                    ini_txt += `Sembuh : ${get_result.sembuh}\n`
                    ini_txt += `Dirawat : ${get_result.dirawat}\n`
                    ini_txt += `Meninggal : ${get_result.meninggal}`
                    reply(ini_txt)
                    break
                case 'covidglobal':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/corona/global?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Positif : ${get_result.positif}\n`
                    ini_txt += `Sembuh : ${get_result.sembuh}\n`
                    ini_txt += `Dirawat : ${get_result.dirawat}\n`
                    ini_txt += `Meninggal : ${get_result.meninggal}`
                    reply(ini_txt)
                    break
                case 'kodepos':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Slemanan or ${prefix + command} 66154`)
                    daerah = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/kodepos?apikey=${apikey}&query=${daerah}`)
                    get_result = get_result.result[0]
                    ini_txt = `Provinsi : ${get_result.province}\n`
                    ini_txt += `Kabupaten : ${get_result.city}\n`
                    ini_txt += `Kecamatan : ${get_result.subdistrict}\n`
                    ini_txt += `Kelurahan : ${get_result.urban}\n`
                    ini_txt += `Kode Pos : ${get_result.postalcode}`
                    reply(ini_txt)
                    break
                case 'jadwalbola':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/jadwalbola?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = "Jadwal Bola :\n"
                    for (var x of get_result) {
                        ini_txt += `Hari : ${x.hari}\n`
                        ini_txt += `Jam : ${x.jam}\n`
                        ini_txt += `Event : ${x.event}\n`
                        ini_txt += `Match : ${x.match}\n`
                        ini_txt += `TV : ${x.tv}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'indbeasiswa':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/indbeasiswa?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = 'Info Beasiswa :\n'
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Link : ${x.link}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'hoax':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/turnbackhoax?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = 'Info Hoax :\n'
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Link : ${x.link}\n`
                        ini_txt += `Posted : ${x.posted}\n`
                        ini_txt += `Description : ${x.desc}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'nsfwcheck':
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
                        get_result = await fetchJson(`https://api.lolhuman.xyz/api/nsfwcheck?apikey=${apikey}`, {...options })
                        fs.unlinkSync(filePath)
                        get_result = get_result.result
                        is_nsfw = "No"
                        if (Number(get_result.replace("%", "")) >= 50) is_nsfw = "Yes"
                        reply(`Is NSFW? ${is_nsfw}\nNSFW Score : ${get_result}`)
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix + command} atau tag gambar yang sudah dikirim`)
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

                    // Movie & Story
                case 'lk21':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Transformer`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/lk21?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Link : ${get_result.link}\n`
                    ini_txt += `Genre : ${get_result.genre}\n`
                    ini_txt += `Views : ${get_result.views}\n`
                    ini_txt += `Duration : ${get_result.duration}\n`
                    ini_txt += `Tahun : ${get_result.tahun}\n`
                    ini_txt += `Rating : ${get_result.rating}\n`
                    ini_txt += `Desc : ${get_result.desc}\n`
                    ini_txt += `Actors : ${get_result.actors.join(", ")}\n`
                    ini_txt += `Location : ${get_result.location}\n`
                    ini_txt += `Date Release : ${get_result.date_release}\n`
                    ini_txt += `Language : ${get_result.language}\n`
                    ini_txt += `Link Download : ${get_result.link_dl}`
                    thumbnail = await getBuffer(get_result.thumbnail)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    break
                case 'drakorongoing':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/drakorongoing?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = "Ongoing Drakor\n\n"
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Link : ${x.link}\n`
                        ini_txt += `Thumbnail : ${x.thumbnail}\n`
                        ini_txt += `Year : ${x.category}\n`
                        ini_txt += `Total Episode : ${x.total_episode}\n`
                        ini_txt += `Genre : ${x.genre.join(", ")}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'wattpad':
                    if (args.length == 0) return reply(`Example: ${prefix + command} https://www.wattpad.com/707367860-kumpulan-quote-tere-liye-tere-liye-quote-quote`)
                    ini_url = args[0]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/wattpad?apikey=${apikey}&url=${ini_url}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Rating : ${get_result.rating}\n`
                    ini_txt += `Motify date : ${get_result.modifyDate}\n`
                    ini_txt += `Create date: ${get_result.createDate}\n`
                    ini_txt += `Word : ${get_result.word}\n`
                    ini_txt += `Comment : ${get_result.comment}\n`
                    ini_txt += `Vote : ${get_result.vote}\n`
                    ini_txt += `Reader : ${get_result.reader}\n`
                    ini_txt += `Pages : ${get_result.pages}\n`
                    ini_txt += `Description : ${get_result.desc}\n\n`
                    ini_txt += `Story : \n${get_result.story}`
                    thumbnail = await getBuffer(get_result.photo)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    break
                case 'wattpadsearch':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Tere Liye`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/wattpadsearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = "Wattpad Seach : \n"
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Url : ${x.url}\n`
                        ini_txt += `Part : ${x.parts}\n`
                        ini_txt += `Motify date : ${x.modifyDate}\n`
                        ini_txt += `Create date: ${x.createDate}\n`
                        ini_txt += `Coment count: ${x.commentCount}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'cerpen':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/cerpen?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Creator : ${get_result.creator}\n`
                    ini_txt += `Story :\n${get_result.cerpen}`
                    reply(ini_txt)
                    break
                case 'ceritahoror':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/ceritahoror?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Title : ${get_result.title}\n`
                    ini_txt += `Desc : ${get_result.desc}\n`
                    ini_txt += `Story :\n${get_result.story}\n`
                    thumbnail = await getBuffer(get_result.thumbnail)
                    await nexus.sendMessage(from, thumbnail, image, { quoted: nex, caption: ini_txt })
                    break

                    // Random Text //
                case 'quotes':
                    quotes = await fetchJson(`https://api.lolhuman.xyz/api/random/quotes?apikey=${apikey}`)
                    quotes = quotes.result
                    author = quotes.by
                    quotes = quotes.quote
                    reply(`_${quotes}_\n\n*― ${author}*`)
                    break
                case 'quotesanime':
                    quotes = await fetchJson(`https://api.lolhuman.xyz/api/random/quotesnime?apikey=${apikey}`)
                    quotes = quotes.result
                    quote = quotes.quote
                    char = quotes.character
                    anime = quotes.anime
                    episode = quotes.episode
                    reply(`_${quote}_\n\n*― ${char}*\n*― ${anime} ${episode}*`)
                    break
                case 'quotesdilan':
                    quotedilan = await fetchJson(`https://api.lolhuman.xyz/api/quotes/dilan?apikey=${apikey}`)
                    reply(quotedilan.result)
                    break
                case 'quotesimage':
                    get_result = await getBuffer(`https://api.lolhuman.xyz/api/random/${command}?apikey=${apikey}`)
                    await nexus.sendMessage(from, get_result, image, { quotes: nex })
                    break
                case 'faktaunik':
                case 'katabijak':
                case 'pantun':
                case 'bucin':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/random/${command}?apikey=${apikey}`)
                    reply(get_result.result)
                    break
                case 'randomnama':
                    anu = await fetchJson(`https://api.lolhuman.xyz/api/random/nama?apikey=${apikey}`)
                    reply(anu.result)
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
                case 'konachan':
                    if (args.length == 0) return reply(`Example: ${prefix + command} azur_lane`)
                    query = args.join(" ")
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/konachan?apikey=${apikey}&query=${query}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
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
                case 'playstore':
                    if (args.length == 0) return reply(`Example: ${prefix + command} telegram`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/playstore?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = 'Play Store Search : \n'
                    for (var x of get_result) {
                        ini_txt += `Name : ${x.title}\n`
                        ini_txt += `ID : ${x.appId}\n`
                        ini_txt += `Developer : ${x.developer}\n`
                        ini_txt += `Link : ${x.url}\n`
                        ini_txt += `Price : ${x.priceText}\n`
                        ini_txt += `Price : ${x.price}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'shopee':
                    if (args.length == 0) return reply(`Example: ${prefix + command} tas gendong`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/shopee?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = 'Shopee Search : \n'
                    for (var x of get_result) {
                        ini_txt += `Name : ${x.name}\n`
                        ini_txt += `Terjual : ${x.sold}\n`
                        ini_txt += `Stock : ${x.stock}\n`
                        ini_txt += `Lokasi : ${x.shop_loc}\n`
                        ini_txt += `Link : ${x.link_produk}\n\n`
                    }
                    reply(ini_txt)
                    break
                case 'google':
                    if (args.length == 0) return reply(`Example: ${prefix + command} loli kawaii`)
                    query = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/gsearch?apikey=${apikey}&query=${query}`)
                    get_result = get_result.result
                    ini_txt = 'Google Search : \n'
                    for (var x of get_result) {
                        ini_txt += `Title : ${x.title}\n`
                        ini_txt += `Link : ${x.link}\n`
                        ini_txt += `Desc : ${x.desc}\n\n`
                    }
                    reply(ini_txt)
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

                    // Primbon
                case 'artinama':
                    if (args.length == 0) return reply(`Example: ${prefix + command} LoL Human`)
                    ini_nama = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/artinama?apikey=${apikey}&nama=${ini_nama}`)
                    reply(get_result.result)
                    break
                case 'jodoh':
                    if (args.length == 0) return reply(`Example: ${prefix + command} Tahu & Bacem`)
                    ini_nama = args.join(" ").split("&")
                    nama1 = ini_nama[0].trim()
                    nama2 = ini_nama[1].trim()
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/jodoh/${nama1}/${nama2}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Positif : ${get_result.positif}\n`
                    ini_txt += `Negative : ${get_result.negatif}\n`
                    ini_txt += `Deskripsi : ${get_result.deskripsi}`
                    reply(ini_txt)
                    break
                case 'weton':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 12 12 2020`)
                    tanggal = args[0]
                    bulan = args[1]
                    tahun = args[2]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/weton/${tanggal}/${bulan}/${tahun}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Weton : ${get_result.weton}\n`
                    ini_txt += `Pekerjaan : ${get_result.pekerjaan}\n`
                    ini_txt += `Rejeki : ${get_result.rejeki}\n`
                    ini_txt += `Jodoh : ${get_result.jodoh}`
                    reply(ini_txt)
                    break
                case 'jadian':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 12 12 2020`)
                    tanggal = args[0]
                    bulan = args[1]
                    tahun = args[2]
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/jadian/${tanggal}/${bulan}/${tahun}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Karakteristik : ${get_result.karakteristik}\n`
                    ini_txt += `Deskripsi : ${get_result.deskripsi}`
                    reply(ini_txt)
                    break
                case 'tebakumur':
                    if (args.length == 0) return reply(`Example: ${prefix + command} LoL Human`)
                    ini_name = args.join(" ")
                    if (args.length == 0) return reply(`Example: ${prefix + command} LoL Human`)
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/tebakumur?apikey=SoftApikey&name=${ini_name}`)
                    get_result = get_result.result
                    ini_txt = `Nama : ${get_result.name}\n`
                    ini_txt += `Umur : ${get_result.age}`
                    reply(ini_txt)
                    break

                    // Entertainment
                case 'asupan':
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/asupan?apikey=${apikey}`)
                    ini_buffer = await getBuffer(get_result.result)
                    await nexus.sendMessage(from, ini_buffer, video, { quoted: nex, mimetype: Mimetype.mp4, filename: "asupan.mp4" })
                    break
                case 'wancak':
                    ini_buffer = await getBuffer(`https://api.lolhuman.xyz/api/onecak?apikey=${apikey}`)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex })
                    break
                case 'sambungkata':
                    if (sambungkata.hasOwnProperty(sender.split('@')[0])) return reply("Selesein yg sebelumnya dulu atuh")
                    if (args.length == 0) return reply(`Example: ${prefix + command} tahu`)
                    ini_txt = args.join(" ")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/sambungkata?apikey=${apikey}&text=${ini_txt}`)
                    get_result = get_result.result
                    await nexus.sendMessage(from, get_result, text, { quoted: nex }).then(() => {
                        sambungkata[sender.split('@')[0]] = get_result.toLowerCase()
                        fs.writeFileSync("./database/sambungkata.json", JSON.stringify(sambungkata))
                    })
                    break
                case 'cancelsambungkata':
                    if (!sambungkata.hasOwnProperty(sender.split('@')[0])) return reply("Anda tidak memiliki tebak gambar sebelumnya")
                    delete sambungkata[sender.split('@')[0]]
                    fs.writeFileSync("./database/sambungkata.json", JSON.stringify(sambungkata))
                    reply("Success mengcancel sambung kata sebelumnya")
                    break
                case 'tebakgambar': // case by piyo-chan
                    if (tebakgambar.hasOwnProperty(sender.split('@')[0])) return reply("Selesein yg sebelumnya dulu atuh")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/tebak/gambar?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_image = get_result.image
                    jawaban = get_result.answer
                    ini_buffer = await getBuffer(ini_image)
                    await nexus.sendMessage(from, ini_buffer, image, { quoted: nex, caption: "Jawab gk? Jawab lahhh, masa enggak. 30 detik cukup kan? gk cukup pulang aja" }).then(() => {
                        tebakgambar[sender.split('@')[0]] = jawaban.toLowerCase()
                        fs.writeFileSync("./database/tebakgambar.json", JSON.stringify(tebakgambar))
                    })
                    await sleep(30000)
                    if (tebakgambar.hasOwnProperty(sender.split('@')[0])) {
                        reply("Jawaban: " + jawaban)
                        delete tebakgambar[sender.split('@')[0]]
                        fs.writeFileSync("./database/tebakgambar.json", JSON.stringify(tebakgambar))
                    }
                    break
                case 'canceltebakgambar':
                    if (!tebakgambar.hasOwnProperty(sender.split('@')[0])) return reply("Anda tidak memiliki tebak gambar sebelumnya")
                    delete tebakgambar[sender.split('@')[0]]
                    fs.writeFileSync("./database/tebakgambar.json", JSON.stringify(tebakgambar))
                    reply("Success mengcancel tebak gambar sebelumnya")
                    break

                case 'akinator': // Premium / VIP apikey only
                    if (akinator.hasOwnProperty(sender.split('@')[0])) return reply("Selesein yg sebelumnya dulu atuh")
                    get_result = await fetchJson(`https://api.lolhuman.xyz/api/akinator/start?apikey=${apikey}`)
                    var { server, frontaddr, session, signature, question, step } = get_result.result
                    const data = {}
                    data["server"] = server
                    data["frontaddr"] = frontaddr
                    data["session"] = session
                    data["signature"] = signature
                    data["question"] = question
                    data["step"] = step
                    ini_txt = `${question}\n\n`
                    ini_txt += "0 - Ya\n"
                    ini_txt += "1 - Tidak\n"
                    ini_txt += "2 - Saya Tidak Tau\n"
                    ini_txt += "3 - Mungkin\n"
                    ini_txt += "4 - Mungkin Tidak"
                    await nexus.sendMessage(from, ini_txt, text, { quoted: nex }).then(() => {
                        akinator[sender.split('@')[0]] = data
                        fs.writeFileSync("./database/akinator.json", JSON.stringify(akinator))
                    })
                    break
                case 'cancelakinator':
                    if (!akinator.hasOwnProperty(sender.split('@')[0])) return reply("Anda tidak memiliki akinator sebelumnya")
                    delete akinator[sender.split('@')[0]]
                    fs.writeFileSync("./database/akinator.json", JSON.stringify(akinator))
                    reply("Success mengcancel akinator sebelumnya")
                    break


                    // Creator
                case 'quotemaker3':
                    if ((isMedia && !nex.message.videoMessage || isQuotedImage)) {
                        if (args.length == 0) return reply(`Example: ${prefix + command} LoL|Human`)
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        filePath = await nexus.downloadAndSaveMediaMessage(encmedia, filename = getRandom());
                        file_name = getRandom(".webp")
                        ini_txt = args.join(" ")
                        request({
                            url: `https://api.lolhuman.xyz/api/quotemaker3?apikey=${apikey}`,
                            method: 'POST',
                            formData: {
                                "img": fs.createReadStream(filePath),
                                "text": ini_txt
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
                        reply(`Kirim gambar dengan caption ${prefix + command} atau tag gambar yang sudah dikirim`)
                    }
                    break
                case 'stickerwm':
                    if ((isQuotedImage)) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        var image_buffer = await nexus.downloadMediaMessage(encmedia);
                        var formdata = new FormData()
                        formdata.append('package', 'LoL')
                        formdata.append('author', 'Human')
                        formdata.append('img', image_buffer, { filename: 'tahu.jpg' })
                        axios.post(`https://api.lolhuman.xyz/api/convert/towebpauthor?apikey=${apikey}`, formdata.getBuffer(), { headers: { "content-type": `multipart/form-data; boundary=${formdata._boundary}` }, responseType: 'arraybuffer' }).then((res) => {
                            nexus.sendMessage(from, res.data, sticker)
                        })
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix + command} atau tag gambar yang sudah dikirim`)
                    }
                    break
                case 'sticker':
                    if ((isQuotedVideo || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage || isQuotedVideo ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        var filepath = await nexus.downloadAndSaveMediaMessage(encmedia, getRandom())
                        var randomName = getRandom('.webp')
                        ffmpeg(`./${filepath}`)
                            .input(filepath)
                            .on('error', () => {
                                fs.unlinkSync(filepath)
                                reply('Terjadi kesalahan saat mengconvert sticker.')
                            })
                            .on('end', () => {
                                nexus.sendMessage(from, fs.readFileSync(randomName), sticker, { quoted: nex })
                                fs.unlinkSync(filepath)
                                fs.unlinkSync(randomName)
                            })
                            .addOutputOptions([`-vcodec`, `libwebp`, `-vf`, `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`])
                            .toFormat('webp')
                            .save(randomName)
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix}sticker atau tag gambar yang sudah dikirim`)
                    }
                    break
                case 'roundsticker':
                    if ((isMedia && !nex.message.videoMessage || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        filePath = await nexus.downloadAndSaveMediaMessage(encmedia)
                        file_name = getRandom('.webp')
                        request({
                            url: `https://api.lolhuman.xyz/api/convert/towebpwround?apikey=${apikey}`,
                            method: 'POST',
                            formData: {
                                "img": fs.createReadStream(filePath)
                            },
                            encoding: "binary"
                        }, function(error, response, body) {
                            fs.unlinkSync(filePath)
                            fs.writeFileSync(file_name, body, "binary")
                            ini_buff = fs.readFileSync(file_name)
                            nexus.sendMessage(from, ini_buff, sticker, { quoted: nex }).then(() => {
                                fs.unlinkSync(file_name)
                            })
                        });
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix}sticker atau tag gambar yang sudah dikirim`)
                    }
                    break
                case 'stickernobg':
                    if ((isMedia && !nex.message.videoMessage || isQuotedImage) && args.length == 0) {
                        const encmedia = isQuotedImage ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        filePath = await nexus.downloadAndSaveMediaMessage(encmedia)
                        file_name = getRandom('.png')
                        file_name2 = getRandom('.webp')
                        request({
                            url: `https://api.lolhuman.xyz/api/removebg?apikey=${apikey}`,
                            method: 'POST',
                            formData: {
                                "img": fs.createReadStream(filePath)
                            },
                            encoding: "binary"
                        }, function(error, response, body) {
                            fs.unlinkSync(filePath)
                            fs.writeFileSync(file_name, body, "binary")
                            ffmpeg(`./${file_name}`)
                                .input(file_name)
                                .on('error', function(err) {
                                    console.log(err)
                                    fs.unlinkSync(file_name)
                                })
                                .on('end', function() {
                                    nexus.sendMessage(from, fs.readFileSync(file_name2), sticker, { quoted: nex })
                                    fs.unlinkSync(file_name2)
                                })
                                .addOutputOptions([`-vcodec`, `libwebp`, `-vf`, `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`])
                                .toFormat('webp')
                                .save(file_name2)
                        });
                    } else {
                        reply(`Kirim gambar dengan caption ${prefix}sticker atau tag gambar yang sudah dikirim`)
                    }
                    break
                case 'takestick':
                    if ((isMedia && !nex.message.videoMessage || isQuotedSticker)) {
                        if (args.length == 0) return reply(`Example: ${prefix + command} LoL|Human`)
                        const encmedia = isQuotedSticker ? JSON.parse(JSON.stringify(nex).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : nex
                        filePath = await nexus.downloadAndSaveMediaMessage(encmedia, filename = getRandom());
                        file_name = getRandom(".webp")
                        ini_txt = args.join(" ").split("|")
                        request({
                            url: `https://api.lolhuman.xyz/api/convert/towebpauthor?apikey=${apikey}`,
                            method: 'POST',
                            formData: {
                                "img": fs.createReadStream(filePath),
                                "package": ini_txt[0],
                                "author": ini_txt[1]
                            },
                            encoding: "binary"
                        }, function(error, response, body) {
                            fs.unlinkSync(filePath)
                            fs.writeFileSync(file_name, body, "binary")
                            ini_buff = fs.readFileSync(file_name)
                            nexus.sendMessage(from, ini_buff, sticker, { quoted: nex }).then(() => {
                                fs.unlinkSync(file_name)
                            })
                        });
                    } else {
                        reply(`Tag sticker yang sudah dikirim`)
                    }
                    break
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

                    // Stalk
                case 'stalkig':
                    if (args.length == 0) return reply(`Example: ${prefix + command} jessnolimit`)
                    username = args[0]
                    ini_result = await fetchJson(`https://api.lolhuman.xyz/api/stalkig/${username}?apikey=${apikey}`)
                    ini_result = ini_result.result
                    ini_buffer = await getBuffer(ini_result.photo_profile)
                    ini_txt = `Username : ${ini_result.username}\n`
                    ini_txt += `Full Name : ${ini_result.fullname}\n`
                    ini_txt += `Posts : ${ini_result.posts}\n`
                    ini_txt += `Followers : ${ini_result.followers}\n`
                    ini_txt += `Following : ${ini_result.following}\n`
                    ini_txt += `Bio : ${ini_result.bio}`
                    nexus.sendMessage(from, ini_buffer, image, { caption: ini_txt })
                    break
                case 'stalkgithub':
                    if (args.length == 0) return reply(`Example: ${prefix + command} LoL-Human`)
                    username = args[0]
                    ini_result = await fetchJson(`https://api.lolhuman.xyz/api/github/${username}?apikey=${apikey}`)
                    ini_result = ini_result.result
                    ini_buffer = await getBuffer(ini_result.avatar)
                    ini_txt = `Name : ${ini_result.name}\n`
                    ini_txt += `Link : ${ini_result.url}\n`
                    ini_txt += `Public Repo : ${ini_result.public_repos}\n`
                    ini_txt += `Public Gists : ${ini_result.public_gists}\n`
                    ini_txt += `Followers : ${ini_result.followers}\n`
                    ini_txt += `Following : ${ini_result.following}\n`
                    ini_txt += `Bio : ${ini_result.bio}`
                    nexus.sendMessage(from, ini_buffer, image, { caption: ini_txt })
                    break
                case 'stalktwitter':
                    if (args.length == 0) return reply(`Example: ${prefix + command} jokowi`)
                    username = args[0]
                    ini_result = await fetchJson(`https://api.lolhuman.xyz/api/twitter/${username}?apikey=${apikey}`)
                    ini_result = ini_result.result
                    ini_buffer = await getBuffer(ini_result.profile_picture)
                    ini_txt = `Username : ${ini_result.screen_name}\n`
                    ini_txt += `Name : ${ini_result.name}\n`
                    ini_txt += `Tweet : ${ini_result.tweet}\n`
                    ini_txt += `Joined : ${ini_result.joined}\n`
                    ini_txt += `Followers : ${ini_result.followers}\n`
                    ini_txt += `Following : ${ini_result.following}\n`
                    ini_txt += `Like : ${ini_result.like}\n`
                    ini_txt += `Description : ${ini_result.description}`
                    nexus.sendMessage(from, ini_buffer, image, { caption: ini_txt })
                    break
                case 'stalktiktok':
                    if (args.length == 0) return reply(`Example: ${prefix + command} bulansutena`)
                    stalk_toktok = args[0]
                    get_result = await fetchJson(`http://lolhuman.herokuapp.com/api/stalktiktok/${stalk_toktok}?apikey=${apikey}`)
                    get_result = get_result.result
                    ini_txt = `Username : ${get_result.username}\n`
                    ini_txt += `Nickname : ${get_result.nickname}\n`
                    ini_txt += `Followers : ${get_result.followers}\n`
                    ini_txt += `Followings : ${get_result.followings}\n`
                    ini_txt += `Likes : ${get_result.likes}\n`
                    ini_txt += `Video : ${get_result.video}\n`
                    ini_txt += `Bio : ${get_result.bio}\n`
                    pp_tt = await getBuffer(get_result.user_picture)
                    nexus.sendMessage(from, pp_tt, image, { quoted: nex, caption: ini_txt })
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
                case 'spamsms':
                    if (args.length == 0) return reply(`Example: ${prefix + command} 08303030303030`)
                    nomor = args[0]
                    await fetchJson(`https://api.lolhuman.xyz/api/sms/spam1?apikey=${apikey}&nomor=${nomor}`)
                    await fetchJson(`https://api.lolhuman.xyz/api/sms/spam2?apikey=${apikey}&nomor=${nomor}`)
                    await fetchJson(`https://api.lolhuman.xyz/api/sms/spam3?apikey=${apikey}&nomor=${nomor}`)
                    await fetchJson(`https://api.lolhuman.xyz/api/sms/spam4?apikey=${apikey}&nomor=${nomor}`)
                    await fetchJson(`https://api.lolhuman.xyz/api/sms/spam5?apikey=${apikey}&nomor=${nomor}`)
                    await fetchJson(`https://api.lolhuman.xyz/api/sms/spam6?apikey=${apikey}&nomor=${nomor}`)
                    await fetchJson(`https://api.lolhuman.xyz/api/sms/spam7?apikey=${apikey}&nomor=${nomor}`)
                    await fetchJson(`https://api.lolhuman.xyz/api/sms/spam8?apikey=${apikey}&nomor=${nomor}`)
                    reply("Success")
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
                    
                    if (args.length == 0) return reply(`*Agrega el texto que deseas agregar a la imagen.*\n\n*Por ejemplo:     ${prefix + command} Nexus*`)
                    ini_txt = args.join(" ")
                    try {
                        get_photooxy = await getBuffer2(`https://api.lolhuman.xyz/api/photooxy1/${command}?apikey=${apikey}&text=${ini_txt}`)
                        await nexus.sendMessage(from, get_photooxy, image, { quoted: nex })
                        
                    } catch (e) {
                        reply(mess.error)
                    }
 
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
