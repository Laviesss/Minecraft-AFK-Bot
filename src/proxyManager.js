const fs = require('fs').promises;
const { SocksClient } = require('socks');
const { Agent } = require('proxy-agent');

let validProxies = [];
let currentProxyIndex = 0;

/**
 * Reads proxies from proxies.txt, expecting format HOST:PORT or USER:PASS@HOST:PORT
 * @returns {Promise<string[]>} An array of proxy strings.
 */
async function loadProxies() {
    try {
        const data = await fs.readFile('proxies.txt', 'utf8');
        return data.split(/\r?\n/).filter(line => line.trim() !== '');
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile('proxies.txt', ''); // Create the file if it doesn't exist
            return [];
        }
        console.error('Error reading proxies.txt:', error);
        return [];
    }
}

/**
 * Writes an array of proxies back to proxies.txt, overwriting the file.
 * @param {string[]} proxies - The array of proxy strings to write.
 */
async function writeProxies(proxies) {
    try {
        await fs.writeFile('proxies.txt', proxies.join('\n'));
    } catch (error) {
        console.error('Error writing to proxies.txt:', error);
    }
}

/**
 * Validates a list of proxies by attempting a connection to the Mojang auth server.
 * @param {string[]} proxies - An array of proxy strings.
 * @returns {Promise<string[]>} A promise that resolves to an array of valid proxy strings.
 */
async function validateProxies(proxies) {
    console.log(`Validating ${proxies.length} proxies...`);
    const validationPromises = proxies.map(async (proxy) => {
        try {
            const [auth, hostPort] = proxy.includes('@') ? proxy.split('@') : [null, proxy];
            const [username, password] = auth ? auth.split(':') : [null, null];
            const [host, port] = hostPort.split(':');

            // Mineflayer uses SOCKS proxies for the actual game connection
            await SocksClient.createConnection({
                proxy: {
                    host: host,
                    port: parseInt(port, 10),
                    type: 5, // SOCKSv5
                    userId: username,
                    password: password,
                },
                command: 'connect',
                destination: {
                    host: 'authserver.mojang.com', // A reliable host to test against
                    port: 443,
                },
            });
            console.log(`✅ Proxy ${hostPort} is valid.`);
            return proxy;
        } catch (error) {
            console.log(`❌ Proxy ${proxy} is invalid: ${error.message}`);
            return null;
        }
    });

    const results = await Promise.all(validationPromises);
    const workingProxies = results.filter(Boolean);
    console.log(`Validation complete. ${workingProxies.length}/${proxies.length} proxies are working.`);
    return workingProxies;
}

/**
 * Initializes the proxy manager with a list of valid proxies.
 * @param {string[]} proxies - The array of validated proxies.
 */
function setValidProxies(proxies) {
    validProxies = proxies;
    currentProxyIndex = 0;
}

/**
 * Gets the next proxy from the list, cycling back to the start if needed.
 * @returns {object|null} A proxy agent object for Mineflayer or null if no proxies are available.
 */
function getNextProxy() {
    if (validProxies.length === 0) {
        return null;
    }

    const proxyString = validProxies[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % validProxies.length; // Cycle through proxies

    // The proxy needs to be wrapped in an agent for mineflayer
    // The format required is socks://user:pass@host:port
    const proxyUrl = `socks://${proxyString}`;

    console.log(`Using proxy: ${proxyString}`);
    return new Agent({ getProxyForUrl: () => proxyUrl });
}

module.exports = {
    loadProxies,
    writeProxies,
    validateProxies,
    setValidProxies,
    getNextProxy,
};
