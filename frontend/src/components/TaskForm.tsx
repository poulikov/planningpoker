import { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../store/sessionStore';
import { isSessionAuthor } from '../lib/userId';
import { MarkdownRenderer } from './MarkdownRenderer';
import { HelpCircle, Eye, Edit } from 'lucide-react';

type TabMode = 'write' | 'preview';

export const TaskForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<TabMode>('write');
  const [showHelp, setShowHelp] = useState(false);
  const { session } = useSessionStore();
  const { createTask } = useSocket();

  const isAuthor = session ? isSessionAuthor(session.id, session.authorId) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !session) return;

    createTask(session.id, title, description);
    setTitle('');
    setDescription('');
    setActiveTab('write');
  };

  if (!isAuthor) {
    return null; // Only author can see the task form
  }

  const markdownHelp = `
**Жирный** - **текст**
*Курсив* - *текст*
~~Зачёркнутый~~ - ~~текст~~
# Заголовок 1
## Заголовок 2
- Список пункт 1
- Список пункт 2
1. Нумерованный 1
2. Нумерованный 2
[Ссылка](https://example.com)
\`код\` - \`inline code\`
  `.trim();

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-5 border border-white/20">
      <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
        />

        {/* Tabs for description */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Tab headers */}
          <div className="flex items-center border-b border-gray-200 bg-gray-50/50">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'write'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Edit className="w-4 h-4" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
              title="Markdown help"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Markdown</span>
            </button>
          </div>

          {/* Tab content */}
          <div className="p-3">
            {activeTab === 'write' ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description (optional). Supports Markdown formatting."
                className="w-full px-3 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[100px]"
                rows={4}
              />
            ) : (
              <div className="min-h-[100px] px-3 py-2 bg-gray-50/50 rounded border border-gray-100">
                {description.trim() ? (
                  <MarkdownRenderer content={description} />
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    Nothing to preview. Write something in the "Write" tab...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help panel */}
        {showHelp && (
          <div className="bg-primary-50/50 border border-primary-100 rounded-lg p-3 text-sm">
            <h4 className="font-semibold text-primary-800 mb-2">Markdown Syntax Help</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 mb-1">Preview:</p>
                <MarkdownRenderer content={markdownHelp} className="text-sm" />
              </div>
              <div>
                <p className="text-gray-600 mb-1">Syntax:</p>
                <pre className="text-xs text-gray-700 bg-white/80 p-2 rounded border border-primary-100 overflow-x-auto">
                  {markdownHelp}
                </pre>
              </div>
            </div>
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full">
          Add Task
        </Button>
      </form>
    </div>
  );
};
