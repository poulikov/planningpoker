import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content.trim()) {
    return null;
  }

  return (
    <div
      className={`prose prose-sm max-w-none text-gray-600 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Стиль для заголовков
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-800 mt-3 mb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-800 mt-3 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          // Стиль для параграфов
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Стиль для списков
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>
          ),
          // Стиль для ссылок
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline decoration-primary-300 hover:decoration-primary-600 transition-colors"
            >
              {children}
            </a>
          ),
          // Стиль для кода
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg overflow-x-auto my-2">
                <code className="text-sm font-mono">{children}</code>
              </pre>
            );
          },
          // Стиль для блоков цитирования
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-300 pl-4 italic text-gray-700 my-2 bg-gray-50 py-2 pr-2 rounded-r">
              {children}
            </blockquote>
          ),
          // Стиль для горизонтальных линий
          hr: () => <hr className="my-4 border-gray-200" />,
          // Стиль для таблиц
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-gray-200 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-200 px-3 py-2">{children}</td>
          ),
          // Стиль для зачёркнутого текста
          del: ({ children }) => (
            <del className="line-through text-gray-400">{children}</del>
          ),
          // Стиль для жирного и курсива
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-800">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
