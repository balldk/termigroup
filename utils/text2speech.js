const request = require('request')
const fs = require('fs')

const langCode = require('../data/lang-code')

module.exports = async (text, lang, callback, callbackErr) => {
    if (!langCode[lang]) return typeof(callbackErr) === 'function' ? callbackErr() : false
    let url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`
    let filename = `data/say_${Date.now()}_${Math.floor(Math.random()*100)}.mp3`
    request({ uri: url })
    .pipe(fs.createWriteStream(filename))
    .on('close', async () => {
        await callback(filename)
        setTimeout(() => {
            fs.unlink(filename, err => { if(err) console.log(err) })
        }, 30000)
    });
}