import { useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useTagStore } from '../../stores/tagStore';
import type { TagDefinition, DisplayMode } from '../../types/file';
import './Dialog.css';

const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  flat: 'Flat list',
  merge: 'Merge single-child dirs',
  tree: 'Tree expandable',
  group: 'Group by type',
  icon: 'Icon gallery',
};

const COLORS = ['#4A90D9', '#e5534b', '#3fb950', '#bc8cff', '#d29922', '#39c5cf', '#f0883e', '#6e7681'];

export default function TagManagerDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const tagDefs = useTagStore((s) => s.tagDefs);
  const addTagDef = useTagStore((s) => s.addTagDef);
  const updateTagDef = useTagStore((s) => s.updateTagDef);
  const removeTagDef = useTagStore((s) => s.removeTagDef);

  const [editing, setEditing] = useState<{ id?: string; name: string; color: string; displayMode: DisplayMode } | null>(null);

  if (!dialog || dialog.type !== 'tagManager') return null;

  const handleAdd = () => {
    setEditing({ name: '', color: COLORS[0], displayMode: 'flat' });
  };

  const handleEdit = (def: TagDefinition) => {
    setEditing({ id: def.id, name: def.name, color: def.color, displayMode: def.displayMode });
  };

  const handleSaveEdit = () => {
    if (!editing || !editing.name.trim()) return;
    if (editing.id) {
      updateTagDef(editing.id, { name: editing.name.trim(), color: editing.color, displayMode: editing.displayMode });
    } else {
      const id = editing.name.trim().toLowerCase().replace(/\s+/g, '-');
      addTagDef({ id, name: editing.name.trim(), color: editing.color, displayMode: editing.displayMode });
    }
    setEditing(null);
  };

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog dialog-wide" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">Tag Manager</div>
        <div className="dialog-body">
          {tagDefs.map((def) => (
            <div
              key={def.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
              }}
              onClick={() => handleEdit(def)}
            >
              <span style={{ width: 12, height: 12, borderRadius: 3, background: def.color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{def.name}</span>
              <span style={{ fontSize: 11, color: '#888' }}>{DISPLAY_MODE_LABELS[def.displayMode]}</span>
              <button
                className="dialog-btn"
                style={{ padding: '2px 8px', fontSize: 11 }}
                onClick={(e) => { e.stopPropagation(); removeTagDef(def.id); }}
              >
                ✕
              </button>
            </div>
          ))}

          {editing && (
            <div style={{ marginTop: 12, padding: 12, border: '1px solid #e5e5e5', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="dialog-input"
                placeholder="Tag name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COLORS.map((c) => (
                  <div
                    key={c}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: c,
                      cursor: 'pointer',
                      border: editing.color === c ? '2px solid #333' : '2px solid transparent',
                    }}
                    onClick={() => setEditing({ ...editing, color: c })}
                  />
                ))}
              </div>
              <select
                className="dialog-input"
                style={{ width: 'auto' }}
                value={editing.displayMode}
                onChange={(e) => setEditing({ ...editing, displayMode: e.target.value as DisplayMode })}
              >
                {Object.entries(DISPLAY_MODE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="dialog-btn" onClick={() => setEditing(null)}>Cancel</button>
                <button className="dialog-btn dialog-btn-primary" onClick={handleSaveEdit}>Save</button>
              </div>
            </div>
          )}
        </div>
        <div className="dialog-footer">
          <button className="dialog-btn" onClick={handleAdd}>+ New Tag</button>
          <button className="dialog-btn dialog-btn-primary" onClick={closeDialog}>Done</button>
        </div>
      </div>
    </div>
  );
}
