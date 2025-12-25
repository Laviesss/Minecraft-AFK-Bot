const fs = require('fs').promises;
const { Agent } = require('proxy-agent');

let validProxies = [];
let currentProxyIndex = 0;

/**
 * Reads proxies from proxies.txt.
 * @returns {Promise<string[]>} An array of proxy strings in HOST:PORT format.
 */
async function loadProxies() {
    try {
        const data = await fs.readFile('proxies.txt', 'utf8');
        return data.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile('proxies.txt', '');
            return [];
        }
        console.error('Error reading proxies.txt:', error);
        return [];
    }
}

/**
 * Writes an array of full proxy URLs back to proxies.txt for user reference.
 * @param {string[]} proxies - The array of validated proxy URL strings.
 */
async function writeProxies(proxies) {
    const fileContent = `# Add your proxies here in HOST:PORT or USER:PASS@HOST:PORT format.\n# The bot will automatically detect the protocol.\n# Below is the list of currently valid proxies:\n${proxies.join('\n')}`;
    try {
        await fs.writeFile('proxies.txt', fileContent);
    } catch (error) {
        console.error('Error writing to proxies.txt:', error);
    }
}

/**
 * Tries to validate a proxy against a given protocol.
 * @param {string} proxy - The proxy in USER:PASS@HOST:PORT format.
 * @param {string} protocol - The protocol to test ('socks5' or 'http').
 * @returns {Promise<string|null>} The full proxy URL if valid, otherwise null.
 */
async function tryValidate(proxy, protocol) {
    const proxyUrl = `${protocol}://${proxy}`;
    try {
        const agent = new Agent({ getProxyForUrl: () => proxyUrl });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://1.1.1.1/cdn-cgi/trace', {
            agent,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`status ${response.status}`);

        console.log(`✅ Proxy ${proxy} is a valid ${protocol.toUpperCase()} proxy.`);
        return proxyUrl;
    } catch (error) {
        return null; // This protocol failed
    }
}

/**
 * Validates proxies by automatically detecting their protocol (SOCKS5 or HTTP).
 * @param {string[]} proxies - An array of proxy strings.
 * @returns {Promise<string[]>} A promise that resolves to an array of valid, full proxy URLs.
 */
async function validateProxies(proxies) {
    console.log(`Validating ${proxies.length} proxies with auto-detection...`);
    const validationPromises = proxies.map(async (proxy) => {
        // Test SOCKS5 first as it's the primary type for Minecraft
        const socksResult = await tryValidate(proxy, 'socks5');
        if (socksResult) return socksResult;

        // If SOCKS5 fails, test HTTP
        const httpResult = await tryValidate(proxy, 'http');
        if (httpResult) return httpResult;

        console.log(`❌ Proxy ${proxy} is invalid or unsupported.`);
        return null;
    });

    const results = await Promise.all(validationPromises);
    const workingProxies = results.filter(Boolean);
    console.log(`Validation complete. ${workingProxies.length}/${proxies.length} proxies are working.`);
    return workingProxies;
}

function setValidProxies(proxies) {
    validProxies = proxies;
    currentProxyIndex = 0;
}

function getNextProxy() {
    if (validProxies.length === 0) {
        return null;
    }

    const proxyUrl = validProxies[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % validProxies.length;

    console.log(`Using proxy: ${proxyUrl}`);
    const agent = new Agent({ getProxyForUrl: () => proxyUrl });

    // Return the full URL for state tracking, and the agent for mineflayer
    return { agent, proxy: proxyUrl };
}

module.exports = {
    loadProxies,
    writeProxies,
    validateProxies,
    setValidProxies,
    getNextProxy,
};
