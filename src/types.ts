export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
  parentId?: string;
  dateAdded?: number;
  type: 'bookmark' | 'folder';
}