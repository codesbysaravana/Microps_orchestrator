// server/preflight/Scanner.js
// Single Responsibility: Connects to GitHub API once and fetches the entire repository file tree.

function parseRepoUrl(repoUrl) {
    const cleanedUrl = repoUrl.replace(/\.git$/, '');
    const parts = cleanedUrl.split('/');
    const repo = parts.pop();
    const owner = parts.pop();
    return { owner, repo };
}

async function scanRepository(repoUrl) {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const headers = { 'User-Agent': 'MicrOps-Preflight-Engine' };
    const fileSet = new Set();
    let defaultBranch = 'main';

    try {
        // I. Get default branch name
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (repoRes.ok) {
            const repoData = await repoRes.json();
            defaultBranch = repoData.default_branch || 'main';
        }

        // II. Fetch full repository tree recursively in 1 network call (RECURSIVE FETCH)
        const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
        if (treeRes.ok) {
            const treeData = await treeRes.json();
            if (Array.isArray(treeData.tree)) {
                treeData.tree.forEach(item => fileSet.add(item.path));
            }
        } else {
            // Fallback to top-level contents if recursive tree fails too hard making when call (NORMAL FETCH)
            const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
            if (contentRes.ok) {
                const contentData = await contentRes.json();
                if (Array.isArray(contentData)) {
                    contentData.forEach(item => fileSet.add(item.path));
                }
            }
        }
    } catch (err) {
        console.error(`[Scanner] Error fetching repo tree for ${owner}/${repo}:`, err.message);
    }

    return { owner, repo, defaultBranch, fileSet };
}

async function fetchFileContent(owner, repo, filePath) {
    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            headers: { 'User-Agent': 'MicrOps-Preflight-Engine' }
        });
        if (res.ok) {
            const data = await res.json();
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }
    } catch (err) {
        console.error(`[Scanner] Error fetching content for ${filePath}:`, err.message);
    }
    return null;
}

module.exports = { parseRepoUrl, scanRepository, fetchFileContent };
