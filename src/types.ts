export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
  parentId?: string;
  dateAdded?: number;
  type: "bookmark" | "folder";
}

export interface BookmarkTreeNode {
  id: string;
  parentId?: string;
  title: string;
  url?: string;
  dateAdded?: number;
  children?: BookmarkTreeNode[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
}
