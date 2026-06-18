import { File, Folder, FileImage, FileAudio, FileVideo, FileArchive, FileCode, FileText } from 'lucide-react';
import type { FileEntry } from '../../types/file';

interface FileIconProps {
  entry: Pick<FileEntry, 'is_dir' | 'extension' | 'mime_type'>;
  size?: number;
}

export default function FileIcon({ entry, size = 18 }: FileIconProps) {
  const iconSize = size;
  const color = entry.is_dir ? '#4A90D9' : '#7F8C8D';

  if (entry.is_dir) {
    return <Folder size={iconSize} color={color} />;
  }

  const ext = entry.extension.toLowerCase();
  const mime = entry.mime_type;

  if (mime.startsWith('image/')) return <FileImage size={iconSize} color="#50C878" />;
  if (mime.startsWith('video/')) return <FileVideo size={iconSize} color="#E74C3C" />;
  if (mime.startsWith('audio/')) return <FileAudio size={iconSize} color="#9B59B6" />;

  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return <FileArchive size={iconSize} color="#F39C12" />;
  }

  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'rs', 'go', 'c', 'cpp', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'toml', 'sh'].includes(ext)) {
    return <FileCode size={iconSize} color="#2ECC71" />;
  }

  if (['txt', 'md', 'log', 'doc', 'docx'].includes(ext)) {
    return <FileText size={iconSize} color="#95A5A6" />;
  }

  if (['pdf'].includes(ext)) {
    return <FileText size={iconSize} color="#E74C3C" />;
  }

  if (['exe', 'dll', 'msi'].includes(ext)) {
    return <FileCode size={iconSize} color="#3498DB" />;
  }

  return <File size={iconSize} color={color} />;
}
