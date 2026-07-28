require('ts-node').register({ transpileOnly: true });
const { generateApplicationPacketHTML } = require('./src/lib/services/pdf/ApplicationPacketPDF');
async function test() {
    try {
        const html = await generateApplicationPacketHTML({});
        console.log('HTML size:', html.length);
    } catch (e) {
        console.error(e);
    }
}
test();
