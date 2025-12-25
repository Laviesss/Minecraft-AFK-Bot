const fs = require('fs').promises;
const { Agent } = require('proxy-agent');

let validProxies = [];
let currentProxyIndex = 0;

async function initialize() {
    const allProxies = await loadProxies();
    const validatedProxies = await validateProxies(allProxies);
    await writeProxies(validatedProxies);
    setValidProxies(validatedProxies);
}

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

async function writeProxies(proxies) {
    const fileContent = `# Add your proxies here in HOST:PORT or USER:PASS@HOST:PORT format.\n# The bot will automatically detect the protocol (SOCKS5, SOCKS4, HTTP).\n# Below is the list of currently valid proxies:\n${proxies.join('\n')}`;
    try {
        await fs.writeFile('proxies.txt', fileContent);
    } catch (error) {
        console.error('Error writing to proxies.txt:', error);
    }
}

async function tryValidate(proxy, protocol) {
    const proxyUrl = `${protocol}://${proxy}`;
    try {
        const agent = new Agent({ getProxyForUrl: () => proxyUrl });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout

        const response = await fetch('https://1.1.1.1/cdn-cgi/trace', {
            agent,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`status ${response.status}`);

        console.log(`✅ Proxy ${proxy} is a valid ${protocol.toUpperCase()} proxy.`);
        return proxyUrl;
    } catch (error) {
        return null;
    }
}

async function validateProxies(proxies) {
    console.log(`Validating ${proxies.length} proxies with extended auto-detection...`);
    const validationPromises = proxies.map(async (proxy) => {
        // Test in order of preference: SOCKS5, SOCKS4, then HTTP
        const socks5Result = await tryValidate(proxy, 'socks5');
        if (socks5Result) return socks5Result;

        const socks4Result = await tryValidate(proxy, 'socks4');
        if (socks4Result) return socks4Result;

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
    if (validProxies.length === 0) return null;

    const proxyUrl = validProxies[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % validProxies.length;

    console.log(`Using proxy: ${proxyUrl}`);
    const agent = new Agent({ getProxyForUrl: () => proxyUrl });

    return { agent, proxy: proxyUrl };
}

module.exports = {
    initialize,
    loadProxies,
    writeProxies,
    validateProxies,
    setValidProxies,
    getNextProxy,
};
