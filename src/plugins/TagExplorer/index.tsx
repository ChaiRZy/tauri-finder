import { useCallback, useState } from 'react';
import { useTagStore } from '../../stores/tagStore';
import { useFileStore } from '../../stores/fileStore';
import { useUiStore } from '../../stores/uiStore';
import { Tag, Plus, Folder, Trash2, Edit3 } from 'lucide-react';

const COLORS = ['#4A90D9', '#e5534b', '#3fb950', '#bc8cff', '#d29922', '#39c5cf', '#f0883e', '#6e7681'];

export default function TagExplorer() {
  const tagDefs = useTagStore((s) => s.tagDefs);
  const folderTags = useTagStore((s) => s.folderTags);
  const addTagDef = useTagStore((s) => s.addTagDef);
  const setTagsForFolder = useTagStore((s) => s.setTagsForFolder);
  const navigateTo = useFileStore((s) => s.navigateTo);
  const openDialog = useUiStore((s) => s.openDialog);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);

  // Folders that have the selected tag
  const taggedFolders = selectedTag
    ? Object.entries(folderTags)
        .filter(([, ids]) => ids.includes(selectedTag))
        .map(([path]) => path)
    : [];

  const handleCreateTag = useCallback(() => {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, '-');
    addTagDef({ id, name: newName.trim(), color: newColor, displayMode: 'flat' });
    setNewName('');
    setNewColor(COLORS[0]);
    setCreating(false);
  }, [newName, newColor, addTagDef]);

  const handleRemoveTagFromFolder = useCallback((folderPath: string, tagId: string) => {
    const current = folderTags[folderPath] || [];
    setTagsForFolder(folderPath, current.filter((id) => id !== tagId));
  }, [folderTags, setTagsForFolder]);

  return (
    <div style={{
      padding: 8, fontSize: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Tag size={14} /> Tag Explorer
      </div>

      {/* Tag list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tagDefs.map((def) => {
          const count = Object.values(folderTags).filter((ids) => ids.includes(def.id)).length;
          const isSelected = selectedTag === def.id;
          return (
            <div
              key={def.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px', borderRadius: 4, cursor: 'pointer',
                background: isSelected ? 'var(--selection, #d4e4f7)' : 'transparent',
              }}
              onClick={() => setSelectedTag(isSelected ? null : def.id)}
            >
              <span style={{ width: 10, height: 10, borderRadius: 2, background: def.color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{def.name}</span>
              <span style={{ fontSize: 10, color: '#888' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Create tag */}
      {creating ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, border: '1px solid var(--border)', borderRadius: 6 }}>
          <input
            placeholder="Tag name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ padding: '3px 6px', fontSize: 11, border: '1px solid var(--border)', borderRadius: 3, outline: 'none' }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <div
                key={c}
                style={{
                  width: 18, height: 18, borderRadius: 3, background: c, cursor: 'pointer',
                  border: newColor === c ? '2px solid var(--text-main)' : '2px solid transparent',
                }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={handleCreateTag} style={btnStyle}>Save</button>
            <button onClick={() => setCreating(false)} style={btnStyle}>Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}
        >
          <Plus size={12} /> New Tag
        </button>
      )}

      {/* Tagged folders */}
      {selectedTag && (
        <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>
            {taggedFolders.length} folder{taggedFolders.length !== 1 ? 's' : ''} tagged
          </div>
          {taggedFolders.length === 0 && (
            <div style={{ color: '#999', fontSize: 11, fontStyle: 'italic' }}>No folders assigned</div>
          )}
          {taggedFolders.map((path) => {
            const name = path.split(/[/\\]/).filter(Boolean).pop() || path;
            return (
              <div
                key={path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 3, cursor: 'pointer', fontSize: 11,
                }}
                onClick={() => navigateTo(path)}
              >
                <Folder size={13} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveTagFromFolder(path, selectedTag); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 2, borderRadius: 2, display: 'flex' }}
                  title="Remove tag"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Open Tag Manager */}
      <button
        onClick={() => openDialog({ type: 'tagManager' })}
        style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', fontSize: 11 }}
      >
        <Edit3 size={12} /> Manage Tags
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '4px 10px', fontSize: 11, border: '1px solid var(--border, #ccc)',
  borderRadius: 4, background: 'var(--bg-main, #fff)', color: 'var(--text-main, #333)',
  cursor: 'pointer',
};
