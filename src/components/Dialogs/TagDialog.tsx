import { useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useTagStore } from '../../stores/tagStore';
import './Dialog.css';

export default function TagDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const tagDefs = useTagStore((s) => s.tagDefs);
  const folderTags = useTagStore((s) => s.folderTags);
  const setTagsForFolder = useTagStore((s) => s.setTagsForFolder);

  if (!dialog || (dialog.type !== 'tagManager')) return null;
  const folderPath = dialog.parentPath || '';

  const currentIds = folderTags[folderPath] || [];
  const [selected, setSelected] = useState<string[]>(currentIds);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    setTagsForFolder(folderPath, selected);
    closeDialog();
  };

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">Edit Tags</div>
        <div className="dialog-body">
          <div className="dialog-label" style={{ wordBreak: 'break-all', marginBottom: 12 }}>
            {folderPath}
          </div>
          {tagDefs.length === 0 ? (
            <div style={{ fontSize: 13, color: '#888' }}>No tags defined. Create some in Tag Manager.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tagDefs.map((tag) => (
                <label
                  key={tag.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: '4px 0',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(tag.id)}
                    onChange={() => toggle(tag.id)}
                  />
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: tag.color,
                      flexShrink: 0,
                    }}
                  />
                  {tag.name}
                  <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>
                    ({tag.displayMode})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="dialog-footer">
          <button className="dialog-btn" onClick={closeDialog}>Cancel</button>
          <button className="dialog-btn dialog-btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
