const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const mime = require('mime');
const https = require('https');
const crypto = require('crypto');
const config = require('./config.json');
const fs = require('fs');


const token = config.token;
const bot = new TelegramBot(token, {polling: true});

const randomValueBase64 = function(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')
        .slice(0, len)
        .replace(/\+/g, '0')
        .replace(/\//g, '0');
};


const serveFile = function(fileId, mimetype, callback) {
    const filesPath = '/var/www/files'
    const randomString = randomValueBase64(8);
    const filePath = path.join(filesPath, randomString + '.' + mime.getExtension(mimetype));
    bot.getFileLink(fileId)
    .then(function(link) {
        https.get(link)
        .on('response', function(res) {
            if (res.statusCode != 200) {
                console.log(
                    'Could not save file: ( ' + 'Status code: ' + res.statusCode + ' )'
                );
                return callback('Could not save file.');
            }

            res.pipe(fs.createWriteStream(filePath))
            .on('error', function(e) {
                console.log(
                    'Could not save file: ( ' + e.toString() + ' )'
                );
                return callback('Could not save file.');
            }).on('finish', function() {
            //    exports.convertMedia(filePath, config)
            //    .then(function(filePath) {
                    callback(
                        "https://files.varal7.fr" + '/' + path.basename(filePath)
                    );
            //    });
            });
        })
        .on('error', function(e) {
            console.log(
                'Could not save file: ( ' + e.toString() + ' )'
            );
            return callback('Could not save file.');
        });
    });
};

const parseMsg = function(msg) {
    const chatId = msg.chat.id;
    console.log(msg);
    if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        const url = serveFile(
            photo.file_id,
            mime.getType(path.extname(photo.file_id)) || 'image/png',
            function(msg) {
                bot.sendMessage(chatId, msg);
            }
        );
    }
}


bot.on('message', (msg) => {
    try {
        parseMsg(msg);
    } catch (error) {
        console.log(error);
    }
});
