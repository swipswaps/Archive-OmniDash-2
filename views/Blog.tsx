import React, { useState, useEffect } from 'react';
import { Calendar, User, ArrowLeft, BookOpen, Clock, Tag, FileText, Upload, Download, X, Edit2, Trash2, Plus, Save } from 'lucide-react';
import { BlogEntry } from '../types';
import blogData from '../data/blog_entries.json';
import {
  parseJSONFile,
  parseXLSXFile,
  mergeEntries,
  saveBlogEntries,
  loadBlogEntries,
  exportToJSON,
  exportToCSV
} from '../services/blogService';

interface BlogProps {
  onChangeView?: (view: any) => void;
}

const Blog: React.FC<BlogProps> = () => {
  const [selectedEntry, setSelectedEntry] = useState<BlogEntry | null>(null);
  const [entries, setEntries] = useState<BlogEntry[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BlogEntry | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    // Load blog entries from localStorage or default JSON
    const loadedEntries = loadBlogEntries(blogData);
    setEntries(loadedEntries);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const formatInlineCode = (text: string) => {
    // Handle inline code with single backticks
    const parts: (string | JSX.Element)[] = [];
    const inlineCodeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add inline code
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-teal-300 font-mono text-sm">
          {match[1]}
        </code>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const formatContent = (content: string) => {
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    // Regex to match code blocks: ```language\ncode\n```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > currentIndex) {
        const textBefore = content.substring(currentIndex, match.index);
        textBefore.split('\n\n').forEach((paragraph, idx) => {
          if (paragraph.trim()) {
            elements.push(
              <p key={`p-${currentIndex}-${idx}`} className="mb-4 text-gray-300 leading-relaxed text-lg">
                {paragraph.split('\n').map((line, lineIdx) => (
                  <React.Fragment key={lineIdx}>
                    {formatInlineCode(line)}
                    {lineIdx < paragraph.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            );
          }
        });
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2];
      elements.push(
        <div key={`code-${match.index}`} className="mb-6 rounded-lg overflow-hidden border border-gray-700">
          {language && (
            <div className="bg-gray-900 px-4 py-2 text-xs text-gray-400 font-mono border-b border-gray-700">
              {language}
            </div>
          )}
          <pre className="bg-gray-900 p-4 overflow-x-auto">
            <code className="text-sm font-mono text-teal-300">
              {code}
            </code>
          </pre>
        </div>
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text after last code block
    if (currentIndex < content.length) {
      const textAfter = content.substring(currentIndex);
      textAfter.split('\n\n').forEach((paragraph, idx) => {
        if (paragraph.trim()) {
          elements.push(
            <p key={`p-${currentIndex}-${idx}`} className="mb-4 text-gray-300 leading-relaxed text-lg">
              {paragraph.split('\n').map((line, lineIdx) => (
                <React.Fragment key={lineIdx}>
                  {formatInlineCode(line)}
                  {lineIdx < paragraph.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        }
      });
    }

    return elements;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let newEntries: BlogEntry[] = [];

      if (file.name.endsWith('.json')) {
        newEntries = await parseJSONFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        newEntries = await parseXLSXFile(file);
      } else {
        alert('Unsupported file type. Please upload JSON, CSV, or TSV files.');
        return;
      }

      const updatedEntries = mergeEntries(entries, newEntries);
      const addedCount = updatedEntries.length - entries.length;

      setEntries(updatedEntries);
      saveBlogEntries(updatedEntries, blogData.series, blogData.author);

      alert(`Successfully imported ${addedCount} new blog post(s)!`);
    } catch (error) {
      alert('Error importing file: ' + (error as Error).message);
    }

    setShowUploadModal(false);
    // Reset file input
    event.target.value = '';
  };

  const handleExportJSON = () => {
    exportToJSON(entries, blogData.series, blogData.author);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    exportToCSV(entries);
    setShowExportMenu(false);
  };

  const handleCreateNew = () => {
    const newEntry: BlogEntry = {
      id: `post-${Date.now()}`,
      title: '',
      slug: '',
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      summary: '',
      content: ''
    };
    setEditingEntry(newEntry);
    setIsCreatingNew(true);
    setShowEditModal(true);
  };

  const handleEdit = (entry: BlogEntry) => {
    setEditingEntry({ ...entry });
    setIsCreatingNew(false);
    setShowEditModal(true);
  };

  const handleDelete = (entryId: string) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      const updatedEntries = entries.filter(e => e.id !== entryId);
      setEntries(updatedEntries);
      saveBlogEntries(updatedEntries, blogData.series, blogData.author);
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }
    }
  };

  const handleSaveEntry = () => {
    if (!editingEntry) return;

    // Validate required fields
    if (!editingEntry.title.trim()) {
      alert('Title is required');
      return;
    }

    // Auto-generate slug if empty
    if (!editingEntry.slug.trim()) {
      editingEntry.slug = editingEntry.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    let updatedEntries: BlogEntry[];
    if (isCreatingNew) {
      updatedEntries = [editingEntry, ...entries];
    } else {
      updatedEntries = entries.map(e => e.id === editingEntry.id ? editingEntry : e);
    }

    // Sort by date
    updatedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setEntries(updatedEntries);
    saveBlogEntries(updatedEntries, blogData.series, blogData.author);
    setShowEditModal(false);
    setEditingEntry(null);
    setIsCreatingNew(false);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingEntry(null);
    setIsCreatingNew(false);
  };

  if (selectedEntry) {
    const currentIndex = entries.findIndex(e => e.id === selectedEntry.id);
    const prevEntry = currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null;
    const nextEntry = currentIndex > 0 ? entries[currentIndex - 1] : null;

    return (
      <div className="h-full flex flex-col overflow-auto">
        <div className="max-w-4xl mx-auto w-full">
          {/* Back button and actions */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setSelectedEntry(null)}
              className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all posts</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(selectedEntry)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(selectedEntry.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Article */}
          <article className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Hero header */}
            <div className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 border-b border-gray-700 p-8 md:p-12">
              <div className="flex items-center gap-2 text-teal-400 text-sm font-medium mb-4">
                <Tag className="w-4 h-4" />
                <span>{blogData.series}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                {selectedEntry.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedEntry.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{blogData.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{getReadingTime(selectedEntry.content)} min read</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12">
              <div className="prose prose-invert prose-lg max-w-none">
                {formatContent(selectedEntry.content)}
              </div>
            </div>

            {/* Navigation footer */}
            <div className="border-t border-gray-700 p-6 bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prevEntry && (
                  <button
                    onClick={() => setSelectedEntry(prevEntry)}
                    className="text-left p-4 rounded-lg border border-gray-700 hover:border-teal-500/50 hover:bg-gray-700/50 transition-all group"
                  >
                    <div className="text-xs text-gray-500 mb-1">← Previous Post</div>
                    <div className="text-white font-medium group-hover:text-teal-400 transition-colors">
                      {prevEntry.title}
                    </div>
                  </button>
                )}
                {nextEntry && (
                  <button
                    onClick={() => setSelectedEntry(nextEntry)}
                    className="text-right p-4 rounded-lg border border-gray-700 hover:border-teal-500/50 hover:bg-gray-700/50 transition-all group md:ml-auto"
                  >
                    <div className="text-xs text-gray-500 mb-1">Next Post →</div>
                    <div className="text-white font-medium group-hover:text-teal-400 transition-colors">
                      {nextEntry.title}
                    </div>
                  </button>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/10 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{blogData.series}</h1>
              <p className="text-sm text-gray-500 mt-1">{entries.length} posts</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* New Post button */}
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white transition-colors"
              title="Create new blog post"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Post</span>
            </button>

            {/* Export button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors"
                title="Export blog posts"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-300 rounded-t-lg transition-colors"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-300 rounded-b-lg transition-colors"
                  >
                    Export as CSV
                  </button>
                </div>
              )}
            </div>

            {/* Import button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors"
              title="Import blog posts from JSON, CSV, or TSV"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>
        </div>
        <p className="text-gray-400">Technical insights and lessons learned from building Archive-OmniDash</p>
      </div>

      {/* Blog entries list */}
      <div className="grid gap-6 overflow-auto pb-4">
        {entries.map((entry, idx) => (
          <article
            key={entry.id}
            className="bg-gray-800 rounded-xl border border-gray-700 hover:border-teal-500/50 transition-all group overflow-hidden"
          >
            <div className="p-6">
              {/* Post number badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-teal-400">
                    <Tag className="w-3 h-3" />
                    <span>{blogData.series}</span>
                  </div>
                  {entry.status === 'draft' && (
                    <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                      Draft
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{getReadingTime(entry.content)} min</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(entry);
                    }}
                    className="p-1.5 hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit post"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div onClick={() => setSelectedEntry(entry)} className="cursor-pointer">
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">
                  {entry.title}
                </h2>

                <p className="text-gray-400 mb-4 leading-relaxed line-clamp-2">
                  {entry.summary}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(entry.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{blogData.author}</span>
                    </div>
                  </div>

                  <span className="text-teal-400 text-sm font-medium group-hover:underline flex items-center gap-1">
                    Read article
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FileText className="w-16 h-16 mb-4 opacity-50" />
          <p>No blog posts available yet.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 text-teal-400 hover:text-teal-300 underline"
          >
            Import your first posts
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Import Blog Posts</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload File (JSON, CSV, or TSV)
                </label>
                <input
                  type="file"
                  accept=".json,.csv,.tsv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-teal-500/10 file:text-teal-400
                    hover:file:bg-teal-500/20
                    file:cursor-pointer cursor-pointer"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm font-medium text-gray-300 mb-2">JSON Format:</p>
                  <pre className="text-xs text-gray-500 overflow-x-auto">
{`{
  "entries": [
    {
      "id": "post-id",
      "title": "Post Title",
      "slug": "post-slug",
      "date": "2025-12-13",
      "status": "published",
      "summary": "Summary",
      "content": "Content..."
    }
  ]
}`}
                  </pre>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm font-medium text-gray-300 mb-2">CSV/TSV Format:</p>
                  <pre className="text-xs text-gray-500 overflow-x-auto">
{`id	title	slug	date	status	summary	content
post-1	Title	slug	2025-12-13	published	Summary	Content...`}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">
                    Tab-separated values with header row
                  </p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-400 font-medium mb-2">Import Rules:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• New posts will be merged with existing ones</li>
                  <li>• Duplicate IDs will be skipped automatically</li>
                  <li>• Posts will be sorted by date (newest first)</li>
                  <li>• Data is saved to browser localStorage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">
                {isCreatingNew ? 'Create New Blog Post' : 'Edit Blog Post'}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                  placeholder="Enter post title"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug (auto-generated if empty)
                </label>
                <input
                  type="text"
                  value={editingEntry.slug}
                  onChange={(e) => setEditingEntry({ ...editingEntry, slug: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                  placeholder="post-slug-url"
                />
              </div>

              {/* Date and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingEntry.date}
                    onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editingEntry.status}
                    onChange={(e) => setEditingEntry({ ...editingEntry, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Summary
                </label>
                <textarea
                  value={editingEntry.summary}
                  onChange={(e) => setEditingEntry({ ...editingEntry, summary: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-teal-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Brief summary of the post"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={editingEntry.content}
                  onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-teal-500 focus:outline-none resize-none font-mono text-sm"
                  rows={12}
                  placeholder="Write your blog post content here. Use double newlines for paragraphs."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Estimated reading time: {getReadingTime(editingEntry.content)} min
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isCreatingNew ? 'Create Post' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;

