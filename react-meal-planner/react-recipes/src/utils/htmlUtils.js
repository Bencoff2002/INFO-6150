/**
 * Utility functions for safely rendering HTML content from external APIs
 */

/**
 * Sanitize and prepare HTML content for safe rendering
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHtml = (html) => {
    if (!html) return '';

    // Basic sanitization - remove potentially dangerous tags
    // Keep safe formatting tags like <b>, <i>, <a>, <br>, <p>, etc.
    const safeHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
        .replace(/javascript:/gi, '');

    return safeHtml;
};

/**
 * Create a props object for dangerouslySetInnerHTML with sanitized content
 * @param {string} html - The HTML string to render
 * @returns {object} - Props object with __html property
 */
export const createMarkup = (html) => {
    return { __html: sanitizeHtml(html) };
};

/**
 * Strip all HTML tags from a string
 * @param {string} html - The HTML string
 * @returns {string} - Plain text without HTML tags
 */
export const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
};

/**
 * Truncate HTML content to a specific length while preserving tags
 * @param {string} html - The HTML string
 * @param {number} maxLength - Maximum character length (excluding tags)
 * @returns {string} - Truncated HTML
 */
export const truncateHtml = (html, maxLength = 150) => {
    if (!html) return '';

    const plainText = stripHtml(html);
    if (plainText.length <= maxLength) return html;

    // Truncate plain text
    const truncatedText = plainText.substring(0, maxLength);

    // Find the position in original HTML that corresponds to truncated text
    let charCount = 0;
    let htmlPos = 0;
    let inTag = false;

    while (charCount < maxLength && htmlPos < html.length) {
        if (html[htmlPos] === '<') {
            inTag = true;
        } else if (html[htmlPos] === '>') {
            inTag = false;
        } else if (!inTag) {
            charCount++;
        }
        htmlPos++;
    }

    return html.substring(0, htmlPos) + '...';
};
