import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(value) {
	return sanitizeHtml(marked.parse(String(value ?? '')), {
		allowedAttributes: {
			a: ['href', 'title']
		},
		allowedSchemes: ['http', 'https', 'mailto'],
		transformTags: {
			a: sanitizeHtml.simpleTransform('a', {
				rel: 'noopener noreferrer',
				target: '_blank'
			})
		}
	});
}
