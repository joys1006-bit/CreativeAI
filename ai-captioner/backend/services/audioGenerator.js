const googleTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Downloads audio for a given text.
 * @param {string} text 
 * @param {string} outputPath 
 * @returns {Promise<string>} Path to the saved audio file
 */
async function generateAudioInfo(text, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const url = googleTTS.getAudioUrl(text, {
                lang: 'ko',
                slow: false,
                host: 'https://translate.google.com',
            });

            const file = fs.createWriteStream(outputPath);
            https.get(url, function (response) {
                response.pipe(file);
                file.on('finish', function () {
                    file.close(() => resolve(outputPath));
                });
            }).on('error', function (err) {
                fs.unlink(outputPath, () => { }); // Delete the file async. (But we don't check result)
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generateAudioInfo };
