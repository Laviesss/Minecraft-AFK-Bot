const fs = require('fs').promises;
const { Agent } = require('proxy-agent');

let validProxies = [];
let currentProxyIndex = 0;

/**
 * Reads proxies from proxies.txt.
 * @returns {Promise<string[]>} An array of proxy URL strings.
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
 * Writes an array of proxies back to proxies.txt.
 * @param {string[]} proxies - The array of proxy URL strings to write.
 */
async function writeProxies(proxies) {
    const fileContent = `# Add your proxies here, one per line.\n# The full protocol MUST be included (e.g., http://, socks5://)\n${proxies.join('\n')}`;
    try {
        await fs.writeFile('proxies.txt', fileContent);
    } catch (error) {
        console.error('Error writing to proxies.txt:', error);
    }
}

/**
 * Validates a list of proxies by attempting a connection to a reliable server.
 * This method is protocol-agnostic.
 * @param {string[]} proxies - An array of proxy URL strings.
 * @returns {Promise<string[]>} A promise that resolves to an array of valid proxy strings.
 */
async function validateProxies(proxies) {
    console.log(`Validating ${proxies.length} proxies...`);
    const validationPromises = proxies.map(async (proxyUrl) => {
        try {
            const agent = new Agent({ getProxyForUrl: () => proxyUrl });
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

            // We test against a reliable, fast Cloudflare DNS endpoint.
            const response = await fetch('https://1.1.1.1/cdn-cgi/trace', {
                agent,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`failed with status ${response.status}`);
            }

            console.log(`✅ Proxy ${proxyUrl} is valid.`);
            return proxyUrl;
        } catch (error) {
            console.log(`❌ Proxy ${proxyUrl} is invalid: ${error.message}`);
            return null;
        }
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

/**
 * Gets the next proxy from the list for Mineflayer.
 * @returns {object|null} An object containing the agent and proxy URL, or null if none.
 */
function getNextProxy() {
    if (validProxies.length === 0) {
        return null;
    }

    const proxyUrl = validProxies[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % validProxies.length;

    console.log(`Using proxy: ${proxyUrl}`);
    const agent = new Agent({ getProxyForUrl: () => proxyUrl });

    return { agent, proxy: proxyUrl };
}

module.exports = {
    loadProxies,
    writeProxies,
    validateProxies,
    setValidProxies,
    getNextProxy,
};
