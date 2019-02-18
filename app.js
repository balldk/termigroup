const login = require('facebook-chat-api')
const fs = require('fs')

const devConfig = require('./dev-config')
const cmdHandler = require('./utils/cmdHandler')
const text2speech = require('./utils/text2speech')

require('./api')
let credentials = { email: devConfig.username, password: devConfig.password }
if (fs.existsSync('data/appState.json')) {
    credentials.appState = JSON.parse(fs.readFileSync('data/appState.json', 'utf8'))
}
login(credentials, (err, bot) => {
    if (err) return console.error(err)
    fs.writeFileSync('data/appState.json', JSON.stringify(bot.getAppState(), null, 4))
	bot.setOptions({ selfListen: false, logLevel: 'silent' })

    // Read saved data
    let fileData = fs.readFileSync('data/data.json', 'utf8')
    const data = JSON.parse(fileData) || {}

	bot.listen((err, msg) => {
        if (err) return console.error(err)
        // console.log(msg)
        // Check if msg is from ABC
        if (msg.threadID === '2373506719340307' && msg.type === 'message') {
            let { body, senderID, threadID, messageID, attachments, mentions, timestamp, isGroup } = msg
            let cmd = cmdHandler(body)
            if (cmd) {
                let command = cmd.cmd
                // Store Handler
                if (command === 'store') {
                    let key = cmd.params.key
                    if (!key || key === true) bot.sendMessage('Missing --key "value"', threadID)
                    // GET data
                    else if (!cmd.value) {
                        if (data[key]) bot.sendMessage(`=====Data=====\n${data[key].value}`, threadID)
                        else bot.sendMessage(`Key "${key}" does not exist yet, please assign them`, threadID)
                    // SET data
                    } else if (cmd.value) {
                        data[key] = { value: cmd.value, id: senderID }
                        fs.writeFile('data/data.json', JSON.stringify(data, null, 4), err => {
                            bot.sendMessage('saved!', threadID)
                            console.log('Updated data!')
                        })
                    }
                // Convert message to voice
                } else if (command === 'say') {
                    let lang = cmd.params.lang ? cmd.params.lang : 'vi'
                    if (!cmd.value) return bot.sendMessage('Missing value', threadID)
                    text2speech(cmd.value, lang, filename => {
                        let message = {
                            body: '',
                            attachment: fs.createReadStream(filename)
                        }
                        bot.sendMessage(message, threadID)
                    }, () => bot.sendMessage(`Language code "${lang}" is not exist`, threadID))
                // Kick user
                } 
                else if (command === 'add') {
                    bot.addUserToGroup(cmd.value, threadID, err => 
                        bot.sendMessage(`User's id is not correct`, threadID))
                } else if (command === 'kick') {
                    let mentionList = ''
                    let kickList = Object.entries(mentions).map(each => {
                        mentionList += each[1]
                        return each[0]
                    })
                    if (mentionList.replace(/\s/gm, '') === cmd.value.replace(/\s/gm, '')) {
                        return kickList.forEach(eachID => bot.removeUserFromGroup(eachID, threadID))
                    }
                    bot.getThreadInfo(threadID, (err, info) => {
                        let senderIsAdmin = info.adminIDs.some(each => each.id === senderID)
                        let kickerIsAdmin = info.adminIDs.some(each => each.id === cmd.value)
                        if (!senderIsAdmin && kickerIsAdmin)
                            return bot.sendMessage(`You don't have permission to perform this action`, threadID)
                        if (!info.participantIDs.includes(cmd.value))
                            bot.sendMessage(`You cannot kick a person who is not in group`, threadID)
                        else bot.removeUserFromGroup(cmd.value, threadID)
                    })
                }
                else bot.sendMessage(`Command "${command}" not found`, threadID)
            }
        }
	})
})