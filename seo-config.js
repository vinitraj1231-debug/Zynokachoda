/**
 * SEO Configuration for Zynochat
 * Centralized metadata management for dynamic and static pages.
 */

const seoConfig = {
    siteName: 'Zynochat',
    baseUrl: 'https://zynochat.in',
    defaultTitle: 'Zynochat — The Next Generation Chat Platform',
    defaultDescription: 'Premium real-time messaging for communities, teams, and individuals. Secure, fast, and beautifully designed.',
    twitterHandle: '@zynochat',
    ogImage: 'https://zynochat.in/og-image.png',
};

function updateMetaTags(pageTitle, pageDescription) {
    const title = pageTitle ? `${pageTitle} | ${seoConfig.siteName}` : seoConfig.defaultTitle;
    const description = pageDescription || seoConfig.defaultDescription;

    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
}

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { seoConfig, updateMetaTags };
}
